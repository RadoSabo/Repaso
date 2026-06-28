import {
  advanceSchedule,
  dueStatus,
  insertAtRandom,
  intervalDaysForStage,
  isDue,
  REVIEW_INTERVALS_DAYS,
  scheduleAfterReview,
  shuffle,
} from './scheduling';

const NOW = 1_700_000_000_000; // fixed clock (ms)
const nowSec = Math.floor(NOW / 1000);
const DAY = 86_400;

describe('advanceSchedule', () => {
  it('uses escalating intervals as the stage grows', () => {
    const s0 = advanceSchedule(0, NOW);
    expect(s0.reviewStage).toBe(1);
    expect(s0.nextReviewAt).toBe(nowSec + REVIEW_INTERVALS_DAYS[0] * DAY); // 1 day

    const s1 = advanceSchedule(1, NOW);
    expect(s1.nextReviewAt).toBe(nowSec + REVIEW_INTERVALS_DAYS[1] * DAY); // 2 days

    const s2 = advanceSchedule(2, NOW);
    expect(s2.nextReviewAt).toBe(nowSec + REVIEW_INTERVALS_DAYS[2] * DAY); // 5 days
  });

  it('clamps the interval at the last stage', () => {
    const huge = advanceSchedule(999, NOW);
    const last = REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1];
    expect(huge.nextReviewAt).toBe(nowSec + last * DAY);
    expect(huge.reviewStage).toBe(1000);
  });
});

describe('scheduleAfterReview', () => {
  it('advances when the deck has never been reviewed', () => {
    expect(scheduleAfterReview(0, null, NOW)).toEqual(advanceSchedule(0, NOW));
  });

  it('advances when the deck is due (past its next review time)', () => {
    const due = nowSec - DAY; // due yesterday
    expect(scheduleAfterReview(2, due, NOW)).toEqual(advanceSchedule(2, NOW));
  });

  it('advances when the deck is due exactly now', () => {
    expect(scheduleAfterReview(1, nowSec, NOW)).toEqual(advanceSchedule(1, NOW));
  });

  it('does not advance or move the date for an early review', () => {
    const future = nowSec + 5 * DAY;
    expect(scheduleAfterReview(3, future, NOW)).toEqual({ reviewStage: 3, nextReviewAt: future });
  });

  it('keeps the date stable across repeated early reviews', () => {
    const future = nowSec + 5 * DAY;
    let stage = 3;
    let next: number | null = future;
    for (let i = 0; i < 3; i++) {
      const result = scheduleAfterReview(stage, next, NOW);
      stage = result.reviewStage;
      next = result.nextReviewAt;
    }
    expect(stage).toBe(3);
    expect(next).toBe(future);
  });
});

describe('intervalDaysForStage', () => {
  it('maps stages to intervals and clamps out-of-range stages', () => {
    expect(intervalDaysForStage(0)).toBe(1);
    expect(intervalDaysForStage(-5)).toBe(1);
    expect(intervalDaysForStage(100)).toBe(REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1]);
  });
});

describe('isDue', () => {
  it('is due when never reviewed and the deck has cards', () => {
    expect(isDue(null, 3, NOW)).toBe(true);
  });
  it('is never due when the deck has no cards', () => {
    expect(isDue(null, 0, NOW)).toBe(false);
    expect(isDue(nowSec - 100, 0, NOW)).toBe(false);
  });
  it('is due once the next-review time has passed', () => {
    expect(isDue(nowSec - 1, 2, NOW)).toBe(true);
    expect(isDue(nowSec + DAY, 2, NOW)).toBe(false);
  });
});

describe('dueStatus', () => {
  it('classifies the schedule state', () => {
    expect(dueStatus(null, NOW)).toEqual({ kind: 'never' });
    expect(dueStatus(nowSec - 10, NOW)).toEqual({ kind: 'due' });
    expect(dueStatus(nowSec + DAY, NOW)).toEqual({ kind: 'days', days: 1 });
    expect(dueStatus(nowSec + 3 * DAY, NOW)).toEqual({ kind: 'days', days: 3 });
  });
});

describe('shuffle', () => {
  it('keeps every element exactly once and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('insertAtRandom', () => {
  it('adds the item once at some position without mutating', () => {
    const input = ['a', 'b', 'c'];
    const out = insertAtRandom(input, 'x');
    expect(out).toHaveLength(4);
    expect(out.filter((v) => v === 'x')).toHaveLength(1);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
