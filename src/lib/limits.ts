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
