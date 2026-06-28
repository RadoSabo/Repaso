import { Alert } from 'react-native';

import { deleteCard, deleteDeck, getDeck } from '@/db/queries';
import { cancelReminder } from '@/lib/notifications';

/**
 * Shared, side-effectful confirmations so deck/card deletion behaves identically
 * everywhere it's offered (home swipe, deck screen, card editor).
 */

/** Confirm and delete a deck (and its scheduled reminder + cards). */
export function confirmDeleteDeck(deckId: number, deckName: string, onDeleted?: () => void) {
  Alert.alert('Delete deck?', `"${deckName}" and all its cards will be removed.`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        cancelReminder(getDeck(deckId)?.notificationId);
        deleteDeck(deckId);
        onDeleted?.();
      },
    },
  ]);
}

/** Confirm and delete a single card. */
export function confirmDeleteCard(cardId: number, front: string, onDeleted?: () => void) {
  Alert.alert('Delete card?', `"${front}" will be removed from the deck.`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        deleteCard(cardId);
        onDeleted?.();
      },
    },
  ]);
}
