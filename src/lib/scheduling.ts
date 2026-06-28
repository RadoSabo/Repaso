/**
 * Simple per-deck spaced-review scheduling (replaces SM-2). Completing a review
 * *while the deck is due* advances it one "stage", and the deck becomes due
 * again after an escalating interval. Reviewing ahead of schedule is always
 * allowed but is free practice: it never advances the stage or pushes the due
 * date out. The schedule just drives the reminder for *when* it's worth
 * reviewing again.
 *
 * Pure and side-effect free so it can be unit tested in isolation.
 */
import type { TFunction } from 'i18next';

// Frequent early, then gradually spread out: tomorrow, +2, +5, +8, then easing
// toward ~2 months. Edit this single list to change the review cadence.
export const REVIEW_INTERVALS_DAYS = [1, 2, 5, 8, 14, 21, 30, 60] as const;
const DAY = 86_400;

export interface DeckSchedule {
  reviewStage: number;
  /** Next due time as unix seconds. */
  nextReviewAt: number;
}

const clampStage = (stage: number) =>
  Math.min(Math.max(Math.trunc(stage), 0), REVIEW_INTERVALS_DAYS.length - 1);

/** Interval (in days) that applies to a deck currently at `stage`. */
export function intervalDaysForStage(stage: number): number {
  return REVIEW_INTERVALS_DAYS[clampStage(stage)];
}

/** Advances a deck's schedule after a completed review session. */
export function advanceSchedule(currentStage: number, now: number = Date.now()): DeckSchedule {
  const days = intervalDaysForStage(currentStage);
  return {
    reviewStage: Math.max(Math.trunc(currentStage), 0) + 1,
    nextReviewAt: Math.floor(now / 1000) + days * DAY,
  };
}

/**
 * Resolves the schedule after a completed review. Advances only when the deck
 * was actually due; an early review keeps the current stage and due date so
 * extra practice never pushes the next review further out.
 */
export function scheduleAfterReview(
  currentStage: number,
  nextReviewAt: number | null,
  now: number = Date.now()
): DeckSchedule {
  // Never-reviewed (null) or past-due decks advance; everything else is early.
  if (nextReviewAt == null || nextReviewAt <= Math.floor(now / 1000)) {
    return advanceSchedule(currentStage, now);
  }
  return { reviewStage: Math.max(Math.trunc(currentStage), 0), nextReviewAt };
}

/** Whether a deck is due to be reviewed now. Never-reviewed decks with cards are due. */
export function isDue(
  nextReviewAt: number | null,
  cardCount: number,
  now: number = Date.now()
): boolean {
  if (cardCount <= 0) return false;
  if (nextReviewAt == null) return true;
  return nextReviewAt <= Math.floor(now / 1000);
}

/** Schedule state in a form the UI can localize. */
export type DueStatus =
  | { kind: 'never' }
  | { kind: 'due' }
  | { kind: 'days'; days: number };

/** Classifies a deck's due state without committing to any wording. */
export function dueStatus(nextReviewAt: number | null, now: number = Date.now()): DueStatus {
  if (nextReviewAt == null) return { kind: 'never' };
  const diff = nextReviewAt - Math.floor(now / 1000);
  if (diff <= 0) return { kind: 'due' };
  return { kind: 'days', days: Math.ceil(diff / DAY) };
}

/** Localized schedule label, e.g. "Due now", "Due in 1 day", "Due in 3 days". */
export function dueLabel(
  t: TFunction,
  nextReviewAt: number | null,
  now: number = Date.now(),
): string {
  const status = dueStatus(nextReviewAt, now);
  switch (status.kind) {
    // A never-reviewed deck is just as actionable as an overdue one.
    case 'never':
    case 'due':
      return t('schedule.review');
    case 'days':
      return t('schedule.dueInDays', { count: status.days });
  }
}

/** Fisher–Yates shuffle. Returns a new array; does not mutate the input. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Inserts `item` at a random position. Returns a new array; does not mutate. */
export function insertAtRandom<T>(arr: readonly T[], item: T): T[] {
  const copy = arr.slice();
  copy.splice(Math.floor(Math.random() * (copy.length + 1)), 0, item);
  return copy;
}
