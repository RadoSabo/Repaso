import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FADE_HEIGHT = 28;

export interface BottomBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A sticky bottom action area. Sits below a scroll view; a short gradient fade
 * lets scrolled content dissolve into the background above the actions, and the
 * bar pads itself past the home indicator with the safe-area inset.
 */
export function BottomBar({ children, style }: BottomBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.bg, paddingBottom: insets.bottom + Spacing.sm },
        style,
      ]}>
      <LinearGradient
        colors={['transparent', theme.bg]}
        style={styles.fade}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -FADE_HEIGHT,
    height: FADE_HEIGHT,
  },
});
