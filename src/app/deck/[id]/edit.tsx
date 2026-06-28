import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DeckForm } from '@/components/deck-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { countCardsInDeck, getDeck, updateDeck } from '@/db/queries';

export default function EditDeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const deck = getDeck(Number(id));

  if (!deck) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <ThemedText>{t('deckDetail.deckNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  const hasCards = countCardsInDeck(deck.id) > 0;

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
