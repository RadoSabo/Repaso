import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getCard, getDeck, updateCard } from '@/db/queries';
import { confirmDeleteCard } from '@/lib/deck-actions';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const card = getCard(Number(id));
  const deck = card ? getDeck(card.deckId) : undefined;

  if (!card) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.xxl }}>
        <ThemedText>Card not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => confirmDeleteCard(card.id, card.front, () => router.back())}>
              <ThemedText type="smBold" themeColor="danger">
                Delete
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <CardForm
        submitLabel="Save changes"
        frontLabel={deck ? `Front (${deck.knownLang})` : 'Front'}
        backLabel={deck ? `Back (${deck.targetLang})` : 'Back'}
        initial={{ front: card.front, back: card.back }}
        onSubmit={(v) => {
          updateCard(card.id, v);
          router.back();
        }}
      />
    </ThemedView>
  );
}
