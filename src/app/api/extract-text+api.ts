/**
 * Server-only proxy for reading study material out of an image (Pro-only input).
 *
 * The app sends a base64 image; this route asks a multimodal model to return the
 * words/phrases worth learning from it — verbatim when the photo is already a
 * word or sentence list, but only the key vocabulary when it is prose (a story,
 * an article, a contract). The result drops into the generation field for the
 * user to confirm. The OpenAI key never leaves the server.
 *   OPENAI_API_KEY    (required)  secret key, server-side only
 *   OPENAI_VISION_MODEL (optional) defaults to OPENAI_MODEL, then "gpt-5.4-nano"
 *
 * Image input is Pro-only: this route confirms the caller's RevenueCat
 * `unlimited` entitlement (via `requirePro`) before any OpenAI spend. The client
 * gate is UX only. See docs/plans/mvp-monetization.md.
 */

import { clientIp, json, OPENAI_CHAT_URL, rateLimited, requirePro } from '@/lib/server-proxy';

// Cap the decoded image to keep payloads and vision cost bounded (~8 MB of
// base64 ≈ a high-res phone photo).
const MAX_IMAGE_BASE64_CHARS = 8_000_000;

const SYSTEM_PROMPT =
  'You turn a photo of text into study material for a language learner. Output ' +
  'one item per line — a single word or a single sentence — with no numbering, ' +
  'bullets, quotes, or commentary.\n' +
  'Decide from the content:\n' +
  '- If the image is already a study list (words or short phrases separated by ' +
  'commas or line breaks, or sentences each on their own line), return every ' +
  'item verbatim, one per line.\n' +
  '- If the image is running prose (a story, an article, notes in paragraphs, a ' +
  'contract), do NOT return the whole text. Extract only the important, ' +
  'meaningful words or short phrases worth learning, one per line, and skip ' +
  'common filler and function words.\n' +
  'Keep every item in its original language; never translate. Preserve the ' +
  'original wording and diacritics. If there is no meaningful text, return an ' +
  'empty string.';

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is missing OPENAI_API_KEY.' }, 500);
  }

  if (rateLimited(clientIp(request))) {
    return json({ error: 'Too many requests.' }, 429);
  }

  let payload: { imageBase64?: unknown; mimeType?: unknown; appUserId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const appUserId = typeof payload.appUserId === 'string' ? payload.appUserId : '';
  if (!(await requirePro(appUserId))) {
    return json({ error: 'Repaso Pro required.', code: 'pro_required' }, 402);
  }

  const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
  const mimeType = typeof payload.mimeType === 'string' ? payload.mimeType : 'image/jpeg';
  if (!imageBase64) {
    return json({ error: 'No image provided.' }, 400);
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return json({ error: 'Image is too large.' }, 413);
  }

  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-5.4-nano';
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the words worth learning from this image.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
  } catch {
    return json({ error: 'Failed to reach the model provider.' }, 502);
  }

  if (!openaiRes.ok) {
    console.error('OpenAI vision error', openaiRes.status, await openaiRes.text().catch(() => ''));
    return json({ error: 'Reading the image failed upstream.' }, 502);
  }

  const completion = (await openaiRes.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;
  const text = (completion?.choices?.[0]?.message?.content ?? '').trim();

  return json({ text });
}
