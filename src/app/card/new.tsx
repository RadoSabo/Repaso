import { useLocalSearchParams, useRouter } from 'expo-router';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { countCardsInDeck, createCard, getDeck } from '@/db/queries';
import { MAX_CARDS_PER_DECK } from '@/lib/limits';

export default function NewCardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const deck = getDeck(Number(deckId));

  if (!deck) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <ThemedText>Deck not found.</ThemedText>
      </ThemedView>
    );
  }

  const usedCount = countCardsInDeck(deck.id);
  const remaining = MAX_CARDS_PER_DECK - usedCount;

  if (remaining <= 0) {
    return (
      <ThemedView style={{ flex: 1, padding: 24, gap: 8 }}>
        <ThemedText type="subtitle">Deck is full</ThemedText>
        <ThemedText themeColor="textSecondary">
          A deck holds up to {MAX_CARDS_PER_DECK} cards. Delete a card before adding a new one.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <CardForm
        submitLabel="Add card"
        frontLabel={`Front (${deck.knownLang})`}
        backLabel={`Back (${deck.targetLang})`}
        notice={`${usedCount} of ${MAX_CARDS_PER_DECK} cards used — ${remaining} left.`}
        initial={{ front: '', back: '' }}
        onSubmit={(v) => {
          createCard({ deckId: deck.id, front: v.front, back: v.back, source: 'manual' });
          router.back();
        }}
      />
    </ThemedView>
  );
}
