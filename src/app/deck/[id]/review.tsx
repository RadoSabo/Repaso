import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ProgressBar } from '@/components/progress-bar';
import { SwipeableFlashcard } from '@/components/swipeable-flashcard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useReviewSession } from '@/hooks/use-review-session';
import { useTheme } from '@/hooks/use-theme';
import { intervalDaysForStage } from '@/lib/scheduling';

const DONE_TILE = 120;

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { deck, current, upcoming, knew, missed, total, answer } = useReviewSession(deckId);

  // Session finished (or deck had no cards).
  if (!current) {
    const days = deck ? intervalDaysForStage(deck.reviewStage) : 0;
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Review' }} />
        <View style={styles.center}>
          <View style={[styles.doneTile, { backgroundColor: theme.successSoft }]}>
            <Icon name="confetti" size={58} color={theme.successOn} />
          </View>
          <ThemedText type="h1">Nice work!</ThemedText>
          {total > 0 ? (
            <>
              <ThemedText type="bodyLg" themeColor="textSecondary" style={styles.centerText}>
                You reviewed {total} card{total === 1 ? '' : 's'}
                {deck ? ` from ${deck.name}` : ''}.
              </ThemedText>
              <ThemedText type="body" themeColor="textMuted" style={styles.centerText}>
                You knew {knew}
                {missed > 0 ? ` · ${missed} repeat${missed === 1 ? '' : 's'}` : ''} · next reminder in{' '}
                {days} day{days === 1 ? '' : 's'} 🔁
              </ThemedText>
            </>
          ) : (
            <ThemedText themeColor="textMuted" style={styles.centerText}>
              This deck has no cards yet.
            </ThemedText>
          )}
        </View>
        <BottomBar>
          <Button title="Done" size="lg" block leadingIcon="check" onPress={() => router.back()} />
        </BottomBar>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Review',
          headerRight: () => (
            <ThemedText type="mono" themeColor="textMuted">
              {knew}/{total}
            </ThemedText>
          ),
        }}
      />

      <View style={styles.progress}>
        <ProgressBar value={knew} max={total} height={8} />
      </View>

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

      <BottomBar>
        <ThemedText type="smBold" themeColor="textMuted" style={styles.prompt}>
          How well did you know it?
        </ThemedText>
        <View style={styles.answers}>
          <AnswerButton
            label="Study again"
            icon="refresh"
            bg={theme.dangerSoft}
            fg={theme.dangerOn}
            chip={theme.danger}
            onPress={() => answer(false)}
          />
          <AnswerButton
            label="Got it"
            icon="check"
            bg={theme.successSoft}
            fg={theme.successOn}
            chip={theme.success}
            onPress={() => answer(true)}
          />
        </View>
      </BottomBar>
    </ThemedView>
  );
}

function AnswerButton({
  label,
  icon,
  bg,
  fg,
  chip,
  onPress,
}: {
  label: string;
  icon: IconName;
  bg: string;
  fg: string;
  chip: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.answerBtn,
        { backgroundColor: bg, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}>
      <View style={[styles.answerChip, { backgroundColor: chip }]}>
        <Icon name={icon} size={17} color="#fff" />
      </View>
      <ThemedText type="smBold" style={{ color: fg, fontSize: 15 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.sm },
  cardArea: { flex: 1, padding: Spacing.gutter },
  stack: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxxl },
  centerText: { textAlign: 'center' },
  doneTile: {
    width: DONE_TILE,
    height: DONE_TILE,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  prompt: { textAlign: 'center' },
  answers: { flexDirection: 'row', gap: Spacing.md },
  answerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 1,
    minHeight: 56,
    borderRadius: Radius.lg,
  },
  answerChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
