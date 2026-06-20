import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const DATABASE_NAME = 'repaso.db';

// `enableChangeListener` powers `useLiveQuery`, so screens auto-refresh on writes.
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(expoDb);

/** Adds a column to a table if it isn't already present (lightweight migration). */
function ensureColumn(table: string, column: string, ddl: string) {
  const cols = expoDb.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

/**
 * Bootstraps the schema with idempotent DDL. For an MVP with a small schema this
 * is simpler and more robust than a migration pipeline; `ensureColumn` covers
 * additive changes for installs created before a column existed.
 */
export function initDatabase() {
  expoDb.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      known_lang TEXT NOT NULL DEFAULT 'English',
      target_lang TEXT NOT NULL DEFAULT 'Spanish',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      review_stage INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at INTEGER,
      next_review_at INTEGER,
      notification_id TEXT
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
  `);

  // Additive migrations for decks created before the review-schedule columns existed.
  ensureColumn('decks', 'review_stage', 'review_stage INTEGER NOT NULL DEFAULT 0');
  ensureColumn('decks', 'last_reviewed_at', 'last_reviewed_at INTEGER');
  ensureColumn('decks', 'next_review_at', 'next_review_at INTEGER');
  ensureColumn('decks', 'notification_id', 'notification_id TEXT');
}
