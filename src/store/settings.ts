import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

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

export interface SettingsState {
  /** Default language the learner already knows (front side of generated cards). */
  knownLang: string;
  /** Default language the learner is studying (back side of generated cards). */
  targetLang: string;
  themePreference: ThemePreference;
  /** True once the persisted state has finished loading from storage. */
  hydrated: boolean;
  setKnownLang: (v: string) => void;
  setTargetLang: (v: string) => void;
  setThemePreference: (v: ThemePreference) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      knownLang: "English",
      targetLang: "Spanish",
      themePreference: "system",
      hydrated: false,
      setKnownLang: (v) => set({ knownLang: v }),
      setTargetLang: (v) => set({ targetLang: v }),
      setThemePreference: (v) => set({ themePreference: v }),
    }),
    {
      name: "repaso-settings",
      storage: createJSONStorage(() => persistentStorage),
      // Don't persist functions or the transient `hydrated` flag.
      partialize: ({ knownLang, targetLang, themePreference }) => ({
        knownLang,
        targetLang,
        themePreference,
      }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
