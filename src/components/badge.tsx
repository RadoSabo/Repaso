import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';

export interface BadgeProps {
  children: string;
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const TONES: Record<BadgeTone, { bg: ThemeColor; fg: ThemeColor }> = {
  neutral: { bg: 'surfaceSunk', fg: 'textSecondary' },
  brand: { bg: 'brandSoft', fg: 'brandContrast' },
  success: { bg: 'successSoft', fg: 'successOn' },
  info: { bg: 'infoSoft', fg: 'infoOn' },
  warning: { bg: 'accentSoft', fg: 'accentOn' },
  danger: { bg: 'dangerSoft', fg: 'dangerOn' },
};

/** A small status pill — card counts, "Due", "Done", plan savings. */
export function Badge({ children, tone = 'neutral', icon, size = 'md', style }: BadgeProps) {
  const theme = useTheme();
  const t = TONES[tone];
  const fg = theme[t.fg];
  const dims = size === 'sm' ? { padX: Spacing.sm, padY: 2, icon: 12 } : { padX: 11, padY: 4, icon: 13 };

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: theme[t.bg], paddingHorizontal: dims.padX, paddingVertical: dims.padY },
        style,
      ]}>
      {icon ? <Icon name={icon} size={dims.icon} color={fg} /> : null}
      <ThemedText type="xs" style={{ color: fg }} numberOfLines={1}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
});
