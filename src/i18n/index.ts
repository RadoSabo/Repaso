/**
 * i18next setup. Resources are bundled JSON (no network backend), so `init` is
 * synchronous and the first render already has translations — no loading flash.
 * The initial language is the phone's; a persisted in-app override is applied in
 * the root layout once settings have hydrated (see `app/_layout.tsx`).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, resolveDeviceLanguage } from './languages';
import cs from './locales/cs.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ptBR from './locales/pt-BR.json';
import zhHans from './locales/zh-Hans.json';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-Hans': { translation: zhHans },
  cs: { translation: cs },
} as const;

// `i18n.use`/`i18n.init` are methods on the default export; the unrelated named
// `use` export trips the import rule here.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  returnNull: false,
  interpolation: { escapeValue: false },
});

export default i18n;
