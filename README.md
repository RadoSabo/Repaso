# Repaso 📚

**Learn any language by remembering it — not cramming it.**

Repaso is a beautifully simple flashcard app for **iOS and Android** that pairs
proven spaced-repetition science with modern AI. Stop building decks by hand:
**snap a photo of your notes, say a few words out loud, or just type a topic** —
and Repaso writes the cards for you, in the language you're learning. Then it
reminds you to review at exactly the right moment, so words actually stick.

Built with [Expo](https://expo.dev) + React Native. Offline-first, no account
required, fully translated into 10 languages, with a polished light/dark design.

---

## ✨ What makes Repaso special

### 🧠 Spaced repetition that respects your time
Repaso schedules each deck on a gently widening curve — **1 → 2 → 5 → 8 → 14 →
21 → 30 → 60 days**. Review on time and the deck advances to the next interval;
review early just for fun and nothing is penalized. Every deck shows a clear
**"Review"** or **"In N days"** status so you always know what's waiting.

In a session, cards are **shuffled**, you flip to reveal the answer, and tap
**I knew it** or **I didn't**. Missed cards are slipped back into the deck at a
random spot so they resurface before you finish.

### 🔔 Reminders that bring you back
When a deck becomes due, Repaso fires a **local notification** ("Time to review
your Spanish deck") — no servers, no tracking, just a nudge at the right time.

### 🤖 Five ways to create cards — most of them powered by AI
This is the heart of Repaso. You almost never have to type a card by hand:

1. **✍️ Type a topic or a list.** Enter "kitchen vocabulary" or paste a list of
   words — Repaso expands and translates it into a full deck.
2. **🗣️ Generate full sentences.** Choose the *sentences* style and each card's
   front is a natural example sentence using the word, with a faithful
   translation on the back — the best way to remember words in context.
3. **🔤 Or generate clean vocabulary pairs.** Prefer bare word→translation? The
   *words* style adds the right article/gender (e.g. *die Katze*) and a short
   sense hint when a word is ambiguous.
4. **📸 Photograph your notes.** Point your camera at a textbook page, a
   handwritten list, or a whiteboard — Repaso reads the text and turns it into
   cards. _(Pro)_
5. **🎙️ Speak it.** Tap record, say the words or sentences out loud (up to 60s),
   and Repaso transcribes them straight into the generator. _(Pro)_

Write your prompt in **your own native language** — type sentences you want to
learn and Repaso builds cards that teach you to say them in your target
language. Every generated card is **fully editable before you save it**.

### 🌍 Speaks your language
The entire interface is translated into **10 languages** — English, Spanish,
Portuguese (Brazil), French, German, Italian, Japanese, Korean, Simplified
Chinese, and Czech — and Repaso picks the right one from your phone on first
launch. Pick which language you already know and which you're learning, and the
AI does the rest.

### 🎨 Made to be used every day
- Gorgeous **light & dark themes** that follow your system.
- Fluid gesture-driven UI with **swipe-to-delete**, smooth list animations, and
  satisfying card flips (Reanimated).
- **Offline-first:** every deck and card lives on your device. No account, no
  sign-up, nothing to sync.
- **Back up & share** any time — export your decks to a file and import them on
  another device.

### 🆓 Generous free tier, unlimited Pro
| | Free | **Pro** |
| --- | :---: | :---: |
| Create & review unlimited decks | ✅ | ✅ |
| Manual cards | ✅ | ✅ |
| AI card generation | 5 / month | ♾️ Unlimited |
| 📸 Photo → cards | — | ✅ |
| 🎙️ Voice → cards | — | ✅ |

Pro is available as a monthly or annual subscription (with **Restore Purchases**
on any device), handled through RevenueCat.

---

## 🚀 Get it running

```bash
npm install
npx expo start          # press i (iOS) or a (Android)
```

Run the spaced-repetition scheduler tests:

```bash
npm test
```

> Photo, voice, and notifications need a **development or production build**
> (they use native modules) — they won't run in Expo Go.

---

## 🛠️ Tech stack

| Concern | Choice |
| --- | --- |
| Framework | **Expo SDK 56** + Expo Router (file-based routing), TypeScript, React 19 |
| UI & motion | React Native Reanimated 4, Gesture Handler, linear-gradient |
| Local data | `expo-sqlite` + **Drizzle ORM** (live queries) |
| Settings state | **Zustand** (persisted via AsyncStorage) |
| i18n | **i18next** / react-i18next + `expo-localization` (10 locales) |
| AI | Server-side **OpenAI** proxy — text generation, vision OCR, and Whisper-style transcription |
| Capture | `expo-image-picker` (photos), `expo-audio` (voice) |
| Reminders | `expo-notifications` (local, per-deck) |
| Payments | **RevenueCat** (`react-native-purchases`) |
| Design system | Custom theme (`src/constants/theme.ts`) — Fredoka + Nunito + DM Mono, full light/dark palettes |

### Architecture at a glance
- **Local-first.** All user data is in on-device SQLite; the only network calls
  are the AI features, which go through proxy routes — your OpenAI key **never**
  ships in the app.
- **Thin screens, fat hooks.** Screens compose presentational components with
  hooks like `useReviewSession`, `useDeckSummaries`, `useVoiceInput`,
  `useImageInput`, `useGenerationQuota`, `usePaywall`, `useEntitlement`, and
  `useTheme`.
- **Server-enforced limits.** The free generation quota and Pro gating are
  verified on the proxy (against RevenueCat), not just hidden in the UI.

### Project layout
```
src/
  app/                       # Expo Router screens
    index.tsx                #   Home — deck list (swipe actions, due status)
    deck/[id]/index.tsx      #   Deck detail (cards, review, generate)
    deck/[id]/review.tsx     #   Review session (shuffle, flip, rate)
    generate.tsx             #   AI generation: type / photo / voice -> editable drafts
    card/new.tsx, card/[id]  #   Add / edit cards
    settings.tsx             #   Languages, theme, import/export
    paywall.tsx              #   Pro subscription
    api/generate+api.ts      #   Server-only OpenAI text proxy
    api/extract-text+api.ts  #   Server-only vision OCR proxy
    api/transcribe+api.ts    #   Server-only audio transcription proxy
  db/                        # Drizzle schema, client, queries
  hooks/                     # review session, voice/image input, paywall, theme, ...
  i18n/                      # languages.ts + 10 locale files
  lib/                       # scheduling (+ tests), generation, notifications, deck-transfer, revenuecat
  store/settings.ts          # persisted user settings
  components/                # button, flashcard, forms, themed-*
  constants/theme.ts         # design system
```

---

## 🤖 AI proxy setup (for self-hosting)

The OpenAI key lives **only** on the proxy, never in the app. The app talks to a
single backend URL from `src/lib/config.ts` (default `https://repaso.expo.app`),
overridable at build time via `EXPO_PUBLIC_PROXY_URL`.

Server-side environment variables:

```
OPENAI_API_KEY=sk-...                       # required, server-side only
OPENAI_MODEL=gpt-5.4-nano                    # optional — text generation
OPENAI_VISION_MODEL=gpt-5.4-nano             # optional — photo OCR (defaults to OPENAI_MODEL)
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe  # optional — voice transcription
```

**Deploy with [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/):**

```bash
npm i -g eas-cli && eas login
eas env:create --name OPENAI_API_KEY --value sk-... --environment production --visibility secret
npx expo export --platform web   # builds the server bundle incl. /api routes
eas deploy                       # prints your URL, e.g. https://repaso-xxxx.expo.app
```

Then build the app pointing at it (set `EXPO_PUBLIC_PROXY_URL` in `eas.json` if
you used a custom host):

```bash
eas build -p android --profile preview   # installable APK
```

The proxies validate input, rate-limit requests, and verify Pro entitlement and
the free-generation quota against RevenueCat before spending on OpenAI.

---

## 📂 Notes

- The SQLite schema is bootstrapped at runtime (`src/db/client.ts`), which is
  the single source of truth for migrations; the Drizzle schema
  (`src/db/schema.ts`) exists for query typing.
- Deck export/import (`src/lib/deck-transfer.ts`) is your backup & sharing path
  while cloud sync is on the roadmap.
- Mobile only — there is no web build of the app itself.
