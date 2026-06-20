/// <reference types="expo/types" />

// Allow side-effect CSS imports (e.g. `import '@/global.css'`) used by the
// Expo theme module. Kept here (not in the auto-generated expo-env.d.ts) so it
// survives regeneration and tsconfig changes.
declare module '*.css';
