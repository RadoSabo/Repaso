/**
 * Server-only proxy for OpenAI card generation.
 *
 * The OpenAI key never leaves the server: it is read from `OPENAI_API_KEY` and
 * used here. The mobile app only ever talks to this route. Configure via env:
 *   OPENAI_API_KEY   (required)  secret key, server-side only
 *   OPENAI_MODEL     (optional)  defaults to "gpt-4o-mini"
 *   APP_TOKEN        (optional)  shared bearer token the app must send
 *
 * Deploy with EAS Hosting (`npx expo export -p web` + `eas deploy`) so the
 * route runs server-side; in local dev it is served by the Expo dev server.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_ITEMS = 50;

// Best-effort in-memory rate limit (per server instance). Good enough for an
// MVP; swap for a shared store (KV/Redis) when running multiple instances.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
  },
  required: ['cards'],
} as const;

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is missing OPENAI_API_KEY.' }, 500);
  }

  // Optional shared-token gate.
  const appToken = process.env.APP_TOKEN;
  if (appToken) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${appToken}`) {
      return json({ error: 'Unauthorized.' }, 401);
    }
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return json({ error: 'Too many requests.' }, 429);
  }

  let payload: { knownLang?: unknown; targetLang?: unknown; items?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const knownLang = typeof payload.knownLang === 'string' ? payload.knownLang.trim() : '';
  const targetLang = typeof payload.targetLang === 'string' ? payload.targetLang.trim() : '';
  const items = Array.isArray(payload.items)
    ? payload.items.map((i) => String(i).trim()).filter(Boolean).slice(0, MAX_ITEMS)
    : [];

  if (!knownLang || !targetLang) {
    return json({ error: 'knownLang and targetLang are required.' }, 400);
  }
  if (items.length === 0) {
    return json({ error: 'Provide at least one item.' }, 400);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const system =
    `You are a language-learning assistant that creates flashcards. The learner ` +
    `knows ${knownLang} and is learning ${targetLang}. For EACH input item, write ` +
    `one short, natural sentence in ${knownLang} that uses the item in a clear, ` +
    `everyday context (this is the card FRONT), and the faithful translation of ` +
    `that sentence in ${targetLang} (this is the card BACK). If an item is already ` +
    `a full sentence, use it as the basis directly. Return exactly one card per ` +
    `item, in the same order. Keep sentences concise and learner-friendly.`;

  const user = `Items:\n${items.map((i, n) => `${n + 1}. ${i}`).join('\n')}`;

  let openaiRes: Response;
  try {
    openaiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
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

  let parsed: { cards?: { front?: unknown; back?: unknown }[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return json({ error: 'Could not parse the model output.' }, 502);
  }

  const cards = (parsed.cards ?? [])
    .map((c) => ({ front: String(c.front ?? '').trim(), back: String(c.back ?? '').trim() }))
    .filter((c) => c.front && c.back);

  return json({ cards });
}
