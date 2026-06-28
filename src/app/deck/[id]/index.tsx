import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { SwipeableCardRow } from '@/components/swipeable-card-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cardsForDeckQuery, deckByIdQuery } from '@/db/queries';
import type { Card as CardRow } from '@/db/schema';
import { confirmDeleteCard, confirmDeleteDeck } from '@/lib/deck-actions';
import { dueLabel, isDue } from '@/lib/scheduling';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();

  const { data: deckRows, updatedAt } = useLiveQuery(deckByIdQuery(deckId), [deckId]);
  const { data: cards } = useLiveQuery(cardsForDeckQuery(deckId), [deckId]);
  const deck = deckRows?.[0];
  // `updatedAt` is undefined until the live query first resolves; treat that as
  // loading so we don't flash "Deck not found" before the row arrives.
  const loading = updatedAt === undefined;

  const cardCount = cards?.length ?? 0;
  const due = deck ? isDue(deck.nextReviewAt, cardCount) : false;

  if (!deck) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('nav.deck') }} />
        {loading ? null : (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary">{t('deckDetail.deckNotFound')}</ThemedText>
          </View>
        )}
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
                {t('common.edit')}
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
            {cardCount > 0 ? dueLabel(t, deck.nextReviewAt) : t('deckDetail.noCardsYet')}
          </ThemedText>
          <ThemedText type="sm" themeColor="textMuted">
            · {t('home.cardCount', { count: cardCount })}
          </ThemedText>
        </View>
      </View>

      <Animated.FlatList
        data={cards}
        keyExtractor={(c: CardRow) => String(c.id)}
        itemLayoutAnimation={LinearTransition.duration(220)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText themeColor="textMuted" style={styles.emptyText}>
              {t('deckDetail.emptyCards')}
            </ThemedText>
          </View>
        }
        renderItem={({ item }: { item: CardRow }) => (
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
            title={t('deckDetail.addCard')}
            variant="secondary"
            leadingIcon="plus"
            style={styles.flex}
            onPress={() => router.push(`/card/new?deckId=${deckId}`)}
          />
          <Button
            title={t('deckDetail.generate')}
            variant="spark"
            leadingIcon="sparkle"
            style={styles.flex}
            onPress={() => router.push(`/generate?deckId=${deckId}`)}
          />
        </View>
        <Button
          title={
            cardCount === 0
              ? t('deckDetail.addCardsToReview')
              : due
                ? t('deckDetail.reviewNow')
                : t('deckDetail.review')
          }
          variant="success"
          size="lg"
          block
          leadingIcon="play"
          disabled={cardCount === 0}
          onPress={() => router.push(`/deck/${deckId}/review`)}
        />
        <Pressable
          onPress={() => confirmDeleteDeck(deck.id, deck.name, () => router.back())}
          style={styles.deleteBtn}
          hitSlop={8}>
          <ThemedText type="sm" themeColor="danger">
            {t('deckDetail.deleteDeck')}
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
