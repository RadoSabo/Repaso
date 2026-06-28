import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Radius } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

export type IconButtonVariant = 'plain' | 'soft' | 'solid' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Pill (circle) when true, rounded square otherwise. */
  round?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const DIMS: Record<IconButtonSize, number> = { sm: 38, md: 44, lg: 52 };
const GLYPH: Record<IconButtonSize, number> = { sm: 18, md: 21, lg: 24 };

/** A square/round tappable icon with a 44px min hit target. */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  size = 'md',
  round = true,
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const shadows = useShadows();
  const dim = DIMS[size];

  const bg: Record<IconButtonVariant, string> = {
    plain: 'transparent',
    soft: theme.surfaceSunk,
    solid: theme.brand,
    danger: theme.dangerSoft,
  };
  const fg: Record<IconButtonVariant, string> = {
    plain: theme.textSecondary,
    soft: theme.text,
    solid: theme.brandOn,
    danger: theme.dangerStrong,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: round ? Radius.pill : Radius.md,
          backgroundColor: bg[variant],
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
        variant === 'solid' && !disabled && shadows.brand,
        style,
      ]}>
      <Icon name={icon} size={GLYPH[size]} color={fg[variant]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
