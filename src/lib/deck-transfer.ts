/**
 * Export / import of all decks as a single JSON file — the data-loss safety
 * valve for the local-only MVP (no sync). Export writes a versioned JSON and
 * opens the share sheet; import always creates NEW decks (append-only, no
 * matching or dedupe). See docs/plans/mvp-monetization.md.
 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { createCards, createDeck, getAllDecksWithCards } from '@/db/queries';
import { MAX_CARDS_PER_DECK } from './limits';

/** Bump if the on-disk shape changes; import rejects unknown future versions. */
const TRANSFER_VERSION = 1;

interface TransferCard {
  front: string;
  back: string;
}

interface TransferDeck {
  name: string;
  description: string | null;
  knownLang: string;
  targetLang: string;
  cards: TransferCard[];
}

interface TransferFile {
  version: number;
  decks: TransferDeck[];
}

export class DeckTransferError extends Error {}

/** Serialize every deck + its cards and open the share sheet. */
export async function exportDecks(): Promise<void> {
  const payload: TransferFile = {
    version: TRANSFER_VERSION,
    decks: getAllDecksWithCards().map(({ deck, cards }) => ({
      name: deck.name,
      description: deck.description,
      knownLang: deck.knownLang,
      targetLang: deck.targetLang,
      cards: cards.map((c) => ({ front: c.front, back: c.back })),
    })),
  };

  if (payload.decks.length === 0) {
    throw new DeckTransferError('You have no decks to export yet.');
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new DeckTransferError('Sharing is not available on this device.');
  }

  const file = new File(Paths.cache, `repaso-decks-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Repaso decks',
  });
}

/**
 * Let the user pick an export file and import it. Always creates new decks.
 * Returns the number of decks imported (0 if the picker was cancelled).
 */
export async function importDecks(): Promise<number> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return 0;

  const uri = result.assets[0]?.uri;
  if (!uri) throw new DeckTransferError('Could not read the selected file.');

  let parsed: TransferFile;
  try {
    parsed = JSON.parse(await new File(uri).text());
  } catch {
    throw new DeckTransferError('That file is not a valid Repaso export.');
  }
  if (!parsed || !Array.isArray(parsed.decks)) {
    throw new DeckTransferError('That file is not a valid Repaso export.');
  }
  if (parsed.version > TRANSFER_VERSION) {
    throw new DeckTransferError('This file was made by a newer version of Repaso.');
  }

  let imported = 0;
  for (const d of parsed.decks) {
    if (!d || typeof d.name !== 'string') continue;
    const deck = createDeck({
      name: d.name.trim() || 'Imported deck',
      description: typeof d.description === 'string' ? d.description : undefined,
      knownLang: typeof d.knownLang === 'string' && d.knownLang ? d.knownLang : 'English',
      targetLang: typeof d.targetLang === 'string' && d.targetLang ? d.targetLang : 'Spanish',
    });
    const cards = (Array.isArray(d.cards) ? d.cards : [])
      .map((c) => ({ front: String(c?.front ?? ''), back: String(c?.back ?? '') }))
      .filter((c) => c.front.trim() && c.back.trim())
      .slice(0, MAX_CARDS_PER_DECK);
    if (cards.length > 0) createCards(deck.id, cards, 'manual');
    imported += 1;
  }
  return imported;
}
