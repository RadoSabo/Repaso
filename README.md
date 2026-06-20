# Repaso 📚

A simple, offline-first flashcard app for learning by active recall — built with
[Expo](https://expo.dev) for **iOS and Android**. Create decks, add two-sided
cards (front / back), review them with spaced repetition, and **generate cards
with AI** from a list of words or phrases.

## How it works

- **Decks & cards** — each card has a front and a back. Content can be anything:
  a word, a sentence, a question, a grammar rule, a translation.
- **Review** — cards are **shuffled**, then for each one you flip to reveal the
  back and tap **I knew it** (green) or **I didn't know** (red). Cards you miss
  are reinserted at a random spot so they come back later in the same session.
- **Spaced reminders** — review whenever you like; after each completed session
  the deck schedules a **local notification** to remind you to review again after
  a gradually-spreading interval (1, 2, 5, 8, 14, 21, 30, 60 days). Decks show a
  *due* badge.
- **AI generation** — paste a list of words/phrases, pick the known and target
  languages, and Repaso creates cards where the **front** is a natural sentence
  using the word in the language you know and the **back** is its translation in
  the language you're learning. Drafts are editable before saving.
- **Local-first** — all decks and cards live on-device in SQLite. No account, no
  cloud. The only network call is card generation, which goes through a proxy.

## Tech stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Expo + Expo Router (file-based routes), TypeScript  |
| Local storage  | `expo-sqlite` + Drizzle ORM (`useLiveQuery`)        |
| Settings state | Zustand (persisted via AsyncStorage)                |
| Scheduling     | Per-deck spaced reminders (`src/lib/scheduling.ts`) |
| Reminders      | Local notifications (`expo-notifications`)          |
| AI proxy       | Expo Router API route (`src/app/api/generate+api.ts`) |

## Project layout

```
src/
  app/                       # Expo Router screens
    index.tsx                #   Decks list (home)
    deck/new.tsx             #   Create deck
    deck/[id]/index.tsx      #   Deck detail (cards, review, generate)
    deck/[id]/edit.tsx       #   Edit deck
    deck/[id]/review.tsx     #   Review session (flip + rate)
    card/new.tsx             #   Add card
    card/[id].tsx            #   Edit/delete card
    generate.tsx             #   AI generation (input -> editable drafts -> save)
    settings.tsx             #   Default languages, theme
    api/generate+api.ts      #   Server-only OpenAI proxy
  db/                        # schema.ts, client.ts (bootstrap), queries.ts
  lib/                       # scheduling.ts (+ tests), generation.ts, notifications.ts, config.ts
  store/settings.ts          # persisted user settings
  components/                # button, text-field, themed-*, forms
```

## Running the app

```bash
npm install
npx expo start          # then press i (iOS), a (Android), or scan in Expo Go
```

Run the unit tests (spaced-review scheduler):

```bash
npm test
```

## AI card generation (OpenAI proxy)

The OpenAI key **never** ships in the app — it lives only on the proxy
(`src/app/api/generate+api.ts`), which the app calls. The app always talks to
**one fixed backend URL** defined in `src/lib/config.ts` (default
`https://repaso.expo.app`). It is not user-configurable; override it only at
build time via `EXPO_PUBLIC_PROXY_URL` (see `eas.json`) if you redeploy the proxy
elsewhere.

**Configure the server** (copy `.env.example` → `.env` for local dev):

```
OPENAI_API_KEY=sk-...        # required, server-side only
OPENAI_MODEL=gpt-4o-mini     # optional (defaults to gpt-4o-mini)
APP_TOKEN=                   # optional server-side gate; the app sends no token
```

**Local development:** the proxy is already deployed, so the app generates cards
out of the box — just run it:

```bash
npx expo start
```

To iterate on the proxy itself locally, run `OPENAI_API_KEY=sk-... npx expo start`
and temporarily point `PROXY_URL` (or `EXPO_PUBLIC_PROXY_URL`) at your dev server
origin (e.g. `http://<your-LAN-ip>:8081`).

**Production (EAS):** two deploys — host the proxy, then build the APK that
points at it.

```bash
npm i -g eas-cli && eas login
```

**1. Host the proxy** with [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/):

```bash
# Set the OpenAI key as a server-side secret (or do it in the EAS dashboard:
# Project → Environment variables, environment "production", visibility "Secret").
eas env:create --name OPENAI_API_KEY --value sk-... --environment production --visibility secret
# Optional: eas env:create --name APP_TOKEN --value <token> --environment production --visibility secret
# Optional: eas env:create --name OPENAI_MODEL --value gpt-4o-mini --environment production

npx expo export --platform web   # builds the server bundle incl. /api/generate
eas deploy                       # prints your URL, e.g. https://repaso-xxxx.expo.app
```

Sanity check the live proxy:

```bash
curl -X POST https://repaso-xxxx.expo.app/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"knownLang":"English","targetLang":"Spanish","items":["house"]}'
```

**2. Build the APK.** It ships pointing at the URL in `src/lib/config.ts`. If you
deployed to a different host, set that URL as `EXPO_PUBLIC_PROXY_URL` in the
`eas.json` `preview`/`production` profiles (it overrides the default), then:

```bash
eas build -p android --profile preview   # outputs an installable APK
```

Install the APK from the build link. The generator works out of the box — there
is nothing to configure in the app.

> The proxy validates input, applies a simple per-instance rate limit, and (if
> `APP_TOKEN` is set) requires a bearer token. `EXPO_PUBLIC_*` values are baked
> into the app bundle and are therefore extractable — fine as a soft gate, but
> for a hardened public release move the rate limit to a shared store and add
> real auth rather than relying on a shipped token.

## Notes & next steps

- The schema is bootstrapped at runtime (`src/db/client.ts`). `drizzle.config.ts`
  is in place to add proper migrations later.
- Out of scope for this MVP: accounts, cloud sync, deck sharing, TTS/audio,
  images, and review reminders. The local-first data layer and proxy are
  structured so auth + sync can be added without rewriting screens.
