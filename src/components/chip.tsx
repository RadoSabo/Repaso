import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipProps {
  children: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: IconName;
}

/** A selectable token — topic suggestions, quick fills. */
export function Chip({ children, onPress, selected = false, icon }: ChipProps) {
  const theme = useTheme();
  const fg = selected ? theme.brandOn : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? theme.brand : theme.surfaceSunk,
          borderColor: selected ? theme.brand : 'transparent',
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}>
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <ThemedText type="smBold" style={{ color: fg }} numberOfLines={1}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    height: 36,
    paddingHorizontal: Spacing.lg - 2,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
});
