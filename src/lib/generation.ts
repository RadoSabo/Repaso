/**
 * Client for the card-generation proxy (see `app/api/generate+api.ts`).
 * The OpenAI key lives only on the proxy; the app talks to the proxy.
 */

import i18n from '@/i18n';
import { getDeviceId } from './device-id';
import { MAX_CARDS_PER_DECK } from './limits';
import { postToProxy, ProxyError } from './proxy-request';
import { getAppUserId } from './revenuecat';

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

/** `paywall` is true when generation was blocked by the free quota — route to the paywall. */
export class GenerationError extends ProxyError {}

export async function generateCards(opts: GenerateOptions): Promise<GenerateResult> {
  const input = opts.input.trim();
  if (!input) {
    throw new GenerationError(i18n.t('gen.addWord'));
  }

  const max = Math.max(1, Math.min(opts.max ?? MAX_CARDS_PER_DECK, MAX_CARDS_PER_DECK));

  // The server keys the free quota on the device id and gates unlimited use on
  // the RevenueCat app-user-id; getAppUserId is best-effort (empty if the SDK
  // isn't configured in this build).
  const [deviceId, appUserId] = await Promise.all([
    getDeviceId(),
    getAppUserId().catch(() => ''),
  ]);

  const data = await postToProxy<{ cards?: DraftCard[]; omitted?: string[] }>({
    path: '/api/generate',
    body: {
      knownLang: opts.knownLang,
      targetLang: opts.targetLang,
      input,
      outputStyle: opts.outputStyle,
      max,
      deviceId,
      appUserId,
    },
    error: GenerationError,
    cannotReachKey: 'gen.cannotReach',
    paywallKey: 'gen.usedAll',
    rateLimitedKey: 'gen.rateLimited',
    failedKey: 'gen.failed',
  });

  const rawCards = data?.cards;
  if (!Array.isArray(rawCards)) {
    throw new GenerationError(i18n.t('gen.unexpected'));
  }

  const cards = rawCards
    .map((c) => ({ front: String(c.front ?? '').trim(), back: String(c.back ?? '').trim() }))
    .filter((c) => c.front && c.back);
  const omitted = Array.isArray(data?.omitted)
    ? data.omitted.map((o) => String(o ?? '').trim()).filter(Boolean)
    : [];

  return { cards, omitted };
}
