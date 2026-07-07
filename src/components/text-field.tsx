import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

/**
 * A labelled text field over a sunk well. The border (and background) live
 * directly on the TextInput so the whole control is a reliable tap target;
 * focus lifts the border to brand and `error` swaps it to danger.
 */
export function TextField({
  label,
  helper,
  error,
  style,
  containerStyle,
  multiline,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.brand : theme.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <ThemedText type="smBold" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}

      <TextInput
        placeholderTextColor={theme.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.surfaceSunk, borderColor },
          multiline ? styles.multiline : styles.single,
          style,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />

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
  input: {
    ...Typography.body,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  single: { height: 52 },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  helper: { marginTop: Spacing.xsPlus },
});
