# Plan: MVP Monetization (no accounts, no sync)

Status: **Planned, not started.** Written 2026-06-27. This is the **first
shippable step** carved out of `monetization-and-sync.md` — the smallest version
that puts Repaso on the App Store and Google Play with a working paywall.

It deliberately drops accounts (Supabase auth) and cross-device sync. Those
remain the job of the larger plan; this doc supersedes it for what ships first.

---

## Goal

Ship a paid app to both stores with a freemium hook, **no login of any kind**.

- **Free tier:** 5 AI text generations per rolling 30 days.
- **Paid tier ("Repaso Pro"):** unlimited text generation + voice & image input.
  €2/month or €20/year, no free trial.
- **No accounts, no sync.** Decks live only in on-device SQLite. A reinstall
  loses them — mitigated by a manual export/import, not by a backend.
- **One small piece of backend:** a lightweight KV (Upstash Redis) holds the
  free-generation counter so it survives reinstall. No Postgres, no accounts,
  no user identity — just a per-device counter.
- **Positioning:** lead with the benefit — _"Unlimited deck generations — and
  you help keep Repaso alive."_

---

## What changes vs. the full plan

| Topic | Full plan (`monetization-and-sync.md`) | This MVP |
|---|---|---|
| Identity | Supabase anonymous auth (real backend UUID) | **None.** RevenueCat anonymous app-user-ID only |
| Free quota | Server-side count in Supabase, keyed by auth user | **Server-side KV count** keyed by a reinstall-surviving device ID (no auth) |
| Pro entitlement | Supabase token + RevenueCat, server source of truth | **RevenueCat anon ID → server REST check** (no Supabase) |
| Sync | Legend-State ↔ Supabase | **None.** Manual JSON export/import instead |
| Backend DB | Supabase (Postgres + RLS) | **Minimal KV only** (Upstash Redis) for the quota counter — no Postgres, no accounts, no RLS |
| Social login | Phase 4 | Deferred |
| App Check | Phase 6 | Deferred |

Everything dropped here is additive later: adding Supabase/sync on top does not
require unwinding any of this.

---

## Decisions locked (from the grilling session)

| # | Decision | Choice |
|---|---|---|
| 1 | Server Pro gate | App sends its **RevenueCat anonymous app-user-ID**; the Pro-only proxy routes call RevenueCat's REST API to confirm the `unlimited` entitlement before spending on OpenAI. Real server-side spend gate, still no accounts. |
| 2 | Free counter location | **Server-side KV** (Upstash Redis), keyed by a **reinstall-surviving device ID** — iOS Keychain UUID (via `expo-secure-store`, which persists across uninstall); Android `ANDROID_ID` (via `expo-application`). `/api/generate` verifies the count before spending. **Closes the reinstall-reset loophole** (supersedes the earlier device-local choice). |
| 3 | Quota period | **Rolling 30 days**, implemented as a **30-day TTL** on the per-device KV key: the first generation of a period sets the key with `EX 30d`; when it expires the allowance resets. |
| 4 | What consumes a free generation | **Only a successful `/api/generate`** that returns ≥1 card. Errors / empty results don't count. Voice & image are **Pro-only, no free allowance**. |
| 5 | Paywall | **Full custom `/paywall` screen** — benefit-led copy, monthly/annual, subscribe via RevenueCat, **Restore Purchases**, Terms + Privacy links. |
| 6 | Pricing | **€2/mo + €20/yr, no trial.** |
| 7 | Abuse hardening | **Hard OpenAI monthly spend cap + alert**; keep the existing in-memory IP rate limiter. App Check + persistent limiter deferred. |
| 8 | Data loss on reinstall | **Accept local-only**, add a **manual export/import** safety valve. |
| 9 | Import behavior | **Always create new decks** (append-only; no matching/dedupe). |

---

## Prerequisites (paperwork — start immediately, they have review lag)

These gate testing and release, not coding. **Status unconfirmed — assume not
done** and put them on the critical path in parallel with Phase 1.

- [ ] **Apple Developer Program** — $99/yr. Required for TestFlight + App Store.
- [ ] **Google Play Console** — $25 one-time. Required for internal testing + Play.
- [ ] **RevenueCat account** + project (free tier is enough).
- [ ] **Upstash Redis** database (free tier is enough) — holds the per-device
  free-generation counter. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  as server-side env on EAS Hosting.
- [ ] **App Store Connect + Play Console subscription products** — create the
  monthly (€2) and annual (€20) products and **submit for review early**; they
  must be approved before real purchases can be tested.
- [ ] **Privacy Policy + Terms/EULA**, publicly hosted. **Hard-required** by both
  stores for paid apps and **linked from the paywall** and store listings.
- [ ] **OpenAI billing** — hard monthly spend cap + alert (also Phase 5 below).

---

## Current architecture (starting point — verified in code)

