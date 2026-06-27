import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 20;
const LOCK_SIZE = 12;

export interface InputMethodButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
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
 * A pill button for an alternative input method (record audio, add a photo) that
 * fills the generation field. Shows busy/active/locked states.
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
  const fg = active ? theme.tintText : theme.text;

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
          backgroundColor: active ? theme.tint : theme.backgroundElement,
          borderColor: theme.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <MaterialIcons name={icon} size={ICON_SIZE} color={fg} />
      )}
      <ThemedText type="smallBold" numberOfLines={1} style={{ color: fg }}>
        {label}
      </ThemedText>
      {locked ? (
        <View style={[styles.lock, { backgroundColor: theme.text }]}>
          <MaterialIcons name="lock" size={LOCK_SIZE} color={theme.background} />
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
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lock: {
    position: 'absolute',
    top: -LOCK_SIZE / 2,
    right: -LOCK_SIZE / 2,
    width: LOCK_SIZE + Spacing.one,
    height: LOCK_SIZE + Spacing.one,
    borderRadius: (LOCK_SIZE + Spacing.one) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
