import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { SwipeableCardRow } from '@/components/swipeable-card-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cardsForDeckQuery, deckByIdQuery, deleteCard, deleteDeck } from '@/db/queries';
import { cancelReminder } from '@/lib/notifications';
import { dueLabel, isDue } from '@/lib/scheduling';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const router = useRouter();

  const { data: deckRows } = useLiveQuery(deckByIdQuery(deckId), [deckId]);
  const { data: cards } = useLiveQuery(cardsForDeckQuery(deckId), [deckId]);
  const deck = deckRows?.[0];

  const cardCount = cards?.length ?? 0;
  const due = deck ? isDue(deck.nextReviewAt, cardCount) : false;

  function confirmDeleteCard(cardId: number, front: string) {
    Alert.alert('Delete card?', `"${front}" will be removed from the deck.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCard(cardId) },
    ]);
  }

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
              <ThemedText type="smBold" themeColor="brandContrast">
                Edit
              </ThemedText>
            </Pressable>
          ),
        }}
      />

      <View style={styles.summary}>
        <ThemedText type="smBold" themeColor="textSecondary">
          {deck.knownLang} → {deck.targetLang}
        </ThemedText>
        <View style={styles.summaryMeta}>
          <ThemedText type="smBold" themeColor={due ? 'brandContrast' : 'textMuted'}>
            {cardCount > 0 ? dueLabel(deck.nextReviewAt) : 'No cards yet'}
          </ThemedText>
          <ThemedText type="sm" themeColor="textMuted">
            · {cardCount} card{cardCount === 1 ? '' : 's'}
          </ThemedText>
        </View>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => String(c.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText themeColor="textMuted" style={styles.emptyText}>
              No cards yet. Add one manually or generate a set with AI.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableCardRow
            onEdit={() => router.push(`/card/${item.id}`)}
            onDelete={() => confirmDeleteCard(item.id, item.front)}>
            <Card variant="sunk" padding="sm" onPress={() => router.push(`/card/${item.id}`)}>
              <ThemedText type="bodyBold" numberOfLines={1} style={styles.cardFront}>
                {item.front}
              </ThemedText>
              <ThemedText type="body" themeColor="textMuted" numberOfLines={1}>
                {item.back}
              </ThemedText>
            </Card>
          </SwipeableCardRow>
        )}
      />

      <BottomBar>
        <View style={styles.actionRow}>
          <Button
            title="Add card"
            variant="secondary"
            leadingIcon="plus"
            style={styles.flex}
            onPress={() => router.push(`/card/new?deckId=${deckId}`)}
          />
          <Button
            title="Generate"
            variant="spark"
            leadingIcon="sparkle"
            style={styles.flex}
            onPress={() => router.push(`/generate?deckId=${deckId}`)}
          />
        </View>
        <Button
          title={cardCount === 0 ? 'Add cards to review' : due ? 'Review now' : 'Review'}
          size="lg"
          block
          leadingIcon="play"
          disabled={cardCount === 0}
          onPress={() => router.push(`/deck/${deckId}/review`)}
        />
        <Pressable onPress={confirmDelete} style={styles.deleteBtn} hitSlop={8}>
          <ThemedText type="sm" themeColor="danger">
            Delete deck
          </ThemedText>
        </Pressable>
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing.lg, flexGrow: 1 },
  separator: { height: Spacing.md - 2 },
  cardFront: { marginBottom: 3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyText: { textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
  deleteBtn: { alignSelf: 'center', paddingVertical: Spacing.xs },
});
