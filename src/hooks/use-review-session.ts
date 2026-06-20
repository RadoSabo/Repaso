import { useCallback, useEffect, useRef, useState } from 'react';

import { completeDeckReview, getDeck, getDeckCards, setDeckNotificationId } from '@/db/queries';
import type { Card, Deck } from '@/db/schema';
import { cancelReminder, scheduleDeckReminder } from '@/lib/notifications';
import { insertAtRandom, shuffle } from '@/lib/scheduling';

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
  const deck = getDeck(deckId);

  // Snapshot + shuffle the deck's cards once when the session starts.
  const [queue, setQueue] = useState<Card[]>(() => shuffle(getDeckCards(deckId)));
  const [knew, setKnew] = useState(0);
  const [missed, setMissed] = useState(0);
  // Card count is fixed for the session — capture it once, never re-read a ref in render.
  const [total] = useState(() => queue.length);
  const scheduled = useRef(false);

  const current = queue[0];
  const upcoming = queue[1];

  const answer = useCallback((knewIt: boolean) => {
    setQueue(([reviewed, ...rest]) => {
      if (!reviewed) return rest;
      return knewIt ? rest : insertAtRandom(rest, reviewed);
    });
    if (knewIt) setKnew((n) => n + 1);
    else setMissed((n) => n + 1);
  }, []);

  // When the queue empties, advance the deck schedule and (re)schedule the reminder — once.
  useEffect(() => {
    if (current || !deck || scheduled.current || total === 0) return;
    scheduled.current = true;
    const previousNotificationId = deck.notificationId;
    const next = completeDeckReview(deck.id, deck.reviewStage, deck.nextReviewAt);
    (async () => {
      await cancelReminder(previousNotificationId);
      const newId = await scheduleDeckReminder(deck.name, next.nextReviewAt);
      setDeckNotificationId(deck.id, newId);
    })();
  }, [current, deck, total]);

  return { deck, current, upcoming, knew, missed, total, answer };
}
