/**
 * Single source of truth for "is this user a Pro subscriber?" — the seam that
 * the whole app reads when deciding whether to unlock paid features (image and
 * voice input). Today it is a stub; the real implementation arrives with the
 * monetization plan (see `docs/plans/monetization-and-sync.md`).
 *
 * IMPORTANT: this client flag only governs what the UI *offers*. It is never a
 * security boundary — the generation/transcription/vision proxy routes are the
 * real gate and must verify the subscriber's entitlement server-side before
 * spending on OpenAI (see the `TODO(monetization Phase 2/3)` markers in
 * `src/app/api/*`).
 */

/**
 * In development every build is treated as Pro so the team can exercise the paid
 * features without a subscription. `__DEV__` is guaranteed `false` in release
 * builds (TestFlight / App Store), so no real user is ever accidentally Pro.
 *
 * TODO(monetization Phase 3): OR this with the live RevenueCat entitlement, e.g.
 *   `__DEV__ || rcEntitlements.active['unlimited'] != null`.
 */
export function useEntitlement(): { isPro: boolean } {
  return { isPro: __DEV__ };
}
