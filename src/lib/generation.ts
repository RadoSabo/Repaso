/**
 * Client for the card-generation proxy (see `app/api/generate+api.ts`).
 * The OpenAI key lives only on the proxy; the app talks to the proxy.
 */

import { PROXY_URL } from './config';

export interface DraftCard {
  front: string;
  back: string;
}

export interface GenerateOptions {
  knownLang: string;
  targetLang: string;
  /** Words / phrases / sentences, one concept per entry. */
  items: string[];
}

export class GenerationError extends Error {}

export async function generateCards(opts: GenerateOptions): Promise<DraftCard[]> {
  const items = opts.items.map((i) => i.trim()).filter(Boolean);
  if (items.length === 0) {
    throw new GenerationError('Add at least one word or phrase to generate cards.');
  }

  const url = `${PROXY_URL}/api/generate`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        knownLang: opts.knownLang,
        targetLang: opts.targetLang,
        items,
      }),
    });
  } catch {
    throw new GenerationError('Could not reach the generation server. Check your connection.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    if (res.status === 429) throw new GenerationError('Rate limited. Please wait a moment and try again.');
    throw new GenerationError(detail || `Generation failed (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as { cards?: DraftCard[] } | null;
  const cards = data?.cards;
  if (!Array.isArray(cards)) {
    throw new GenerationError('The server returned an unexpected response.');
  }

  return cards
    .map((c) => ({ front: String(c.front ?? '').trim(), back: String(c.back ?? '').trim() }))
    .filter((c) => c.front && c.back);
}
