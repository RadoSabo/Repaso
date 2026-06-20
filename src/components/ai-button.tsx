import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Box mirrors the standard Button exactly so the two size identically in a row. */
const HEIGHT = 48;
const RADIUS = Spacing.three;
const ICON_SIZE = 18;
/** Static AI-brand gradient fill (top-left → bottom-right). */
const AI_GRADIENT = ['#7C3AED', '#6366F1', '#2563EB'] as const;
/** The travelling shine. */
const SHINE_COLORS = ['transparent', 'rgba(255,255,255,0.5)', 'transparent'] as const;
const SHINE_WIDTH = 90;
const SHINE_SKEW = '-18deg';
/** One full cycle: a quick sweep, then a pause before the next. */
const SHINE_CYCLE_MS = 2800;
/** Fraction of the cycle spent sweeping; the rest is the gap between sweeps. */
const SHINE_SWEEP_FRACTION = 0.4;

export type AIButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  loading?: boolean;
  style?: ViewStyle;
};

/**
 * The hero call-to-action for AI generation. A single Pressable — same box as
 * the standard Button, so it sizes identically beside one — filled with a vivid
 * AI-brand gradient and crossed by a light "shine" that sweeps over it on a
 * loop. Deliberately outweighs neighbouring secondary buttons so the generator
 * reads as the primary, desirable action.
 */
export function AIButton({ title, loading = false, disabled, style, ...rest }: AIButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const [width, setWidth] = useState(0);

  // Loops 0 → 1 forever, started once at mount (no effect, no render-time reads).
  const progress = useDerivedValue(() =>
    withRepeat(withTiming(1, { duration: SHINE_CYCLE_MS, easing: Easing.linear }), -1, false),
  );

  // Sweep the band from off the left edge to off the right edge, then hold it
  // off-screen for the remainder of the cycle (the pause between shines).
  const shineStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, SHINE_SWEEP_FRACTION, 1],
            [-SHINE_WIDTH, width, width],
          ),
        },
        { skewX: SHINE_SKEW },
      ],
    }),
    [width],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={({ pressed }) => [
        styles.base,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}>
      <LinearGradient
        colors={AI_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {!isDisabled && width > 0 ? (
        <Animated.View style={[styles.shine, shineStyle]}>
          <LinearGradient
            colors={SHINE_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={theme.tintText} />
      ) : (
        <View style={styles.content}>
          <MaterialIcons name="auto-awesome" size={ICON_SIZE} color={theme.tintText} />
          <ThemedText
            type="smallBold"
            numberOfLines={1}
            style={[styles.label, { color: theme.tintText }]}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HEIGHT,
    paddingHorizontal: Spacing.four,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9 },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SHINE_WIDTH,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: '100%',
  },
  label: { letterSpacing: 0.3, flexShrink: 1 },
});
