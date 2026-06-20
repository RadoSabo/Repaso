import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Decks carry a simple per-deck spaced-review schedule:
 *   reviewStage   – how many review sessions have been completed
 *   lastReviewedAt– unix seconds of the last completed review
 *   nextReviewAt  – unix seconds when the deck is due again (null = never reviewed)
 *   notificationId– id of the scheduled local reminder (so it can be cancelled)
 */
export const decks = sqliteTable('decks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  knownLang: text('known_lang').notNull().default('English'),
  targetLang: text('target_lang').notNull().default('Spanish'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  reviewStage: integer('review_stage').notNull().default(0),
  lastReviewedAt: integer('last_reviewed_at'),
  nextReviewAt: integer('next_review_at'),
  notificationId: text('notification_id'),
});

export const cards = sqliteTable('cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deckId: integer('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  front: text('front').notNull(),
  back: text('back').notNull(),
  source: text('source', { enum: ['manual', 'generated'] })
    .notNull()
    .default('manual'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
