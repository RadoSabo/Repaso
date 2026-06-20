import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteCard, getCard, getDeck, updateCard } from '@/db/queries';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const card = getCard(Number(id));
  const deck = card ? getDeck(card.deckId) : undefined;

  if (!card) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.four }}>
        <ThemedText>Card not found.</ThemedText>
      </ThemedView>
    );
  }

  function confirmDelete() {
    Alert.alert('Delete card?', 'This card will be removed from the deck.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCard(card!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable hitSlop={12} onPress={confirmDelete}>
              <ThemedText type="link" themeColor="danger">
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
      <View style={styles.footer} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  footer: { height: Spacing.three },
});
