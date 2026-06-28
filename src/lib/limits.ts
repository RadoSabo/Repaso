/**
 * Domain limits shared between the app and the generation proxy.
 */

/** A single deck holds at most this many cards. Enforced in the UI and on the proxy. */
export const MAX_CARDS_PER_DECK = 50;

/**
 * Voice input is meant for a short prompt or word list. Recordings auto-stop at
 * this length, which bounds transcription cost and keeps the UX clear.
 */
export const MAX_RECORDING_SECONDS = 60;

/**
 * Free tier: this many successful generations per rolling period before Repaso
 * Pro is required. Enforced server-side (see `app/api/generate+api.ts`).
 */
export const FREE_GENERATIONS = 5;

/** Length of the rolling free-quota window, as a TTL on the per-device counter. */
export const FREE_PERIOD_DAYS = 30;

/**
 * RevenueCat entitlement identifier that unlocks Repaso Pro. Must match the
 * entitlement's *identifier* in the RevenueCat dashboard exactly. Shared by the
 * client (reading the active entitlement) and the server (verifying it).
 */
export const PRO_ENTITLEMENT_ID = 'Repaso Unlimited';
