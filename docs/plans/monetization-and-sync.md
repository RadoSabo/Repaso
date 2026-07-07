# Plan: Monetization (freemium) + Cloud Sync

Status: **Approved, not started.** This is the execution plan for adding a paid
subscription and cloud sync to Repaso. Written 2026-06-20.

---

## Goal

Turn AI deck generation into a freemium hook and add cloud sync so user data
survives reinstall / new device.

- **Free tier:** 5 AI generations per month (renewing).
- **Paid tier:** unlimited generations. €2 / month or €20 / year.
- **Positioning:** lead with the benefit, reinforce with patronage —
  _"Unlimited deck generations — and you help keep Repaso alive."_
- **Sync:** decks/cards mirror to the cloud so they survive reinstall and
  (eventually) follow the user to a new device.

---

## Decisions locked

| Decision | Choice |
|---|---|
| Scope | Paywall **+** cloud sync |
| Free limit | **5 generations / month**, renewing (server-side count) |
| Pricing | **€2/mo** and **€20/yr** (~17% off, "2 months free" anchor) |
| Billing | **RevenueCat** (`react-native-purchases`) — wraps App Store + Play Billing |
| Backend | **Supabase** (Postgres + Auth + RLS + realtime) |
| Identity | **Anonymous-first.** Invisible anonymous auth at launch; Apple + Google linking as a later phase |
| Sync model | **Offline-first sync engine: Legend-State** (MIT, free; Supabase sync plugin) mirroring local SQLite ↔ Supabase |
| Sync access | **Free for all users** (data safety builds trust). Unlimited generation is the paid hook |
| Platforms | iOS + Android (+ web, already supported by codebase) |
| API abuse | Quota/entitlement gate (primary) + persistent rate limit + OpenAI spend cap; App Check attestation in a later phase |

### Why anonymous-first
Anonymous auth gives every install a **real backend user (UUID)** with **no
login UI** and **no Apple/Google portal work** at launch. Sync, quota, and the
paywall all function immediately. The session token lives on-device, so:

> ⚠️ **Reinstall / new-device caveat:** until a user links a real account
> (Apple/Google), losing the phone = losing the decks. Anonymous auth does NOT
> by itself solve cross-device recovery — the social-link phase does. This is an
> accepted v1 trade-off to ship faster.

The social-link phase **converts** the existing anonymous user into a permanent
one (same ID, same decks, same subscription) — nothing is rebuilt.

---

## Resolved decisions

1. **Cloud sync is free for everyone.** Data safety builds trust and retention;
   no one should lose decks. Unlimited generation remains the paid hook.
2. **Sync engine: Legend-State** (MIT, free; uses its Supabase sync plugin).

## Constraints to remember (not choices)

- **Apple Guideline 4.8:** once social login ships in Phase 4, offering Google
  **requires** also offering Sign in with Apple — you cannot ship Google alone or
  Apple will reject the app. Phase 4 ships both together by design.

---

## Constraints / accounts needed (calendar-slow, start early)

- **Apple Developer Program** — $99/year (required for any iOS distribution).
- **Google Play Console** — $25 one-time.
- **App Store Connect + Play Console subscription products** — created and in
  review before the paywall can be tested with real purchases. This is paperwork
  and review time, not code; start it in parallel with Phase 1.
- **RevenueCat account** (free tier covers our scale).
- **Supabase project** (free tier fine to start).
- **OpenAI billing** — set a hard monthly spend cap + alert (see Phase 5).

---

## Current architecture (starting point)

- Local-first: decks/cards in on-device SQLite via `expo-sqlite` + Drizzle
  (`src/db/schema.ts`, `src/db/queries.ts`, `src/db/client.ts`).
- No user accounts, no server DB.
- Generation: app → Expo Router API route `src/app/api/generate+api.ts` on EAS
  Hosting (`https://repaso.expo.app`, see `src/lib/config.ts`) → proxies OpenAI.
  OpenAI key is server-side only (good). `APP_TOKEN` has been **removed** (it was
  never a real security boundary); the quota/entitlement gate below is the plan.
- Two more Pro-only proxy routes now exist (see next section): `transcribe+api.ts`
  (voice) and `extract-text+api.ts` (image). Shared hardening lives in
  `src/lib/server-proxy.ts`.
