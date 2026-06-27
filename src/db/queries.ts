import { desc, eq, sql } from 'drizzle-orm';

import { scheduleAfterReview } from '@/lib/scheduling';
import { db } from './client';
import { cards, decks, type Card, type NewCard } from './schema';

export const nowSec = () => Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------------------
// Read queries (pass the returned builder to `useLiveQuery` for live updates)
// ---------------------------------------------------------------------------

export interface DeckSummary {
  id: number;
  name: string;
  description: string | null;
  knownLang: string;
  targetLang: string;
  createdAt: number;
  reviewStage: number;
  nextReviewAt: number | null;
  cardCount: number;
}

// Split into two queries instead of one join: drizzle's `useLiveQuery` only
// watches a query's `from` table, so a joined decks+cards query never refreshes
// when cards change. `useDeckSummaries` runs both live and merges them.
export const decksListQuery = () =>
  db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      knownLang: decks.knownLang,
      targetLang: decks.targetLang,
      createdAt: decks.createdAt,
      reviewStage: decks.reviewStage,
      nextReviewAt: decks.nextReviewAt,
    })
    .from(decks)
    .orderBy(desc(decks.createdAt));

/** Card count per deck. Lives on the `cards` table so it updates on card changes. */
export const cardCountsQuery = () =>
  db
    .select({ deckId: cards.deckId, count: sql<number>`count(*)` })
    .from(cards)
    .groupBy(cards.deckId);

export const cardsForDeckQuery = (deckId: number) =>
  db.select().from(cards).where(eq(cards.deckId, deckId)).orderBy(desc(cards.createdAt));

/** Number of cards currently in a deck. */
export function countCardsInDeck(deckId: number): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .get();
  return row?.count ?? 0;
}

export const deckByIdQuery = (deckId: number) =>
  db.select().from(decks).where(eq(decks.id, deckId));

// ---------------------------------------------------------------------------
// Deck mutations
// ---------------------------------------------------------------------------

export function getDeck(id: number) {
  return db.select().from(decks).where(eq(decks.id, id)).get();
}

export function createDeck(input: {
  name: string;
  description?: string;
  knownLang: string;
  targetLang: string;
}) {
  return db
    .insert(decks)
    .values({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      knownLang: input.knownLang,
      targetLang: input.targetLang,
    })
    .returning()
    .get();
}

export function updateDeck(
  id: number,
  patch: Partial<Pick<typeof decks.$inferInsert, 'name' | 'description' | 'knownLang' | 'targetLang'>>
) {
  return db.update(decks).set(patch).where(eq(decks.id, id)).run();
}

export function deleteDeck(id: number) {
  return db.delete(decks).where(eq(decks.id, id)).run();
}

// ---------------------------------------------------------------------------
// Card mutations
// ---------------------------------------------------------------------------

export function getCard(id: number) {
  return db.select().from(cards).where(eq(cards.id, id)).get();
}

export function createCard(input: {
  deckId: number;
  front: string;
  back: string;
  source?: NewCard['source'];
}) {
  return db
    .insert(cards)
    .values({
      deckId: input.deckId,
      front: input.front.trim(),
      back: input.back.trim(),
      source: input.source ?? 'manual',
    })
    .returning()
    .get();
}

export function createCards(
  deckId: number,
  items: { front: string; back: string }[],
  source: NewCard['source'] = 'generated'
) {
  const rows = items
    .map((i) => ({ deckId, front: i.front.trim(), back: i.back.trim(), source }))
    .filter((r) => r.front.length > 0 && r.back.length > 0);
  if (rows.length === 0) return [];
  return db.insert(cards).values(rows).returning().all();
}

export function updateCard(id: number, patch: { front: string; back: string }) {
  return db
    .update(cards)
    .set({ front: patch.front.trim(), back: patch.back.trim() })
    .where(eq(cards.id, id))
    .run();
}

export function deleteCard(id: number) {
  return db.delete(cards).where(eq(cards.id, id)).run();
}

// ---------------------------------------------------------------------------
// Review flow
// ---------------------------------------------------------------------------

/** All cards in a deck (a review session shuffles these). */
export function getDeckCards(deckId: number): Card[] {
  return db.select().from(cards).where(eq(cards.deckId, deckId)).all();
}

/**
 * Records a completed review and resolves the deck's spaced schedule. Reviewing
 * while due advances the deck; reviewing early keeps the same stage and due
 * date. Returns the resulting schedule.
 */
export function completeDeckReview(
  deckId: number,
  currentStage: number,
  nextReviewAt: number | null
) {
  const next = scheduleAfterReview(currentStage, nextReviewAt);
  db.update(decks)
    .set({
      reviewStage: next.reviewStage,
      lastReviewedAt: nowSec(),
      nextReviewAt: next.nextReviewAt,
    })
    .where(eq(decks.id, deckId))
    .run();
  return next;
}

/** Stores (or clears) the id of the deck's scheduled reminder. */
export function setDeckNotificationId(deckId: number, notificationId: string | null) {
  db.update(decks).set({ notificationId }).where(eq(decks.id, deckId)).run();
}
