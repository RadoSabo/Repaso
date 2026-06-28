import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { defaultDeckLanguages, resolveDeviceLanguage } from "@/i18n/languages";
import type { OutputStyle } from "@/lib/generation";

// During web server rendering (Node) there is no `window`/localStorage, so
// AsyncStorage's web build throws. Fall back to an in-memory store there;
// native and the browser use real persistent storage.
const memoryStorage: StateStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
})();

const persistentStorage: StateStorage =
  Platform.OS !== "web" || typeof window !== "undefined"
    ? AsyncStorage
    : memoryStorage;

export type ThemePreference = "system" | "light" | "dark";

/** UI locale code (e.g. "fr", "pt-BR"); seeded from the phone language. */
export type LanguagePreference = string;

export interface SettingsState {
  /** Default language the learner already knows (front side of generated cards). */
  knownLang: string;
  /** Default language the learner is studying (back side of generated cards). */
  targetLang: string;
  /** Whether generated cards are full sentences or bare vocabulary pairs. */
  outputStyle: OutputStyle;
  themePreference: ThemePreference;
  /** App UI language; defaults to the device language, overridable in settings. */
  languagePreference: LanguagePreference;
  /** False until the user finishes (or skips) the first-launch intro. */
  onboarded: boolean;
  /** True once the persisted state has finished loading from storage. */
  hydrated: boolean;
  setKnownLang: (v: string) => void;
  setTargetLang: (v: string) => void;
  setOutputStyle: (v: OutputStyle) => void;
  setThemePreference: (v: ThemePreference) => void;
  setLanguagePreference: (v: LanguagePreference) => void;
  setOnboarded: (v: boolean) => void;
}

// Seed the default deck languages from the phone language on first launch. This
// is read once at store creation; persist then overrides it with the user's saved
// choice on subsequent launches, so a fresh install gets phone-based defaults.
const deviceLanguage = resolveDeviceLanguage();
const deckDefaults = defaultDeckLanguages(deviceLanguage);

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      knownLang: deckDefaults.known,
      targetLang: deckDefaults.target,
      outputStyle: "sentences",
      themePreference: "system",
      languagePreference: deviceLanguage,
      onboarded: false,
      hydrated: false,
      setKnownLang: (v) => set({ knownLang: v }),
      setTargetLang: (v) => set({ targetLang: v }),
      setOutputStyle: (v) => set({ outputStyle: v }),
      setThemePreference: (v) => set({ themePreference: v }),
      setLanguagePreference: (v) => set({ languagePreference: v }),
      setOnboarded: (v) => set({ onboarded: v }),
    }),
    {
      name: "repaso-settings",
      storage: createJSONStorage(() => persistentStorage),
      // Don't persist functions or the transient `hydrated` flag.
      partialize: ({
        knownLang,
        targetLang,
        outputStyle,
        themePreference,
        languagePreference,
        onboarded,
      }) => ({
        knownLang,
        targetLang,
        outputStyle,
        themePreference,
        languagePreference,
        onboarded,
      }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
