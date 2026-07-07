import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeckForm } from '@/components/deck-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { countCardsInDeck, getDeck, updateDeck } from '@/db/queries';

export default function EditDeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  // The deck and whether it has cards are fixed for this screen's lifetime — snapshot once.
  const [deck] = useState(() => getDeck(Number(id)));
  const [hasCards] = useState(() => (deck ? countCardsInDeck(deck.id) > 0 : false));

  if (!deck) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.xxl }}>
        <ThemedText>{t('deckDetail.deckNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <DeckForm
        submitLabel={t('deckForm.saveChanges')}
        lockLanguages={hasCards}
        initial={{
          name: deck.name,
          description: deck.description ?? '',
          knownLang: deck.knownLang,
          targetLang: deck.targetLang,
        }}
        onSubmit={(v) => {
          updateDeck(deck.id, {
            name: v.name.trim(),
            description: v.description.trim() || null,
            knownLang: v.knownLang,
            targetLang: v.targetLang,
          });
          router.back();
        }}
      />
    </ThemedView>
  );
}
