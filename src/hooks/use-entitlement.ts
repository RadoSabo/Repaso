/**
 * Single source of truth for "is this user a Pro subscriber?" — the seam that
 * the whole app reads when deciding whether to unlock paid features (image and
 * voice input). Backed by the live RevenueCat entitlement (see
 * `src/lib/revenuecat.ts`); see the MVP plan in `docs/plans/mvp-monetization.md`.
 *
 * IMPORTANT: this client flag only governs what the UI *offers*. It is never a
 * security boundary — the generation/transcription/vision proxy routes are the
 * real gate and must verify the subscriber's entitlement server-side before
 * spending on OpenAI (see the `TODO(monetization Phase 2/3)` markers in
 * `src/app/api/*`).
 */
import { useSyncExternalStore } from 'react';

import { hasUnlimitedEntitlement, subscribeEntitlement } from '@/lib/revenuecat';

/**
 * Pro tracks the live RevenueCat entitlement. There is no developer bypass: in
 * dev you become Pro the same way a user does — by purchasing through the
 * RevenueCat Test Store — so the client and the server always agree.
 */
export function useEntitlement(): { isPro: boolean } {
  return { isPro: useSyncExternalStore(subscribeEntitlement, hasUnlimitedEntitlement) };
}
