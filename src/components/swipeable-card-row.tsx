import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
/** Drag distance over which an action background fades fully in. */
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
 * Edit, swipe left reveals and fires Delete. The full row behind the card takes
 * the action color (brand / danger) so the affordance reads clearly. A short
 * horizontal activation offset lets plain taps pass through to the row beneath.
 */
export function SwipeableCardRow({ children, onEdit, onDelete }: SwipeableCardRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
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
        style={[styles.bg, styles.bgEdit, { backgroundColor: theme.brandSoft }, editStyle]}>
        <Icon name="pencil" size={20} color={theme.brandContrast} />
        <ThemedText type="xs" style={{ color: theme.brandContrast }}>
          {t('common.edit')}
        </ThemedText>
      </Animated.View>
      <Animated.View
        style={[styles.bg, styles.bgDelete, { backgroundColor: theme.dangerSoft }, deleteStyle]}>
        <Icon name="trash" size={20} color={theme.dangerOn} />
        <ThemedText type="xs" style={{ color: theme.dangerOn }}>
          {t('common.delete')}
        </ThemedText>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={foreground}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  // No `overflow: hidden` so a card's shadow isn't clipped; the backgrounds
  // carry their own radius to match the rounded card on top.
  wrap: { borderRadius: Radius.lg },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  bgEdit: { justifyContent: 'flex-start', paddingLeft: Spacing.lg },
  bgDelete: { justifyContent: 'flex-end', paddingRight: Spacing.lg },
});
