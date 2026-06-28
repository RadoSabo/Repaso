/**
 * The set of languages the app UI is translated into, how a device locale maps
 * onto them, and the default deck-language pair derived from the phone language.
 *
 * Two distinct concepts live here:
 * - `code` is the UI locale (drives which translation file loads).
 * - `deckName` is the canonical English language name stored on a deck and sent
 *   to the generation model (e.g. "German"). It is intentionally *not* localized:
 *   the model and the stored deck data stay stable regardless of UI language.
 */
import { getLocales } from 'expo-localization';

export interface SupportedLanguage {
  /** i18next resource key / UI locale. */
  code: string;
  /** Endonym shown in the language picker (never translated). */
  nativeName: string;
  /** Canonical English language name used for generated decks. */
  deckName: string;
  /** Flag emoji shown beside the native name in the language picker. */
  flag: string;
}

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: 'en', nativeName: 'English', deckName: 'English', flag: '🇬🇧' },
  { code: 'es', nativeName: 'Español', deckName: 'Spanish', flag: '🇪🇸' },
  { code: 'pt-BR', nativeName: 'Português (Brasil)', deckName: 'Portuguese', flag: '🇧🇷' },
  { code: 'fr', nativeName: 'Français', deckName: 'French', flag: '🇫🇷' },
  { code: 'de', nativeName: 'Deutsch', deckName: 'German', flag: '🇩🇪' },
  { code: 'it', nativeName: 'Italiano', deckName: 'Italian', flag: '🇮🇹' },
  { code: 'ja', nativeName: '日本語', deckName: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', nativeName: '한국어', deckName: 'Korean', flag: '🇰🇷' },
  { code: 'zh-Hans', nativeName: '简体中文', deckName: 'Chinese', flag: '🇨🇳' },
  { code: 'cs', nativeName: 'Čeština', deckName: 'Czech', flag: '🇨🇿' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

/** When the phone is English, learners default to studying Spanish. */
const FALLBACK_TARGET_DECK_NAME = 'Spanish';

const byCode = new Map(SUPPORTED_LANGUAGES.map((l) => [l.code, l]));

/** Whether `code` is one of the UI locales the app ships translations for. */
export function isSupportedLanguage(code: string): boolean {
  return byCode.has(code);
}

/**
 * Maps an arbitrary device locale onto a supported UI locale: an exact match
 * first (e.g. "zh-Hans", "pt-BR"), then the bare language code (e.g. "es-MX" →
 * "es", "pt-PT" → "pt-BR", "zh-Hant" → "zh-Hans"), else English.
 */
export function matchSupportedLanguage(locale: {
  languageTag?: string | null;
  languageCode?: string | null;
}): string {
  const tag = locale.languageTag ?? '';
  if (byCode.has(tag)) return tag;

  const language = (locale.languageCode ?? tag.split('-')[0] ?? '').toLowerCase();
  switch (language) {
    case 'pt':
      return 'pt-BR';
    case 'zh':
      return 'zh-Hans';
    default:
      return byCode.has(language) ? language : DEFAULT_LANGUAGE;
  }
}

/** The UI locale implied by the phone's current language settings. */
export function resolveDeviceLanguage(): string {
  const first = getLocales()[0];
  return first ? matchSupportedLanguage(first) : DEFAULT_LANGUAGE;
}

/**
 * Default "I know" / "I'm learning" deck languages derived from the phone
 * language: you already know your phone's language, so it seeds the front side.
 * English speakers default to learning Spanish; everyone else to learning English.
 */
export function defaultDeckLanguages(uiCode: string): { known: string; target: string } {
  const known = byCode.get(uiCode)?.deckName ?? 'English';
  if (known === 'English') return { known: 'English', target: FALLBACK_TARGET_DECK_NAME };
  return { known, target: 'English' };
}
