/**
 * Server-only proxy for OpenAI card generation.
 *
 * The OpenAI key never leaves the server: it is read from `OPENAI_API_KEY` and
 * used here. The mobile app only ever talks to this route. Configure via env:
 *   OPENAI_API_KEY   (required)  secret key, server-side only
 *   OPENAI_MODEL     (optional)  defaults to "gpt-5.4-nano"
 *
 * Deploy with EAS Hosting (`npx expo export -p web` + `eas deploy`) so the
 * route runs server-side; in local dev it is served by the Expo dev server.
 *
 * Spend gates (in addition to the IP rate limiter + the OpenAI spend cap): a
 * per-device free-generation quota in Upstash KV, and — once the free allowance
 * is spent — a RevenueCat `unlimited` entitlement check for unlimited use. Both
 * live in `server-proxy.ts`; the client gate is UX only. See
 * docs/plans/mvp-monetization.md.
 */

import { FREE_GENERATIONS, MAX_CARDS_PER_DECK } from '@/lib/limits';
import {
  clientIp,
  getFreeGenCount,
  incrementFreeGen,
  json,
  kvConfigured,
  OPENAI_CHAT_URL,
  rateLimited,
  requirePro,
} from '@/lib/server-proxy';

const MAX_INPUT_CHARS = 4000;

const cardsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          front: { type: 'string' },
          back: { type: 'string' },
        },
        required: ['front', 'back'],
      },
    },
    // Source items the model could not turn into cards because of the `max` cap.
    // Empty when nothing was skipped (or when expanding a topic).
    omitted: { type: 'array', items: { type: 'string' } },
  },
  required: ['cards', 'omitted'],
} as const;

type OutputStyle = 'sentences' | 'words';

