import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string;
  prefixIcon?: IconName;
  containerStyle?: ViewStyle;
};

/**
 * A labelled text field over a sunk well. Focus lifts the border to brand and
 * shows a soft ring; `error` swaps both to danger and surfaces a message.
 */
export function TextField({
  label,
  helper,
  error,
  prefixIcon,
  style,
  containerStyle,
  multiline,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.brand : theme.border;
  const ringColor = error ? theme.dangerSoft : theme.brandSoft;

  return (
    <View style={containerStyle}>
      {label ? (
        <ThemedText type="smBold" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <View
        style={[
          styles.well,
          {
            backgroundColor: theme.surfaceSunk,
            borderColor,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? Spacing.md : 0,
            minHeight: multiline ? undefined : 52,
          },
          focused && { borderColor, shadowColor: ringColor, ...styles.ring },
        ]}>
        {prefixIcon ? (
          <Icon name={prefixIcon} size={19} color={theme.textMuted} style={styles.prefix} />
        ) : null}
        <TextInput
          placeholderTextColor={theme.textMuted}
          multiline={multiline}
          style={[styles.input, { color: theme.text }, multiline && styles.multiline, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </View>

      {error || helper ? (
        <ThemedText type="sm" themeColor={error ? 'danger' : 'textMuted'} style={styles.helper}>
          {error ?? helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.sm },
  well: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  ring: { shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  prefix: { marginTop: 0 },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 16,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 23,
  },
  helper: { marginTop: Spacing.xs + 2 },
});
