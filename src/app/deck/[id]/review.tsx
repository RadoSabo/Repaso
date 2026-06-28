import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ProgressBar } from '@/components/progress-bar';
import {
  SwipeableFlashcard,
  type SwipeableFlashcardHandle,
} from '@/components/swipeable-flashcard';
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
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const { deck, current, upcoming, knew, missed, total, answer } = useReviewSession(deckId);
  const cardRef = useRef<SwipeableFlashcardHandle>(null);

  // Session finished (or deck had no cards).
  if (!current) {
    const days = deck ? intervalDaysForStage(deck.reviewStage) : 0;
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('nav.review') }} />
        <View style={styles.center}>
          <View style={[styles.doneTile, { backgroundColor: theme.successSoft }]}>
            <Icon name="confetti" size={58} color={theme.successOn} />
          </View>
          <ThemedText type="h1">{t('review.niceWork')}</ThemedText>
          {total > 0 ? (
            <>
              <ThemedText type="bodyLg" themeColor="textSecondary" style={styles.centerText}>
                {deck
                  ? t('review.reviewedFromDeck', { count: total, deck: deck.name })
                  : t('review.reviewedCards', { count: total })}
              </ThemedText>
              <ThemedText type="body" themeColor="textMuted" style={styles.centerText}>
                {t(missed > 0 ? 'review.summaryWithRepeats' : 'review.summary', {
                  knew,
                  repeats: t('review.repeats', { count: missed }),
                  nextReminder: t('review.nextReminder', { count: days }),
                })}
              </ThemedText>
            </>
          ) : (
            <ThemedText themeColor="textMuted" style={styles.centerText}>
              {t('review.noCards')}
            </ThemedText>
          )}
        </View>
        <BottomBar>
          <Button title={t('common.done')} size="lg" block leadingIcon="check" onPress={() => router.back()} />
        </BottomBar>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('nav.review'),
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
            ref={cardRef}
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
          {t('review.progressPrompt')}
        </ThemedText>
        <View style={styles.answers}>
          <AnswerButton
            label={t('review.studyAgain')}
            icon="refresh"
            bg={theme.dangerSoft}
            fg={theme.dangerOn}
            chip={theme.danger}
            onPress={() => cardRef.current?.fling(false)}
          />
          <AnswerButton
            label={t('review.gotIt')}
            icon="check"
            bg={theme.successSoft}
            fg={theme.successOn}
            chip={theme.success}
            onPress={() => cardRef.current?.fling(true)}
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
      <ThemedText type="smBold" numberOfLines={2} style={[styles.answerLabel, { color: fg }]}>
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
  },
  answerLabel: { flexShrink: 1, fontSize: 15 },
  answerChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
