import { Text, type TextProps } from 'react-native';

import { type TextRole, type ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /** A typographic role from the design system. Defaults to `body`. */
  type?: TextRole;
  /** A palette color key. Defaults to `text` (or `textMuted` for `overline`). */
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const defaultColor: ThemeColor = type === 'overline' ? 'textMuted' : 'text';

  return (
    <Text style={[{ color: theme[themeColor ?? defaultColor] }, Typography[type], style]} {...rest} />
  );
}
