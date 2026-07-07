import { useCallback, useRef, useState } from 'react';

import { completeDeckReview, getDeck, getDeckCards, setDeckNotificationId } from '@/db/queries';
import type { Card, Deck } from '@/db/schema';
import { cancelReminder, scheduleDeckReminder } from '@/lib/notifications';
import { insertAtRandom, scheduleAfterReview, shuffle } from '@/lib/scheduling';

export interface ReviewSession {
  deck: Deck | undefined;
  /** Card on top of the stack, awaiting an answer. */
  current: Card | undefined;
  /** Next card, rendered beneath `current` so the swipe reveals it. */
  upcoming: Card | undefined;
  knew: number;
  missed: number;
  total: number;
  /** Resolve the current card; missed cards are reshuffled back into the queue. */
  answer: (knewIt: boolean) => void;
}

/**
 * Owns a single review run for a deck: the shuffled card queue, the running
 * score, and the one-time schedule/reminder update when the queue empties.
 * Kept free of presentation so it can be unit-tested on its own.
 */
export function useReviewSession(deckId: number): ReviewSession {
  // The session intentionally works on a mount-time snapshot of the deck.
  const [deck] = useState(() => getDeck(deckId));

  // Snapshot + shuffle the deck's cards once when the session starts.
  const [queue, setQueue] = useState<Card[]>(() => shuffle(getDeckCards(deckId)));
  const [knew, setKnew] = useState(0);
  const [missed, setMissed] = useState(0);
  // Card count is fixed for the session — capture it once, never re-read a ref in render.
  const [total] = useState(() => queue.length);
  const completed = useRef(false);

  const current = queue[0];
  const upcoming = queue[1];

  // Advance the deck schedule and (re)schedule the reminder — once per session.
  const completeSession = useCallback(() => {
    if (!deck || completed.current) return;
    completed.current = true;
    const next = scheduleAfterReview(deck.reviewStage, deck.nextReviewAt);
    completeDeckReview(deck.id, next);
    void (async () => {
      await cancelReminder(deck.notificationId);
      const newId = await scheduleDeckReminder(deck.name, next.nextReviewAt);
      setDeckNotificationId(deck.id, newId);
    })().catch((e) => console.warn('[review] rescheduling the deck reminder failed', e));
  }, [deck]);

  const answer = useCallback(
    (knewIt: boolean) => {
      // The queue only ever empties on a known card (missed cards are reinserted),
      // so completion is an event of answering the last card — not a render effect.
      if (knewIt && queue.length === 1) completeSession();
      setQueue(([reviewed, ...rest]) => {
        if (!reviewed) return rest;
        return knewIt ? rest : insertAtRandom(rest, reviewed);
      });
      if (knewIt) setKnew((n) => n + 1);
      else setMissed((n) => n + 1);
    },
    [queue.length, completeSession],
  );

  return { deck, current, upcoming, knew, missed, total, answer };
}
