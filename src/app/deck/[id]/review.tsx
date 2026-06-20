import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { SwipeableFlashcard } from '@/components/swipeable-flashcard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useReviewSession } from '@/hooks/use-review-session';
import { useTheme } from '@/hooks/use-theme';
import { intervalDaysForStage } from '@/lib/scheduling';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { deck, current, upcoming, knew, missed, total, answer } = useReviewSession(deckId);

  // Session finished (or deck had no cards).
  if (!current) {
    const days = deck ? intervalDaysForStage(deck.reviewStage) : 0;
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Review' }} />
        <View style={styles.center}>
          <ThemedText type="title" style={styles.doneEmoji}>
            🎉
          </ThemedText>
          <ThemedText type="subtitle">All done</ThemedText>
          {total > 0 ? (
            <>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                You knew {knew} of {total}
                {missed > 0 ? ` · ${missed} repeat${missed === 1 ? '' : 's'}` : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="tint" style={styles.centerText}>
                Next reminder in {days} day{days === 1 ? '' : 's'}
              </ThemedText>
            </>
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              This deck has no cards yet.
            </ThemedText>
          )}
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
          <Button title="Back to deck" onPress={() => router.back()} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Review · ${knew}/${total}` }} />

      <View style={styles.cardArea}>
        <View style={styles.stack}>
          <SwipeableFlashcard
            key={current.id}
            card={current}
            upcoming={upcoming}
            deck={deck}
            width={width}
            onAnswer={answer}
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.answers}>
          <AnswerButton label="I didn’t know" color={theme.danger} onPress={() => answer(false)} />
          <AnswerButton label="I knew it" color={theme.success} onPress={() => answer(true)} />
        </View>
      </View>
    </ThemedView>
  );
}

function AnswerButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.answerBtn,
        { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
      ]}>
      <ThemedText type="smallBold" style={styles.answerText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardArea: { flex: 1, padding: Spacing.three },
  stack: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
  doneEmoji: { fontSize: 56, lineHeight: 64 },
  footer: { padding: Spacing.three, gap: Spacing.three },
  answers: { flexDirection: 'row', gap: Spacing.three },
  answerBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { color: '#fff' },
});
