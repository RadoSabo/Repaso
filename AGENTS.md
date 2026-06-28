# Platform

Mobile only: iOS and Android. **No web.** Don't add web-specific code, fallbacks, or `Platform.OS === 'web'` branches, and don't keep a feature working on web at the cost of complexity.

# Expo

Expo has changed. Read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# How to work

**Think before coding.** State assumptions explicitly. If something is unclear or has multiple interpretations, stop and ask — don't pick silently. If a simpler approach exists, say so. Push back when warranted.

**Simplicity first.** The minimum code that solves the problem, nothing speculative. No features beyond what was asked, no abstractions for single-use code, no unrequested configurability, no error handling for impossible cases. If 200 lines could be 50, rewrite it.

**Surgical changes.** Touch only what the task requires. Don't refactor, reformat, or "improve" adjacent code that isn't broken; match existing style. Remove imports/variables your change orphaned; leave pre-existing dead code alone (mention it, don't delete it). Every changed line should trace to the request.

**Goal-driven execution.** Turn the task into a verifiable check before starting ("add validation" → "tests for invalid input pass"). For multi-step work, state a brief plan with a verify step each, then loop until it passes.

# Code quality bar

Clean, senior-level code. No code smells, no hacks left behind.

- **No render-order bugs patched with effects.** Don't reset animation/derived state in `useEffect` to paper over React's async render. Be correct by construction — e.g. a stable `key` per item gives a fresh component instance instead of mutating shared state.
- **Thin screens.** Data fetching, session/queue state, scoring, side effects (scheduling, notifications) live in a hook (e.g. `useReviewSession`). Screens compose hooks + presentational components.
- **Split presentational vs. interactive.** A stateless view (`Flashcard`) and its gesture/animation wrapper (`SwipeableFlashcard`) are separate files.
- **React Compiler is on** (`experiments.reactCompiler: true`); its lint rules must pass:
  - Never read a ref's `.current` during render. For a value captured once at mount, use a lazy `useState(() => ...)` initializer.
  - Never call `setState` synchronously inside an effect body.
- **No magic numbers.** Name tuning constants (thresholds, durations, ratios) at the top of the file.
- **Use the design system.** `Spacing.*` from `@/constants/theme`, colors from `useTheme()`. No hard-coded px/hex outside the theme definition.
- **Accessibility.** Interactive `Pressable`s get `accessibilityRole` and `accessibilityLabel`.

# Internationalization (i18n)

The app is fully translated with `i18next` / `react-i18next`. **No hard-coded user-facing strings** — every label, button, placeholder, alert, or notification a user can read goes through `t('some.key')` from `useTranslation()`, never a literal.

- **Translate into every language.** When you add a key, add it to **all** locale files in `src/i18n/locales/`: `en`, `es`, `pt-BR`, `fr`, `de`, `it`, `ja`, `ko`, `zh-Hans`, `cs`. `en.json` is the source of truth; provide a real translation for each of the others (don't leave English placeholders). The set of languages lives in `src/i18n/languages.ts` (`SUPPORTED_LANGUAGES`) — if it grows, every key must cover the new locale too.
- **Plurals.** Use i18next plural suffixes (`_one` / `_other`, plus `_few` / `_many` for languages that need them — e.g. `cs`, `es`, `fr`, `it`, `pt-BR`) and pass `{ count }`. Don't hand-roll `n === 1 ? … : …`.
- **Interpolation, not concatenation.** Build dynamic text with `{{placeholders}}` inside one key, never by joining translated fragments.
- **Keep keys grouped** under their existing namespace and remove keys your change orphaned across all locale files.
- **Content vs. UI language.** Canonical deck/generation language names (e.g. `deckName: "German"`) are intentionally *not* localized — see `src/i18n/languages.ts`. Only translate UI chrome.

# Verify

Before claiming done, run `npx tsc --noEmit` and `npx expo lint` on changed files; both must be clean (ignore pre-existing errors in files you didn't touch).
