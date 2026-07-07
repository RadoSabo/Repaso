# Repaso — Google Play Production Launch Checklist

Everything needed to take Repaso from "working internal test" to **live on Google Play**, including ready-to-paste texts and exact asset specs.

Package: `app.repaso` · Default store language: **English (United States)**

---

## 0. Status snapshot

**✅ Done**
- Developer account + app entry created (`app.repaso`)
- Production AAB built (EAS) and uploaded to **Internal testing** (runs on device)
- Subscriptions created in Play (`repaso_pro_monthly` / `repaso1m`, `repaso_pro_yearly` / `repaso1y`), active
- RevenueCat fully wired: products published, entitlement **`Repaso Unlimited`**, **`default`** offering with Monthly (`$rc_monthly`) + Yearly (`$rc_annual`)
- License testing working (test purchases via "Test card, always approves")

**⏳ Remaining (this doc)**
1. Graphic assets (store listing)
2. Store listing texts
3. Subscription texts (yearly still to finish)
4. Content & compliance forms (App content section)
5. Closed testing: 12 testers × 14 days
6. Create Production release → submit for review
7. Repo housekeeping (commit, version)

---

## 1. Graphic assets you must upload (Play Console → Store listing)

All uploaded in **Play Console**, NOT in the repo. Specs are Google's hard requirements.

| Asset | Spec | Required? | Notes |
|---|---|---|---|
| **App icon** | **512 × 512 px**, 32-bit PNG, ≤ 1 MB, no alpha transparency for the store icon | ✅ Yes | Your in-app icon is `assets/images/icon.png` — export a 512×512 version for the store. |
| **Feature graphic** | **1024 × 500 px**, PNG or JPG, no alpha | ✅ Yes | Banner shown at top of listing. Put the app name + a tagline + the icon/visual. |
| **Phone screenshots** | 2–8 images, PNG/JPG, 16:9 or 9:16, each side **320–3840 px** | ✅ Yes (min 2, ideally 4–6) | Real screens from the app (see §1.1). |
| **7-inch tablet screenshots** | up to 8 | Optional | Skip unless you want tablet placement. |
| **10-inch tablet screenshots** | up to 8 | Optional | Skip for now. |
| **Promo video** | YouTube URL | Optional | Skip for v1. |

### 1.1 Which screenshots to capture
Run the app (internal build or simulator) and capture these key screens — they sell the app best:
1. **Home / deck list** (shows decks + "Review / In N days" status)
2. **AI generation screen** (typing a topic → drafts)
3. **A review session** (flashcard front/back, flip)
4. **The "create from photo / voice" options**
5. **The paywall** (Pro benefits)
6. (optional) **Settings / language picker** with the flags

