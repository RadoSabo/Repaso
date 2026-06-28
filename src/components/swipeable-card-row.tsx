import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Horizontal travel needed to fire an action on release. */
const TRIGGER = 96;
/** Drag distance over which an action panel fades fully in. */
const REVEAL = 56;

interface SwipeableCardRowProps {
  children: ReactNode;
  /** Swipe right past the trigger. */
  onEdit: () => void;
  /** Swipe left past the trigger. */
  onDelete: () => void;
}

/**
 * Wraps a card row with horizontal swipe actions: swipe right reveals and fires
 * Edit, swipe left reveals and fires Delete. A short horizontal activation
 * offset lets plain taps pass through to the row beneath.
 */
export function SwipeableCardRow({ children, onEdit, onDelete }: SwipeableCardRowProps) {
  const theme = useTheme();
  const tx = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > TRIGGER) runOnJS(onEdit)();
      else if (e.translationX < -TRIGGER) runOnJS(onDelete)();
      tx.value = withSpring(0, { damping: 18, stiffness: 180 });
    });

  const foreground = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const editStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, REVEAL], [0, 1], Extrapolation.CLAMP),
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-REVEAL, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.action, styles.left, { backgroundColor: theme.brandSoft }, editStyle]}>
        <Icon name="pencil" size={20} color={theme.brandContrast} />
        <ThemedText type="xs" style={{ color: theme.brandContrast }}>
          Edit
        </ThemedText>
      </Animated.View>
      <Animated.View
        style={[styles.action, styles.right, { backgroundColor: theme.dangerSoft }, deleteStyle]}>
        <Icon name="trash" size={20} color={theme.dangerOn} />
        <ThemedText type="xs" style={{ color: theme.dangerOn }}>
          Delete
        </ThemedText>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={foreground}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, overflow: 'hidden' },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
  },
  left: { left: 0 },
  right: { right: 0 },
});
