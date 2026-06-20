import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIButton } from '@/components/ai-button';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cardsForDeckQuery, deckByIdQuery, deleteDeck } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { cancelReminder } from '@/lib/notifications';
import { dueLabel, isDue } from '@/lib/scheduling';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: deckRows } = useLiveQuery(deckByIdQuery(deckId), [deckId]);
  const { data: cards } = useLiveQuery(cardsForDeckQuery(deckId), [deckId]);
  const deck = deckRows?.[0];

  const cardCount = cards?.length ?? 0;
  const due = deck ? isDue(deck.nextReviewAt, cardCount) : false;

  function confirmDelete() {
    Alert.alert('Delete deck?', `"${deck?.name}" and all its cards will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          cancelReminder(deck?.notificationId);
          deleteDeck(deckId);
          router.back();
        },
      },
    ]);
  }

  if (!deck) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Deck' }} />
        <View style={styles.empty}>
          <ThemedText themeColor="textSecondary">Deck not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: deck.name,
          headerRight: () => (
            <Pressable hitSlop={12} onPress={() => router.push(`/deck/${deckId}/edit`)}>
              <ThemedText type="link" themeColor="tint">
                Edit
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      <View style={styles.summary}>
        <ThemedText type="small" themeColor="textSecondary">
          {deck.knownLang} → {deck.targetLang}
        </ThemedText>
        <ThemedText type="small" themeColor={due ? 'tint' : 'textSecondary'}>
          {cardCount > 0 ? dueLabel(deck.nextReviewAt) : 'No cards yet'} · {cardCount} card
          {cardCount === 1 ? '' : 's'}
        </ThemedText>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No cards yet. Add one manually or generate a set with AI.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/card/${item.id}`)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
            ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText numberOfLines={1}>{item.front}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.back}
              </ThemedText>
            </View>
          </Pressable>
        )}
      />

      <View
        style={[
          styles.actions,
          { paddingBottom: insets.bottom + Spacing.three, borderTopColor: theme.border },
        ]}>
        <View style={styles.actionRow}>
          <Button
            title="Add card"
            variant="secondary"
            style={styles.flex}
            onPress={() => router.push(`/card/new?deckId=${deckId}`)}
          />
          <AIButton
            title="Generate"
            style={styles.flex}
            onPress={() => router.push(`/generate?deckId=${deckId}`)}
          />
        </View>
        <Button
          title={cardCount === 0 ? 'Add cards to review' : due ? 'Review now' : 'Review'}
          disabled={cardCount === 0}
          onPress={() => router.push(`/deck/${deckId}/review`)}
        />
        <Pressable onPress={confirmDelete} style={styles.deleteBtn} hitSlop={8}>
          <ThemedText type="small" themeColor="danger">
            Delete deck
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: 2,
  },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, flexGrow: 1 },
  separator: { height: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  emptyText: { textAlign: 'center' },
  actions: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
  deleteBtn: { alignSelf: 'center', paddingVertical: Spacing.one },
});
