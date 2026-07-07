import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { SparkGradient } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

/** Corner radius as a fraction of the mark's size (squircle-like rounding). */
const RADIUS_RATIO = 0.3;
/** Glyph size as a fraction of the mark's size. */
const GLYPH_RATIO = 0.56;

export interface BrandMarkProps {
  size?: number;
}

/** The Repaso glyph — a gradient rounded square with the cards mark. */
export function BrandMark({ size = 38 }: BrandMarkProps) {
  const theme = useTheme();
  const shadows = useShadows();
  return (
    <LinearGradient
      colors={SparkGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * RADIUS_RATIO },
        shadows.brand,
      ]}>
      <Icon name="cards" size={size * GLYPH_RATIO} color={theme.textOnBrand} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
});
