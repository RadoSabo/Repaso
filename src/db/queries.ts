import { desc, eq, sql } from 'drizzle-orm';

import { db } from './client';
import { cards, decks, type Card, type Deck, type NewCard } from './schema';

export const nowSec = () => Math.floor(Date.now() / 1000);

/** Runs `fn` atomically in one SQLite transaction (rolled back if it throws). */
export function withTransaction<T>(fn: () => T): T {
  return db.transaction(() => fn());
}

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
  const set = { ...patch };
  if (typeof set.name === 'string') set.name = set.name.trim();
  if (typeof set.description === 'string') set.description = set.description.trim() || null;
  return db.update(decks).set(set).where(eq(decks.id, id)).run();
}

export function deleteDeck(id: number) {
  return db.delete(decks).where(eq(decks.id, id)).run();
}

/** Total number of decks. */
export function countDecks(): number {
  const row = db.select({ count: sql<number>`count(*)` }).from(decks).get();
  return row?.count ?? 0;
}

/** Sentences for the deck new users start with (English → Spanish). */
const STARTER_CARDS = [
  { front: 'Good morning! How did you sleep?', back: '¡Buenos días! ¿Cómo dormiste?' },
  { front: 'I would like a coffee, please.', back: 'Quisiera un café, por favor.' },
  { front: 'Where is the train station?', back: '¿Dónde está la estación de tren?' },
  { front: 'How much does this cost?', back: '¿Cuánto cuesta esto?' },
  { front: 'See you tomorrow!', back: '¡Hasta mañana!' },
];

/** Creates the example deck shown on a fresh install so the app is never empty. */
export function seedStarterDeck() {
  return withTransaction(() => {
    const deck = createDeck({ name: 'Everyday Spanish', knownLang: 'English', targetLang: 'Spanish' });
    createCards(deck.id, STARTER_CARDS, 'manual');
    return deck;
  });
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

/** Every deck with its cards — used by the export/import data transfer. */
export function getAllDecksWithCards(): { deck: Deck; cards: Card[] }[] {
  const allDecks = db.select().from(decks).orderBy(desc(decks.createdAt)).all();
  const allCards = db.select().from(cards).orderBy(cards.createdAt).all();
  const cardsByDeck = new Map<number, Card[]>();
  for (const card of allCards) {
    const list = cardsByDeck.get(card.deckId);
    if (list) list.push(card);
    else cardsByDeck.set(card.deckId, [card]);
  }
  return allDecks.map((deck) => ({ deck, cards: cardsByDeck.get(deck.id) ?? [] }));
}

/**
 * Persists a completed review: the resolved schedule (computed by the caller,
 * see `useReviewSession`) plus the review timestamp.
 */
export function completeDeckReview(
  deckId: number,
  schedule: { reviewStage: number; nextReviewAt: number }
) {
  db.update(decks)
    .set({
      reviewStage: schedule.reviewStage,
      lastReviewedAt: nowSec(),
      nextReviewAt: schedule.nextReviewAt,
    })
    .where(eq(decks.id, deckId))
    .run();
}

/** Stores (or clears) the id of the deck's scheduled reminder. */
export function setDeckNotificationId(deckId: number, notificationId: string | null) {
  db.update(decks).set({ notificationId }).where(eq(decks.id, deckId)).run();
}