- Local-first: decks/cards in on-device SQLite via `expo-sqlite` + Drizzle
  (`src/db/{schema,queries,client}.ts`). No backend.
- Generation: app → `generateCards()` (`src/lib/generation.ts`) → Expo Router API
  route `src/app/api/generate+api.ts` on EAS Hosting (`https://repaso.expo.app`,
  `src/lib/config.ts`) → proxies OpenAI. Key is server-side only.
- Two Pro-only proxy routes already exist: `transcribe+api.ts` (voice) and
  `extract-text+api.ts` (image). All three currently have **only** an in-memory
  per-IP rate limiter (`src/lib/server-proxy.ts`) and a `TODO(monetization
  Phase 2/3)` marker — **no entitlement check yet**.
- Entitlement seam exists: `src/hooks/use-entitlement.ts` returns
  `{ isPro: __DEV__ }`. `generate.tsx` already locks the voice/image buttons
  behind `isPro` and shows an `Alert` upsell (`showProUpsell`).
- Settings persisted via zustand + AsyncStorage (`src/store/settings.ts`).
- `expo-dev-client` is installed → native modules (RevenueCat) are fine.
- **Mobile only** per `AGENTS.md`: no web code. RevenueCat is native-only, which
  aligns; do not add `Platform.OS === 'web'` branches for any of this.

---

## Implementation phases

### Phase 1 — RevenueCat SDK + real entitlement (client)
- Add `react-native-purchases` (+ its config plugin); rebuild the dev client.
- `src/lib/revenuecat.ts` (new): init the SDK at launch with the public API key
  (`EXPO_PUBLIC_REVENUECAT_KEY`), expose helpers to read the current offering,
  purchase a package, restore purchases, and read the active entitlement.
- `src/hooks/use-entitlement.ts`: replace the stub with
  `__DEV__ || activeEntitlements.unlimited != null`. Keep `__DEV__` so the team
  stays Pro in dev. Keep it the single client seam — screens read only `isPro`.
- Capture the **RevenueCat anonymous app-user-ID** (from `Purchases.getAppUserID`)
  for sending to the Pro-only routes (Phase 3).

### Phase 2 — Server-side free quota (KV + device ID)
- `src/lib/limits.ts`: add `FREE_GENERATIONS = 10` and `FREE_PERIOD_DAYS = 30`
  (named constants, no magic numbers).
- `src/lib/device-id.ts` (new): `getDeviceId(): Promise<string>` — a stable,
  reinstall-surviving id. **iOS:** a UUID generated once and stored in the
  Keychain via `expo-secure-store` (Keychain persists across uninstall).
  **Android:** `Application.getAndroidId()` from `expo-application`. (This is a
  native iOS/Android branch, not a web branch — allowed by `AGENTS.md`.)
- Server KV helper in `src/lib/server-proxy.ts`: thin Upstash REST client
  (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, server env only).
- `src/app/api/generate+api.ts` — enforce the quota **server-side**:
  - Read `deviceId` from the body (reject if missing).
  - Key `freegen:{deviceId}`. Read the count; if `< FREE_GENERATIONS` →
    allow, call OpenAI, and on **success only** `INCR` the key, setting
    `EX 30d` when it's first created (decision #3/#4).
  - If the count is already at the cap → resolve Pro via `requirePro` (Phase 3):
    Pro ⇒ allow unlimited (no increment); else ⇒ `402` "limit reached". (Checking
    Pro only at the cap avoids a RevenueCat call on every free generation.)
- `src/app/api/quota+api.ts` (new): `GET ?deviceId=…` returns
  `{ remaining }` so the screen can show the count without generating.
- `src/lib/generation.ts`: send `deviceId` (+ `appUserId`) with the request;
  surface the `402` as a "limit reached" signal the screen routes to `/paywall`.
- `src/hooks/use-generation-quota.ts` (new, keeps the screen thin): fetches
  `remaining` from `/api/quota` on mount and after a generation; exposes
  `remaining` and `canGenerate`. Pro users bypass entirely.
- `src/app/generate.tsx`:
  - Before generating: if `!isPro && remaining === 0` → `router.push('/paywall')`.
  - On a `402` from the server → also route to `/paywall` (server is the gate).
  - Show **"X generations left this month"** near the Generate button (free only).

### Phase 3 — Server entitlement check on Pro-only routes
- `src/lib/server-proxy.ts`: add `requirePro(request): Promise<boolean>`.
  - Reads `appUserId` from the request body, calls RevenueCat REST
    `GET /v1/subscribers/{appUserId}` with the **secret** key
    (`REVENUECAT_SECRET_KEY`, server env only), and returns whether
    `entitlements.unlimited` is active and unexpired.
- `transcribe+api.ts` and `extract-text+api.ts`: call `requirePro`; on false
  return `402` with a clear "Repaso Pro required" payload. Clients
  (`src/lib/transcribe.ts`, `src/lib/extract-text.ts`) send `appUserId` and
  surface the 402 as the paywall route.
