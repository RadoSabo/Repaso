import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Card, Deck } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

interface FlashcardProps {
  card: Card;
  deck: Deck | undefined;
  /** Show the answer (back) side when true, otherwise the prompt (front) side. */
  flipped: boolean;
  /** Optional helper line shown at the bottom of the card. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Presentational flash card. Stateless — flip state lives with the caller. */
export function Flashcard({ card, deck, flipped, hint, style }: FlashcardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sideLabel}>
        {flipped ? deck?.targetLang ?? 'Back' : deck?.knownLang ?? 'Front'}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.text}>
        {flipped ? card.back : card.front}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  sideLabel: { textTransform: 'uppercase', letterSpacing: 1 },
  text: { textAlign: 'center' },
  hint: { position: 'absolute', bottom: Spacing.three },
});