Tip: capture on a clean device (good status bar), portrait, at least 1080×1920. You can add captions/frames later with a tool like [Shotbot](https://shotbot.io) or Figma, but raw screenshots are accepted.

---

## 2. App icon & splash screen (in the app itself — repo)

These are **separate** from the store assets above. They're already configured in `app.json`:

| Item | File in repo | Status |
|---|---|---|
| Base app icon | `assets/images/icon.png` (799 KB) | ✅ set |
| Android adaptive icon — foreground | `assets/images/android-icon-foreground.png` | ✅ set |
| Android adaptive icon — background | `assets/images/android-icon-background.png` | ✅ set |
| Android adaptive icon — monochrome | `assets/images/android-icon-monochrome.png` | ✅ set |
| Android adaptive icon — background color | `#E6F4FE` | ✅ set |
| Splash screen image | `assets/images/splash-icon.png` (width 76) | ✅ set |
| Splash background color | `#EA6212` (brand orange) | ✅ set |

**⚠️ iOS only (not blocking Android launch):** `app.json` has `ios.icon: "./assets/expo.icon"`, which looks like a leftover/placeholder path. Before any iOS build, set a proper iOS icon (a 1024×1024 PNG) or remove that line so it falls back to the shared `icon`. Not needed for the Play Store launch.

**Android icon guidance:** the adaptive foreground art should sit within the safe zone (logo not too close to edges) since Android masks it into circles/squares. If your current icon looks cropped on a device, regenerate the foreground with more padding.

No action needed here for Android unless the icon/splash look wrong on your test device.

---

## 3. Store listing texts (ready to paste)

Play Console → **Grow → Store presence → Main store listing** (English – US).

### App name (max 30 chars)
```
Repaso: AI Flashcards
```

### Short description (max 80 chars)
```
Learn languages with AI flashcards, spaced repetition, and smart reminders.
```

### Full description (max 4000 chars)
```
Repaso turns anything you want to learn into flashcards — and reminds you to review at exactly the right moment, so it actually sticks.

Stop building decks by hand. Snap a photo of your notes, say a few words out loud, or just type a topic, and Repaso writes the cards for you in the language you're learning.

WHY REPASO

• Smart spaced repetition
Repaso schedules each deck on a gently widening curve (1, 2, 5, 8, 14, 21, 30, 60 days). Review on time and intervals stretch out; review early just for practice and nothing is penalized.

• Reminders that bring you back
Get a friendly notification the moment a deck is due — no servers, no tracking, just a nudge at the right time.

• Five ways to create cards
1. Type a topic or a word list — Repaso expands and translates it into a full deck.
2. Generate natural example sentences so you learn words in context.
3. Or generate clean vocabulary pairs with the right article/gender.
4. Photograph your notes — Repaso reads the text and turns it into cards.
5. Speak it — record yourself and Repaso transcribes it straight into the generator.

Write your prompt in your own language — type sentences you want to learn, and Repaso builds cards that teach you to say them in your target language. Every generated card is fully editable before you save it.

• Speaks your language
The whole app is translated into 10 languages — English, Spanish, Portuguese (Brazil), French, German, Italian, Japanese, Korean, Simplified Chinese, and Czech — and picks the right one automatically.

• Made for daily use
Beautiful light and dark themes, smooth gestures, swipe-to-delete, and satisfying card flips. Your decks live on your device — no account required.

FREE & PRO
Create and review unlimited decks for free, plus 5 AI generations a month. Upgrade to Repaso Pro for unlimited AI generation and to unlock creating cards from photos and your voice.

Start learning the smart way. Download Repaso and turn your notes into knowledge.
```

> The full description is ~1,650 chars — well within the 4,000 limit. Trim/adjust freely. Keep claims accurate to avoid policy rejection.

---

## 4. Subscription texts (Play Console → Monetize → Subscriptions)

`repaso_pro_monthly` is done. Finish the **yearly** one and (optionally) polish both.

### Monthly (`repaso_pro_monthly`)
- **Name:** `Repaso Pro (Monthly)`
- **Benefits** (≤40 chars each):
  ```
  Unlimited AI card generation
  Create cards from photos
  Create cards from your voice
  ```
- **Description:**
  ```
  Repaso Pro unlocks unlimited AI flashcard generation and lets you create cards instantly from photos and your voice.
  ```

### Yearly (`repaso_pro_yearly`)
- **Name:** `Repaso Pro (Yearly)`
- **Benefits** (≤40 chars each):
  ```
  Unlimited AI card generation
  Create cards from photos
  Create cards from your voice
  Best value — save vs monthly
  ```
- **Description:**
  ```
  Get a full year of Repaso Pro: unlimited AI flashcard generation plus card creation from photos and voice — at the best price.
  ```

---

## 5. Content & compliance forms (Play Console → Policy → App content)

Every item must show ✅ before you can publish. Suggested answers for Repaso:

| Form | What to do / answer |
|---|---|
| **Privacy policy** | URL: `https://repaso.expo.app/privacy` |
| **App access** | "All functionality is available without special access" (no login; Pro is a normal paid upgrade, not restricted credentials). |
| **Ads** | **No**, this app does not contain ads. |
| **Content rating** | Fill the questionnaire: category **Reference/Education** (or Utility), **no** violence/sexual/profanity/gambling/etc. → results in Everyone / PEGI 3. |
| **Target audience & content** | Target age groups **13–17 and 18+** (do **not** target under‑13 — it triggers Families policy and extra requirements). Not designed for children. |
| **Data safety** | See §5.1 — this is the most detailed one. |
| **Government apps** | No. |
| **Financial features** | No. |
| **Health** | No. |
| **News app** | No. |

### 5.1 Data safety — what to declare (be honest)
Repaso sends user-entered content to OpenAI (via your proxy) and uses RevenueCat for purchases. Declare:

- **Does your app collect or share user data?** → **Yes** (it transmits content to a third party for processing).
- **Data types:**
  - **App activity / Other user-generated content** — the text, photos, and audio the user provides for card generation. **Shared** with a third party (OpenAI) to provide the feature. Processed in transit, not stored on your servers long-term (local SQLite on device).
  - **Photos** (only when the user picks the OCR feature) — sent for text extraction.
  - **Audio** (only when the user records voice) — sent for transcription.
  - **Purchase history / app interactions** — via RevenueCat for subscription management.
  - **Device or other IDs** — RevenueCat app user ID.
- **Is all data encrypted in transit?** → **Yes** (HTTPS).
- **Can users request data deletion?** → Data is stored locally and removed on uninstall; there are no accounts. Note this accordingly.
- **Is data used for the app's core functionality only?** → Yes; not for ads.

> ⚠️ This is guidance, not legal advice. Confirm against OpenAI's and RevenueCat's data handling and your actual `/privacy` page text before submitting. The declaration must match your privacy policy.

---

## 6. Closed testing — 12 testers × 14 days (the long pole)

New **personal** developer accounts (post Nov 13, 2023) must run **Closed testing with ≥12 testers opted in for 14 continuous days** before Production access is granted. Start this NOW so the clock runs while you finish §1–§5.

Steps:
1. **Testing → Closed testing → Create track** (or use the default "closed" track).
2. Add testers via an **email list** or a **Google Group** (easier for 12+).
3. Promote your current build to that track and share the **opt-in link**.
4. Get 12 people to opt in + install (friends/family/colleagues, or indie-dev tester‑swap groups: r/googleplaytesting, "Google Play 12 testers" Telegram/Discord groups).
5. Keep ≥12 opted in for **14 straight days**; they should open the app at least once.

After 14 days, Play unlocks the "Apply for production" flow.

---

## 7. Create the Production release

Once §1–§6 are green and the 14-day test is complete:
1. **Production → Create new release.**
2. **Add from library** → promote the AAB you already tested (or upload a fresh `eas build -p android --profile production`).
3. Release notes (en-US):
   ```
   <en-US>
   Initial release of Repaso — create flashcards, generate them with AI from text, photos, or your voice, and review with spaced repetition and reminders.
   </en-US>
   ```
4. **Review release → Start rollout to Production → Send for review.**
5. First review typically takes a few days to ~a week.

---

## 8. Repo / build housekeeping (do before the final production build)

- [ ] Commit pending changes: `app.json` (package `app.repaso`), `eas.json` (RevenueCat Android key), `README.md`.
- [ ] `versionCode` auto-increments via the `production` profile (`autoIncrement: true`) — no manual bump needed. App `version` is `1.0.0`; bump for future releases.
- [ ] Confirm the production build uses the **real** `goog_…` RevenueCat key (done in `eas.json`) — `appl_…` (iOS) is still a placeholder, fine for Android-only.

---

## 9. Later — iOS (not part of this launch)
- Set a real `ios.bundleIdentifier` icon (1024×1024) and fix `ios.icon` path.
- Add an iOS app in RevenueCat → get the `appl_…` key → put it in `eas.json`.
- Create App Store Connect app, products, and an `eas submit -p ios` flow.

---

## Quick "do next" order
1. Capture **screenshots** + make **icon (512²)** and **feature graphic (1024×500)**.
2. Paste the **store listing texts** (§3).
3. Finish the **yearly subscription** texts (§4).
4. Complete **App content** forms, especially **Data safety** (§5).
5. **Start closed testing** with 12 testers (§6) — clock starts now.
6. After 14 days → **Production release** (§7).
