import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, SparkGradient, Spacing } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'spark';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to fill the available width. */
  block?: boolean;
  loading?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  style?: ViewStyle;
};

const SIZES: Record<ButtonSize, { height: number; padding: number; icon: number; radius: number }> = {
  sm: { height: 38, padding: Spacing.lg, icon: 16, radius: Radius.md },
  md: { height: 50, padding: 22, icon: 19, radius: Radius.md },
  lg: { height: 58, padding: Spacing.xxl, icon: 21, radius: Radius.lg },
};

/**
 * The Repaso button. `spark` is the AI-generate magic action — a warm gradient
 * fill with brand-tinted lift; every other variant is a flat themed surface.
 * Press gives a gentle shrink via opacity (Pressable feedback).
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled,
  leadingIcon,
  trailingIcon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const shadows = useShadows();
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  const bg: Record<ButtonVariant, string> = {
    primary: theme.brand,
    secondary: theme.brandSoft,
    ghost: 'transparent',
    danger: theme.dangerSoft,
    spark: 'transparent',
  };
  const fg: Record<ButtonVariant, string> = {
    primary: theme.brandOn,
    secondary: theme.brandContrast,
    ghost: theme.brandContrast,
    danger: theme.dangerStrong,
    spark: '#FFFFFF',
  };
  const lift =
    variant === 'spark' ? shadows.spark : variant === 'primary' ? shadows.brand : undefined;

  const color = fg[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.padding,
          borderRadius: s.radius,
          backgroundColor: bg[variant],
          width: block ? '100%' : undefined,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
        !isDisabled && lift,
        style,
      ]}
      {...rest}>
      {variant === 'spark' ? (
        <LinearGradient
          colors={SparkGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: s.radius }]}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? <Icon name={leadingIcon} size={s.icon} color={color} /> : null}
          <ThemedText type="smBold" numberOfLines={1} style={{ color, fontSize: size === 'lg' ? 17 : 15 }}>
            {title}
          </ThemedText>
          {trailingIcon ? <Icon name={trailingIcon} size={s.icon} color={color} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: '100%',
  },
});
