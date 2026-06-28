import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

export type CardVariant = 'default' | 'sunk' | 'outline' | 'brand';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  /** Renders as a Pressable with press feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const PADS: Record<CardPadding, number> = {
  none: 0,
  sm: Spacing.lg,
  md: Spacing.xl,
  lg: Spacing.xxl,
};

/** The soft, rounded surface used everywhere — deck rows, generated cards, groups. */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const theme = useTheme();
  const shadows = useShadows();

  const variants: Record<CardVariant, ViewStyle> = {
    default: { backgroundColor: theme.surface, borderColor: theme.borderSubtle, ...shadows.card },
    sunk: { backgroundColor: theme.surfaceSunk, borderColor: theme.borderSubtle },
    outline: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1.5 },
    brand: { backgroundColor: theme.brandSofter, borderColor: theme.brandSoft },
  };

  const base: StyleProp<ViewStyle> = [
    styles.base,
    { padding: PADS[padding] },
    variants[variant],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.lg, borderWidth: 1 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
