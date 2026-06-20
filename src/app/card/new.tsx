import { useLocalSearchParams, useRouter } from 'expo-router';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createCard, getDeck } from '@/db/queries';

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

  return (
    <ThemedView style={{ flex: 1 }}>
      <CardForm
        submitLabel="Add card"
        frontLabel={`Front (${deck.knownLang})`}
        backLabel={`Back (${deck.targetLang})`}
        initial={{ front: '', back: '' }}
        onSubmit={(v) => {
          createCard({ deckId: deck.id, front: v.front, back: v.back, source: 'manual' });
          router.back();
        }}
      />
    </ThemedView>
  );
}
