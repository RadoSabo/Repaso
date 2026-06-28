import { Alert } from 'react-native';

import { deleteCard, deleteDeck, getDeck } from '@/db/queries';
import i18n from '@/i18n';
import { cancelReminder } from '@/lib/notifications';

/**
 * Shared, side-effectful confirmations so deck/card deletion behaves identically
 * everywhere it's offered (home swipe, deck screen, card editor).
 */

/** Confirm and delete a deck (and its scheduled reminder + cards). */
export function confirmDeleteDeck(deckId: number, deckName: string, onDeleted?: () => void) {
  Alert.alert(i18n.t('confirm.deleteDeckTitle'), i18n.t('confirm.deleteDeckBody', { name: deckName }), [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    {
      text: i18n.t('common.delete'),
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
  Alert.alert(i18n.t('confirm.deleteCardTitle'), i18n.t('confirm.deleteCardBody', { front }), [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    {
      text: i18n.t('common.delete'),
      style: 'destructive',
      onPress: () => {
        deleteCard(cardId);
        onDeleted?.();
      },
    },
  ]);
}
