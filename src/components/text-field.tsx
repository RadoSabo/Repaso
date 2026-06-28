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
          { backgroundColor: theme.surfaceSunk, borderColor },
          multiline ? styles.wellMultiline : styles.wellSingle,
          focused && { shadowColor: ringColor, ...styles.ring },
        ]}>
        {prefixIcon ? (
          <Icon name={prefixIcon} size={19} color={theme.textMuted} style={styles.prefix} />
        ) : null}
        <TextInput
          placeholderTextColor={theme.textMuted}
          multiline={multiline}
          style={[styles.input, { color: theme.text }, multiline ? styles.inputMultiline : styles.inputSingle, style]}
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
  wellSingle: { alignItems: 'center' },
  wellMultiline: { alignItems: 'flex-start' },
  ring: { shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  prefix: { alignSelf: 'center' },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  // The input owns the full height so the whole well is a tap target.
  inputSingle: { height: 52, paddingVertical: 0 },
  inputMultiline: {
    minHeight: 96,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
    lineHeight: 23,
  },
  helper: { marginTop: Spacing.xs + 2 },
});
