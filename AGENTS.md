# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Code quality bar

Write clean, professional, senior-level code. No code smells, no quick hacks left behind. Specifically:

- **No fixing render-order bugs with effects.** Don't reset animation/derived state in a `useEffect` to paper over React's async render. Prefer designs that are correct by construction — e.g. give each item a stable `key` so it gets a fresh component instance instead of mutating shared state across items.
- **Keep screens thin.** Business logic (data fetching, session/queue state, scoring, side effects like scheduling/notifications) belongs in a custom hook (e.g. `useReviewSession`), not inline in the screen component. Screens compose hooks + presentational components.
- **Split presentational vs. interactive components.** A stateless view (e.g. `Flashcard`) and the gesture/animation wrapper around it (e.g. `SwipeableFlashcard`) should be separate, reusable files.
- **React Compiler is enabled** (`experiments.reactCompiler: true`). Its lint rules are enforced and must pass:
  - Never read a ref's `.current` during render. For a value captured once at mount, use a lazy `useState(() => ...)` initializer, not `useRef(x).current`.
  - Never call `setState` synchronously inside an effect body.
- **No magic numbers.** Name tuning constants (thresholds, durations, ratios, angles) at the top of the file.
- **Use the design system.** Spacing from `@/constants/theme` (`Spacing.*`), colors from `useTheme()` (`theme.danger`, `theme.success`, …). No hard-coded px/hex except in the theme definition.
- **Accessibility:** interactive `Pressable`s get `accessibilityRole` and an `accessibilityLabel`.
- **Always verify before claiming done:** run `npx tsc --noEmit` and `npx expo lint` on changed files; both must be clean (ignore pre-existing errors in files you didn't touch).
