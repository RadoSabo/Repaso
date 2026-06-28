import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 19;
const LOCK_SIZE = 13;

export interface InputMethodButtonProps {
  icon: IconName;
  /** Visible + accessibility label (or the live caption, e.g. a timer). */
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  /** Show a spinner instead of the icon (work in progress). */
  busy?: boolean;
  /** Highlight as the active/recording state. */
  active?: boolean;
  /** Show a small lock badge — the feature is Pro-only and currently locked. */
  locked?: boolean;
  disabled?: boolean;
}

/**
 * A secondary-style button for an alternative input method (record audio, add a
 * photo) that fills the generation field. Shows busy/active/locked states.
 */
export function InputMethodButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
  busy = false,
  active = false,
  locked = false,
  disabled = false,
}: InputMethodButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || busy;
  const fg = active ? theme.brandOn : theme.brandContrast;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: active ? theme.brand : theme.brandSoft,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
      ]}>
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Icon name={icon} size={ICON_SIZE} color={fg} />
      )}
      <ThemedText type="smBold" numberOfLines={1} style={{ color: fg, fontSize: 15 }}>
        {label}
      </ThemedText>
      {locked ? (
        <View style={[styles.lock, { backgroundColor: theme.text }]}>
          <Icon name="lock" size={LOCK_SIZE - 3} color={theme.surface} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 50,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  lock: {
    position: 'absolute',
    top: -LOCK_SIZE / 2,
    right: -LOCK_SIZE / 2,
    width: LOCK_SIZE + Spacing.xs,
    height: LOCK_SIZE + Spacing.xs,
    borderRadius: (LOCK_SIZE + Spacing.xs) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
