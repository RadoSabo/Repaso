import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { cardCountsQuery, decksListQuery, type DeckSummary } from '@/db/queries';

/**
 * Deck list for the home screen with live card counts. Uses two live queries —
 * one on `decks`, one on `cards` — because drizzle's `useLiveQuery` only watches
 * a query's `from` table, so a single joined query wouldn't refresh when cards
 * are added, removed, or edited. Merging two single-table queries keeps both the
 * deck rows and the counts live.
 */
export function useDeckSummaries(): DeckSummary[] {
  const { data: decks } = useLiveQuery(decksListQuery());
  const { data: counts } = useLiveQuery(cardCountsQuery());

  const countByDeck = new Map(counts.map((c) => [c.deckId, c.count]));
  return decks.map((deck) => ({ ...deck, cardCount: countByDeck.get(deck.id) ?? 0 }));
}
