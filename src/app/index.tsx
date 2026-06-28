import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/icon-button';
import { ProgressBar } from '@/components/progress-bar';
import { SwipeableCardRow } from '@/components/swipeable-card-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, SparkGradient, Spacing } from '@/constants/theme';
import { type DeckSummary } from '@/db/queries';
import { useDeckSummaries } from '@/hooks/use-deck-summaries';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { confirmDeleteDeck } from '@/lib/deck-actions';
import { dueLabel, isDue } from '@/lib/scheduling';
import { useSettings } from '@/store/settings';

export default function DecksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const decks = useDeckSummaries();
  const onboarded = useSettings((s) => s.onboarded);

  if (!onboarded) return <Redirect href="/onboarding" />;

  const reviewable = decks.filter((d) => d.cardCount > 0);
  const dueDecks = reviewable.filter((d) => isDue(d.nextReviewAt, d.cardCount));
  const done = reviewable.length - dueDecks.length;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <ThemedText type="display">Repaso</ThemedText>
        <IconButton icon="gear" variant="soft" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <FlatList
        data={decks}
        keyExtractor={(d) => String(d.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View>
            {reviewable.length > 0 ? (
              <ProgressHero due={dueDecks.length} done={done} total={reviewable.length} />
            ) : null}
            <ThemedText type="h2" style={styles.sectionTitle}>
              Your decks
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <Card variant="sunk" padding="lg" style={styles.empty}>
            <Icon name="cards" size={40} color={theme.textFaint} />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No decks yet
            </ThemedText>
            <ThemedText type="sm" themeColor="textMuted" style={styles.emptyText}>
              Create a deck and add cards, or generate a set with AI.
            </ThemedText>
          </Card>
        }
        renderItem={({ item }) => (
          <SwipeableCardRow
            onEdit={() => router.push(`/deck/${item.id}/edit`)}
            onDelete={() => confirmDeleteDeck(item.id, item.name)}>
            <DeckRow deck={item} onPress={() => router.push(`/deck/${item.id}`)} />
          </SwipeableCardRow>
        )}
      />

      <BottomBar>
        <View style={styles.actions}>
          <Button
            variant="spark"
            size="lg"
            title="Generate"
            leadingIcon="sparkle"
            style={styles.flex}
            onPress={() => router.push('/generate')}
          />
          <Button
            variant="secondary"
            size="lg"
            title="New deck"
            leadingIcon="plus"
            style={styles.flex}
            onPress={() => router.push('/deck/new')}
          />
        </View>
      </BottomBar>
    </ThemedView>
  );
}

function ProgressHero({ due, done, total }: { due: number; done: number; total: number }) {
  const shadows = useShadows();
  const allDone = due === 0;
  return (
    <LinearGradient
      colors={SparkGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, shadows.spark]}>
      <View style={styles.heroTop}>
        <View style={styles.heroTitle}>
          <Icon name={allDone ? 'check-circle' : 'calendar-check'} size={24} color="#fff" />
          <ThemedText type="h3" style={styles.heroHeading}>
            {allDone ? 'All caught up' : `${due} ${due === 1 ? 'deck' : 'decks'} to review`}
          </ThemedText>
        </View>
        <ThemedText type="mono" style={styles.heroCount}>
          {done}/{total}
        </ThemedText>
      </View>
      <ProgressBar
        value={done}
        max={total}
        height={10}
        trackColor="rgba(255,255,255,0.3)"
        fillColor="#fff"
      />
      <ThemedText type="sm" style={styles.heroSub}>
        {allDone
          ? 'Every deck reviewed — see you next time 🎉'
          : `${done} of ${total} decks reviewed 💪`}
      </ThemedText>
    </LinearGradient>
  );
}

function DeckRow({ deck, onPress }: { deck: DeckSummary; onPress: () => void }) {
  const theme = useTheme();
  const due = isDue(deck.nextReviewAt, deck.cardCount);
  return (
    <Card padding="none" onPress={onPress} accessibilityLabel={deck.name} style={styles.row}>
      <View style={[styles.deckIcon, { backgroundColor: theme.brandSofter }]}>
        <Icon name="cards" size={24} color={theme.brand} />
      </View>
      <View style={styles.rowText}>
        <ThemedText type="h3" numberOfLines={1}>
          {deck.name}
        </ThemedText>
        <ThemedText type="sm" themeColor="textMuted" numberOfLines={1}>
          {deck.knownLang} → {deck.targetLang}
        </ThemedText>
      </View>
      <View style={styles.rowStatus}>
        {due ? (
          <Badge tone="brand">Due</Badge>
        ) : deck.cardCount > 0 ? (
          <ThemedText type="sm" themeColor="textMuted">
            {dueLabel(deck.nextReviewAt)}
          </ThemedText>
        ) : null}
        <ThemedText type="xs" themeColor="textFaint">
          {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.sm,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.xs, paddingBottom: Spacing.lg, flexGrow: 1 },
  separator: { height: Spacing.md },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.lg + 2,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 1, flex: 1 },
  heroHeading: { color: '#fff' },
  heroCount: { color: 'rgba(255,255,255,0.9)' },
  heroSub: { color: 'rgba(255,255,255,0.95)' },
  sectionTitle: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg },
  deckIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm + 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  rowStatus: { alignItems: 'flex-end', gap: Spacing.xs },
  empty: { alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { textAlign: 'center' },
  emptyText: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
});
