import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Flashcard } from '@/components/flashcard';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Card, Deck } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

/** Fraction of the screen width a card must travel to commit an answer. */
const SWIPE_THRESHOLD_RATIO = 0.25;
/** How far past the edge the card flies before unmounting. */
const FLING_OFFSCREEN_RATIO = 1.5;
const FLING_DURATION_MS = 200;
/** Peak rotation, in degrees, at a full-width drag. */
const MAX_TILT_DEG = 10;
const FLIP_DURATION_MS = 300;
/** Higher = flatter flip, lower = more dramatic perspective. */
const FLIP_PERSPECTIVE = 1000;
/** Resting scale of the next card peeking behind the top one. */
const PEEK_SCALE = 0.96;

interface SwipeableFlashcardProps {
  card: Card;
  /** Next card, revealed beneath the top one as it is swiped away. */
  upcoming: Card | undefined;
  deck: Deck | undefined;
  /** Screen width, used to scale the swipe threshold and fling distance. */
  width: number;
  onAnswer: (knewIt: boolean) => void;
}

/**
 * The top, interactive card plus the next card peeking behind it. Tap performs
 * a 3D flip between the prompt and answer faces; a horizontal swipe past the
 * threshold flings it off-screen and resolves the answer (right = knew it,
 * left = missed). The next card fades in only while dragging, so a flip never
 * reveals it. Mount one per card with `key={card.id}`: each instance owns its
 * own flip and drag state, so the outgoing card animates away and unmounts
 * off-screen while the next mounts centred — no shared state to reset.
 */
export function SwipeableFlashcard({ card, upcoming, deck, width, onAnswer }: SwipeableFlashcardProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const isFlipped = useSharedValue(false);
  const threshold = width * SWIPE_THRESHOLD_RATIO;

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) <= threshold) {
        translateX.value = withSpring(0);
        return;
      }
      const knewIt = e.translationX > 0;
      const destination = (knewIt ? 1 : -1) * width * FLING_OFFSCREEN_RATIO;
      translateX.value = withTiming(destination, { duration: FLING_DURATION_MS }, (done) => {
        if (done) runOnJS(onAnswer)(knewIt);
      });
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) isFlipped.value = !isFlipped.value;
  });

  const gesture = Gesture.Race(pan, tap);

  // Drag offset + tilt applied to the whole top card.
  const swipeStyle = useAnimatedStyle(() => {
    const tilt = interpolate(translateX.value, [-width, 0, width], [-MAX_TILT_DEG, 0, MAX_TILT_DEG]);
    return { transform: [{ translateX: translateX.value }, { rotateZ: `${tilt}deg` }] };
  });

  // Next card fades + scales in with the drag, and stays hidden when centred.
  const peekStyle = useAnimatedStyle(() => {
    const drag = Math.abs(translateX.value);
    return {
      opacity: interpolate(drag, [0, threshold], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(drag, [0, threshold], [PEEK_SCALE, 1], Extrapolation.CLAMP) }],
    };
  });

  // 0 = front (prompt) showing, 1 = back (answer) showing. Animates when tapped.
  const flipProgress = useDerivedValue(() =>
    withTiming(isFlipped.value ? 1 : 0, { duration: FLIP_DURATION_MS }),
  );

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: FLIP_PERSPECTIVE },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: FLIP_PERSPECTIVE },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  const knewLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }));

  const missedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={StyleSheet.absoluteFill}>
        {upcoming ? (
          <Animated.View style={[styles.fill, peekStyle]}>
            <Flashcard card={upcoming} deck={deck} flipped={false} />
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.fill, swipeStyle]}>
          <Animated.View style={[styles.face, frontStyle]}>
            <Flashcard card={card} deck={deck} flipped={false} hint="Tap to flip · swipe to answer" />
          </Animated.View>
          <Animated.View style={[styles.face, backStyle]}>
            <Flashcard card={card} deck={deck} flipped hint="Tap to flip back" />
          </Animated.View>

          <Animated.View
            style={[styles.label, styles.labelLeft, { borderColor: theme.success }, knewLabelStyle]}>
            <ThemedText type="smBold" style={[styles.labelText, { color: theme.success }]}>
              I knew it
            </ThemedText>
          </Animated.View>
          <Animated.View
            style={[styles.label, styles.labelRight, { borderColor: theme.danger }, missedLabelStyle]}>
            <ThemedText type="smBold" style={[styles.labelText, { color: theme.danger }]}>
              I didn’t know
            </ThemedText>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  label: {
    position: 'absolute',
    top: Spacing.xxl,
    borderWidth: 2,
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  labelLeft: { left: Spacing.xxl, transform: [{ rotate: '-12deg' }] },
  labelRight: { right: Spacing.xxl, transform: [{ rotate: '12deg' }] },
  labelText: { textTransform: 'uppercase', letterSpacing: 1 },
});
