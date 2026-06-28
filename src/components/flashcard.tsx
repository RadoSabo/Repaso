import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Card, Deck } from '@/db/schema';
import { useShadows, useTheme } from '@/hooks/use-theme';

interface FlashcardProps {
  card: Card;
  deck: Deck | undefined;
  /** Show the answer (back) side when true, otherwise the prompt (front) side. */
  flipped: boolean;
  /** Optional helper line shown at the bottom of the card. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Presentational flash card face. Stateless — flip state lives with the caller. */
export function Flashcard({ card, deck, flipped, hint, style }: FlashcardProps) {
  const theme = useTheme();
  const shadows = useShadows();

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        flipped
          ? { backgroundColor: theme.brandSofter, borderColor: theme.brandSoft }
          : { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
        style,
      ]}>
      <ThemedText
        type="overline"
        themeColor={flipped ? 'brandContrast' : 'textMuted'}
        style={styles.sideLabel}>
        {flipped ? deck?.targetLang ?? 'Back' : deck?.knownLang ?? 'Front'}
      </ThemedText>
      <ThemedText type="display" style={styles.text}>
        {flipped ? card.back : card.front}
      </ThemedText>
      {hint ? (
        <View style={styles.hint}>
          <Icon name="hand-tap" size={16} color={theme.textFaint} />
          <ThemedText type="sm" themeColor="textFaint">
            {hint}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: { position: 'absolute', top: Spacing.xxl },
  text: { textAlign: 'center' },
  hint: {
    position: 'absolute',
    bottom: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
});
