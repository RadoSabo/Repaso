import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

const TRACK_PADDING = Spacing.xs;

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

export interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

/**
 * A themed tab-style toggle. Presentational + controlled: the parent owns the
 * selected value. The active segment lifts onto a `surface` chip with a soft
 * shadow.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const shadows = useShadows();
  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceSunk }, style]}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="button"
            accessibilityLabel={segment.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.surface, ...shadows.sm },
            ]}>
            {segment.icon ? (
              <Icon
                name={segment.icon}
                size={16}
                color={selected ? theme.text : theme.textMuted}
              />
            ) : null}
            <ThemedText
              type="smBold"
              themeColor={selected ? 'text' : 'textMuted'}
              numberOfLines={1}>
              {segment.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
    borderRadius: Radius.md,
    gap: TRACK_PADDING,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    height: 42,
    borderRadius: Radius.sm,
  },
});
