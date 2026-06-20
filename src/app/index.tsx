import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Link, Stack, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AIButton } from "@/components/ai-button";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { deckSummariesQuery, type DeckSummary } from "@/db/queries";
import { useTheme } from "@/hooks/use-theme";
import { dueLabel, isDue } from "@/lib/scheduling";

export default function DecksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: decks } = useLiveQuery(deckSummariesQuery());

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={12} accessibilityLabel="Settings">
                <ThemedText style={styles.gear}>⚙︎</ThemedText>
              </Pressable>
            </Link>
          ),
        }}
      />

      <FlatList
        data={decks}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No decks yet
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Create a deck and add cards, or generate a set with AI.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <DeckRow
            deck={item}
            onPress={() => router.push(`/deck/${item.id}`)}
          />
        )}
      />

      <View
        style={[
          styles.actions,
          {
            paddingBottom: insets.bottom + Spacing.three,
            borderTopColor: theme.border,
          },
        ]}
      >
        <AIButton
          title="Generate"
          style={styles.actionBtn}
          onPress={() => router.push("/generate")}
        />
        <Button
          title="+ New deck"
          style={styles.actionBtn}
          onPress={() => router.push("/deck/new")}
        />
      </View>
    </ThemedView>
  );
}

function DeckRow({
  deck,
  onPress,
}: {
  deck: DeckSummary;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? theme.backgroundSelected
            : theme.backgroundElement,
        },
      ]}
    >
      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {deck.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {deck.knownLang} → {deck.targetLang} · {deck.cardCount} card
          {deck.cardCount === 1 ? "" : "s"}
        </ThemedText>
      </View>
      {isDue(deck.nextReviewAt, deck.cardCount) ? (
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <ThemedText type="smallBold" style={{ color: theme.tintText }}>
            Review
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {deck.cardCount > 0 ? dueLabel(deck.nextReviewAt) : "0 cards"}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gear: { fontSize: 22 },
  listContent: { padding: Spacing.three, flexGrow: 1 },
  separator: { height: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.five,
  },
  emptyTitle: { textAlign: "center" },
  emptyText: { textAlign: "center" },
  actions: {
    flexDirection: "row",
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flex: 1 },
});