/** Builds the system prompt: one prompt, model branches on intent + style. */
function buildSystemPrompt(opts: {
  knownLang: string;
  targetLang: string;
  outputStyle: OutputStyle;
  max: number;
}): string {
  const { knownLang, targetLang, outputStyle, max } = opts;

  const intent =
    `The learner provides freeform input. First decide what they want:\n` +
    `- LITERAL CONTENT: a single word, several words separated by spaces, ` +
    `commas, or new lines, or one or more phrases or full sentences. Make one ` +
    `card per distinct item; treat text that is already a sentence as a single ` +
    `item.\n` +
    `- A TOPIC TO EXPAND: a description or request about a subject (e.g. ` +
    `"banking and mortgage vocabulary", "words about gardening", "I want to ` +
    `learn cooking terms"). Invent the most useful, common items for that topic.\n` +
    `Never produce more than ${max} cards. If the input is a list with more than ` +
    `${max} items, make cards for the first ${max} in the order given and put ` +
    `every item you skipped, written exactly as the learner wrote it, in ` +
    `"omitted". Otherwise "omitted" must be an empty array.`;

  const styleRules =
    outputStyle === 'words'
      ? `Produce VOCABULARY cards. The FRONT is the word or short phrase in ` +
        `${knownLang}; the BACK is its ${targetLang} translation. Keep them as ` +
        `words or short phrases, never full sentences. Where ${targetLang} marks ` +
        `it, include the article/gender on the back (e.g. "die Katze", "el agua"). ` +
        `When a word is ambiguous, add a brief sense hint in parentheses (e.g. ` +
        `front "run (operate)" or back with a short clarifier) so the card is ` +
        `unambiguous.`
      : `Produce SENTENCE cards. The FRONT is a short, natural ${knownLang} ` +
        `sentence that uses the item in clear everyday context (or the sentence ` +
        `itself if the item is already a sentence); the BACK is the faithful ` +
        `${targetLang} translation of that front sentence. Keep sentences ` +
        `concise and learner-friendly.`;

  return (
    `You are a language-learning assistant that creates flashcards. The learner ` +
    `knows ${knownLang} and is learning ${targetLang}.\n\n${intent}\n\n${styleRules}`
  );
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is missing OPENAI_API_KEY.' }, 500);
  }

  if (rateLimited(clientIp(request))) {
    return json({ error: 'Too many requests.' }, 429);
  }

  let payload: {
    knownLang?: unknown;
    targetLang?: unknown;
    input?: unknown;
    outputStyle?: unknown;
    max?: unknown;
    deviceId?: unknown;
    appUserId?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const knownLang = typeof payload.knownLang === 'string' ? payload.knownLang.trim() : '';
  const targetLang = typeof payload.targetLang === 'string' ? payload.targetLang.trim() : '';
  const input =
    typeof payload.input === 'string' ? payload.input.trim().slice(0, MAX_INPUT_CHARS) : '';
  const outputStyle: OutputStyle = payload.outputStyle === 'words' ? 'words' : 'sentences';
  const requestedMax = typeof payload.max === 'number' ? Math.floor(payload.max) : MAX_CARDS_PER_DECK;
  const max = Math.max(1, Math.min(requestedMax, MAX_CARDS_PER_DECK));
  const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : '';
  const appUserId = typeof payload.appUserId === 'string' ? payload.appUserId : '';

  if (!knownLang || !targetLang) {
    return json({ error: 'knownLang and targetLang are required.' }, 400);
  }
  if (!input) {
    return json({ error: 'Provide something to generate from.' }, 400);
  }

  // Free-generation quota. Fail CLOSED: without the KV store the limit can't be
  // enforced, so refuse rather than serve ungated generation. When the free
  // allowance is spent, allow only if the caller has the Pro entitlement —
  // checked just here, not on every free generation. A successful free generation
  // is counted after OpenAI returns ≥1 card (so errors/empties don't count).
  if (!kvConfigured()) {
    return json({ error: 'Server is missing the quota store configuration.' }, 500);
  }
  if (!deviceId) {
    return json({ error: 'Missing device id.' }, 400);
  }
  let countFreeGeneration = false;
  const used = await getFreeGenCount(deviceId);
  if (used >= FREE_GENERATIONS) {
    const pro = await requirePro(appUserId);
    if (!pro) {
      return json({ error: 'Free limit reached.', code: 'limit_reached' }, 402);
    }
  } else {
    countFreeGeneration = true;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5.4-nano';
  const system = buildSystemPrompt({ knownLang, targetLang, outputStyle, max });

  let openaiRes: Response;
  try {
    openaiRes = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'flashcards', strict: true, schema: cardsSchema },
        },
      }),
    });
  } catch {
    return json({ error: 'Failed to reach the model provider.' }, 502);
  }

  if (!openaiRes.ok) {
    // Don't leak provider internals/keys to the client.
    console.error('OpenAI error', openaiRes.status, await openaiRes.text().catch(() => ''));
    return json({ error: 'Card generation failed upstream.' }, 502);
  }

  const completion = (await openaiRes.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;
  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    return json({ error: 'Empty response from the model.' }, 502);
  }

  let parsed: { cards?: { front?: unknown; back?: unknown }[]; omitted?: unknown[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return json({ error: 'Could not parse the model output.' }, 502);
  }

  const cards = (parsed.cards ?? [])
    .map((c) => ({ front: String(c.front ?? '').trim(), back: String(c.back ?? '').trim() }))
    .filter((c) => c.front && c.back)
    .slice(0, max);

  const omitted = (Array.isArray(parsed.omitted) ? parsed.omitted : [])
    .map((o) => String(o ?? '').trim())
    .filter(Boolean);

  // Count the free generation only on success (≥1 card). Best-effort: a KV hiccup
  // must not fail a generation the user already received.
  if (countFreeGeneration && cards.length > 0) {
    await incrementFreeGen(deviceId).catch((e) => console.error('freegen incr failed', e));
  }

  return json({ cards, omitted });
}
