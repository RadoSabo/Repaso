import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'brand' | 'success' | 'accent';
  height?: number;
  /** Optional track color override (e.g. translucent white on a gradient). */
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
}

const FILLS: Record<NonNullable<ProgressBarProps['tone']>, ThemeColor> = {
  brand: 'brand',
  success: 'success',
  accent: 'accentStrong',
};

/** A rounded progress track — review progress, daily goal. */
export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  height = 10,
  trackColor,
  fillColor,
  style,
}: ProgressBarProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: Radius.pill, backgroundColor: trackColor ?? theme.surfaceSunk },
        style,
      ]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: Radius.pill,
          backgroundColor: fillColor ?? theme[FILLS[tone]],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
