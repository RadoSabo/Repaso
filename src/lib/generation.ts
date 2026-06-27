/**
 * Client for the card-generation proxy (see `app/api/generate+api.ts`).
 * The OpenAI key lives only on the proxy; the app talks to the proxy.
 */

import { PROXY_URL } from './config';
import { MAX_CARDS_PER_DECK } from './limits';

export interface DraftCard {
  front: string;
  back: string;
}

/**
 * The shape of each generated card:
 * - `sentences`: front/back are short natural sentences (default, best for retention).
 * - `words`: front/back are vocabulary pairs, with articles/gender and a brief
 *   sense hint folded into the strings to disambiguate (e.g. back = "die Katze").
 */
export type OutputStyle = 'sentences' | 'words';

export interface GenerateOptions {
  knownLang: string;
  targetLang: string;
  /**
   * Freeform text describing what to study. The model first decides intent:
   * literal content (a word, list, or sentences to convert directly) vs. a topic
   * to expand ("banking and mortgage vocabulary"), then splits it into cards.
   */
  input: string;
  /** Whether to produce sentence cards or vocabulary-pair cards. */
  outputStyle: OutputStyle;
  /** Upper bound on cards to generate. Clamped to [1, MAX_CARDS_PER_DECK]. */
  max?: number;
}

export interface GenerateResult {
  cards: DraftCard[];
  /** Input items the model skipped because the deck's card limit was reached. */
  omitted: string[];
}

export class GenerationError extends Error {}

export async function generateCards(opts: GenerateOptions): Promise<GenerateResult> {
  const input = opts.input.trim();
  if (!input) {
    throw new GenerationError('Add at least one word or phrase to generate cards.');
  }

  const max = Math.max(1, Math.min(opts.max ?? MAX_CARDS_PER_DECK, MAX_CARDS_PER_DECK));

  const url = `${PROXY_URL}/api/generate`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        knownLang: opts.knownLang,
        targetLang: opts.targetLang,
        input,
        outputStyle: opts.outputStyle,
        max,
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

  const data = (await res.json().catch(() => null)) as
    | { cards?: DraftCard[]; omitted?: string[] }
    | null;
  const rawCards = data?.cards;
  if (!Array.isArray(rawCards)) {
    throw new GenerationError('The server returned an unexpected response.');
  }

  const cards = rawCards
    .map((c) => ({ front: String(c.front ?? '').trim(), back: String(c.back ?? '').trim() }))
    .filter((c) => c.front && c.back);
  const omitted = Array.isArray(data?.omitted)
    ? data.omitted.map((o) => String(o ?? '').trim()).filter(Boolean)
    : [];

  return { cards, omitted };
}