- `generate+api.ts`: now **device-ID gated server-side** (Phase 2) in addition
  to the IP limiter + spend cap. Replace its stale `TODO(monetization Phase 2/3)`
  text with a note pointing here.

### Phase 4 — Paywall screen
- `src/app/paywall.tsx` (new), thin screen over RevenueCat helpers:
  - Benefit-led headline; lists Pro benefits (unlimited generation, voice, image).
  - Monthly (€2) / annual (€20, "2 months free") selection, prices read from the
    RevenueCat offering (never hard-coded).
  - **Subscribe** (purchase) and **Restore Purchases** (Apple-required) buttons.
  - Terms + Privacy links (the hosted URLs from prerequisites).
  - Use the design system: `Spacing.*`, `useTheme()` colors; accessible Pressables.
- Replace `showProUpsell`'s `Alert` in `generate.tsx` with `router.push('/paywall')`.

### Phase 5 — Export / import (data-loss safety valve)
- Add `expo-sharing`, `expo-document-picker`, `expo-file-system` as needed.
- New `src/lib/deck-transfer.ts`:
  - `exportDecks()` — read all decks + their cards via `src/db/queries.ts`,
    serialize to a versioned JSON (`{ version, decks: [{ ...deck, cards: [] }] }`),
    write a temp file, open the share sheet.
  - `importDecks(uri)` — parse + validate; for each deck **create a new deck**
    and its cards (decision #9), respecting `MAX_CARDS_PER_DECK`. No matching.
- Add an **"Your data"** section to `src/app/settings.tsx` with Export / Import
  rows (accessible Pressables). Keep file/db logic in `deck-transfer.ts`, screen thin.

### Phase 6 — Abuse hardening + release
- **OpenAI**: set a hard monthly spend cap + email alert (do this first).
- Confirm the in-memory IP limiter is still wired on all three routes.
- App Store / Play subscription products approved; **test real purchases** via
  TestFlight + Play internal testing before release.
- App icon, screenshots, store listing, subscription metadata, and App Privacy
  declarations: a **device Identifier** (App Functionality / fraud prevention,
  not linked to identity, not used for tracking); no other data collected.

---

## Files to change / add

**New**
- `src/lib/revenuecat.ts` — SDK init + purchase/restore/entitlement helpers.
- `src/lib/device-id.ts` — reinstall-surviving device id (Keychain UUID / ANDROID_ID).
- `src/hooks/use-generation-quota.ts` — reads `remaining` from `/api/quota`.
- `src/app/api/quota+api.ts` — read-only `remaining` for a device id.
- `src/app/paywall.tsx` — paywall screen.
- `src/lib/deck-transfer.ts` — export/import.

**Change**
- `src/hooks/use-entitlement.ts` — OR in the live RevenueCat entitlement.
- `src/lib/limits.ts` — add `FREE_GENERATIONS`, `FREE_PERIOD_DAYS`.
- `src/lib/server-proxy.ts` — add `requirePro()` + Upstash KV helper.
- `src/app/api/transcribe+api.ts`, `src/app/api/extract-text+api.ts` — call `requirePro`.
- `src/app/api/generate+api.ts` — device-ID KV quota gate; refresh the stale TODO.
- `src/lib/transcribe.ts`, `src/lib/extract-text.ts` — send `appUserId`, handle 402.
- `src/lib/generation.ts` — send `deviceId` + `appUserId`, handle 402.
- `src/app/generate.tsx` — quota display, "X left" copy, route to `/paywall`.
- `src/app/settings.tsx` — "Your data" export/import section.
- `app.json` — RevenueCat config plugin; export/import permission strings if needed.
- `eas.json` / env — `EXPO_PUBLIC_REVENUECAT_KEY` (client); server: `REVENUECAT_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

---

## Known limitations (accepted for v1)

- **Reinstall / new device loses decks** unless the user exported them. No sync.
- **Android quota is slightly less durable than iOS.** `ANDROID_ID` survives
  reinstall but resets on a factory reset (and differs per app-signing key);
  the iOS Keychain id is more durable. A determined user can still reset the
  Android free quota — bounded by the OpenAI spend cap.
- **We now read a device identifier**, so the App Privacy declarations must list
  it (Identifier, used for App Functionality / fraud prevention, **not linked**
  to the user's identity, **not** used for tracking).

These are resolved/improved by the later Supabase/sync phases in `monetization-and-sync.md`.

---

## Verification bar (per AGENTS.md)
- `npx tsc --noEmit` and `npx expo lint` clean on changed files.
- Screens thin; logic in hooks/libs. Split presentational vs. interactive.
- No magic numbers; design system + theme; accessible Pressables.
- React Compiler rules: no `ref.current` reads in render, no `setState` in effect bodies.
- Test real purchases via TestFlight / Play internal testing before release.