- Rate limiting is in-memory per IP (won't survive multiple instances/restarts).
- `expo-dev-client` is installed → native modules are fine (not limited to Expo Go).

---

## AI input/output features (built ahead of monetization)

A set of generation features was built before this plan executes. They are wired
to the entitlement seam this plan introduces, so turning on real gating is a
localized change. Decomposed as **two orthogonal axes**:

- **Input source** (all feed the one generation field): typed text *(existing)*,
  **voice** (record → transcribe → field), **image** (photo → extract text →
  field). Voice and image are *input methods* — they only fill the field with
  text the user confirms; the existing text→cards path then runs. So there is
  one "parse" generation path plus one "expand" path (below), not three.
- **Output style** (`OutputStyle = 'sentences' | 'words'`): a segmented control,
  persisted in `useSettings`, default **Sentences**. Threads through to the
  prompt builder. Words mode keeps the `{front, back}` schema unchanged and folds
  article/gender + a brief sense hint into the strings (no new card columns).

The text path auto-detects intent: a word/list/sentences → translate literally
(one card per item); a description ("banking and mortgage vocabulary") → **expand**
into a useful set. Generation is capped at the deck's remaining room
(`MAX_CARDS_PER_DECK`); when a list exceeds the cap, the server returns the
skipped items in `omitted` and the review screen lists them. Voice recordings
auto-stop at `MAX_RECORDING_SECONDS` (60).

### Gating split (what is Pro vs. free)

| Feature | Tier |
|---|---|
| Text generation — both **words** and **sentences**, parse **and** topic-expand | **Free quota** (5/mo, then Pro-unlimited) — counts exactly like today's generation |
| **Voice** input (`/api/transcribe`) | **Pro-only** — no free allowance |
| **Image** input (`/api/extract-text`) | **Pro-only** — no free allowance |

Rationale: voice/image are the premium "magic" hooks; text generation stays the
freemium funnel from the table in *Decisions locked*.

### Entitlement seam (the "A" approach)

- `src/hooks/use-entitlement.ts` returns `{ isPro }`. **Now:** `isPro = __DEV__`
  (developers are Pro automatically; `__DEV__` is `false` in every release build,
  so no real user is accidentally Pro). **Phase 3:** OR in the live RevenueCat
  entitlement.
- The client flag governs **UI only** — voice/image buttons show a lock badge for
  non-Pro users and route to the paywall (currently an upsell `Alert`; swap to
  `router.push('/paywall')` when Phase 3 ships that screen).
- **Server is the gate for spend.** The three proxy routes carry
  `TODO(monetization Phase 2/3)` markers: once Supabase auth + RevenueCat land,
  add a `requirePro(request)` check in `server-proxy.ts` and call it from the
  voice/image routes (Pro-only) and inside the free-quota check on generate.

### Server work still owed (folds into Phase 2/3)

- `transcribe+api.ts` / `extract-text+api.ts`: verify Supabase token + "unlimited"
  entitlement before calling OpenAI (they are Pro-only).
- `generate+api.ts`: token verify + 5/mo quota as already described in Phase 2.
- Models: text + image reuse `gpt-5.4-nano` (multimodal); voice uses
  `gpt-4o-mini-transcribe` (no cheap v5 batch transcription model exists).

## Implementation phases

### Phase 0 — Foundations (accounts + Supabase)
- Create Supabase project; add `@supabase/supabase-js` + a typed client.
- Enable **anonymous auth** in Supabase.
- Design server schema: `profiles` (1:1 with auth user), `generation_usage`
  (user_id, period, count), and cloud-side `decks` / `cards` tables mirroring
  `src/db/schema.ts`. Add **row-level security** so users only touch their rows.
- Create App Store Connect / Play Console subscription products (kick off review).

### Phase 1 — Anonymous identity in the app
- On first launch, silently `signInAnonymously()`; persist + restore the session.
- Expose the current user via a hook (e.g. `useAuth`) — keep screens thin
  (logic in the hook, per AGENTS.md).
- Send the Supabase access token to the generate API route.

### Phase 2 — Server-side free-generation quota
- Move generation gating server-side. In `generate+api.ts`:
  - Verify the Supabase token → resolve user id.
  - Look up entitlement (Phase 3) and monthly usage.
  - If subscribed → allow. Else → check `generation_usage` for the current month;
    allow + increment if under 5, else `402`/`429` with a "limit reached" payload.
- Replace the in-memory IP limiter with a **persistent** per-user limiter
  (Supabase row or KV). Keep a coarse IP limiter as a backstop.
- App shows **"X generations left this month"** and a paywall when exhausted.

### Phase 3 — Subscriptions (RevenueCat)
- Add `react-native-purchases` (+ config plugin); rebuild dev client.
- Configure RevenueCat with the store products; one **entitlement** = "unlimited".
- Paywall screen: benefit-led copy + €2/mo and €20/yr; **Restore Purchases**
  button (Apple-required).
- App sends RevenueCat customer/entitlement info; server verifies entitlement
  (via RevenueCat REST API or webhook → store on the user row) before the quota
  check in Phase 2. **Server is the source of truth**, not the client.

### Phase 4 — Social login (cross-device recovery)
- Add `expo-apple-authentication` (Apple) and Google sign-in
  (`@react-native-google-signin/google-signin` or `expo-auth-session`).
- Wire both into Supabase Auth; **link** to the existing anonymous user so decks
  + subscription carry over (no data rebuild).
- Apple portal: App ID + Services ID + `.p8` key. Google: OAuth consent screen +
  iOS/Android/Web client IDs + Android SHA-1 fingerprints.
- Honor Guideline 4.8 (ship Apple alongside Google).
- "Sign in on a new device" now actually restores data.

### Phase 5 — Cloud sync of decks/cards
- Integrate **Legend-State** with its Supabase sync plugin against the existing
  Drizzle/expo-sqlite schema.
- Keep writing to local SQLite; Legend-State mirrors ↔ Supabase under the user id.
- **Sync is free for all users** — no entitlement gate here.
- Verify offline-first still holds: app fully usable with no connection.

### Phase 6 — API-abuse hardening
- **OpenAI spend cap + alert** (do this first — bounds worst case to euros).
- Confirm persistent per-user rate limits from Phase 2.
- Add **App Check attestation** — App Attest (iOS) + Play Integrity (Android),
  e.g. via Firebase App Check — verified in `generate+api.ts` so only genuine,
  unmodified app installs can call the proxy. (Deferred from v1; the quota gate
  already makes free-tier abuse pointless.)

---

## Files likely to change / add

- `src/app/api/generate+api.ts` — token verify, entitlement + quota gate, persistent limiter.
- `src/lib/supabase.ts` (new) — Supabase client.
- `src/lib/revenuecat.ts` (new) — purchases init + entitlement helpers.
- `src/hooks/use-auth.ts` (new) — anonymous session, later social linking.
- `src/app/paywall.tsx` (new) — paywall screen.
- `src/app/generate.tsx` — show quota, route to paywall at limit.
- `src/db/` — sync engine wiring (Phase 5).
- `src/lib/limits.ts` — add `FREE_GENERATIONS_PER_MONTH = 5`.
- Server schema / migrations for Supabase tables + RLS.

### Already added (AI input/output features)
- `src/hooks/use-entitlement.ts` — `{ isPro }`; stub `__DEV__`, OR RevenueCat in Phase 3.
- `src/hooks/use-voice-input.ts`, `src/hooks/use-image-input.ts` — capture + proxy call.
- `src/lib/transcribe.ts`, `src/lib/extract-text.ts` — Pro-only proxy clients.
- `src/lib/server-proxy.ts` — shared route hardening; add `requirePro` here in Phase 2/3.
- `src/app/api/transcribe+api.ts`, `src/app/api/extract-text+api.ts` — new Pro-only routes.
- `src/components/segmented-control.tsx`, `src/components/input-method-button.tsx`.
- `src/lib/limits.ts` — added `MAX_RECORDING_SECONDS`.
- `src/store/settings.ts` — persisted `outputStyle`.
- `app.json` — `expo-image-picker` + `expo-audio` plugins with permission strings.

---

## Verification bar (per AGENTS.md)
- `npx tsc --noEmit` and `npx expo lint` clean on changed files.
- Keep screens thin; logic in hooks. Split presentational vs interactive.
- No magic numbers; use design system + theme. Accessible Pressables.
- Test real purchases via TestFlight / Play internal testing before release.
