import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { Radius, SparkGradient } from '@/constants/theme';
import { useShadows } from '@/hooks/use-theme';

export interface BrandMarkProps {
  size?: number;
}

/** The Repaso glyph — a gradient rounded square with the cards mark. */
export function BrandMark({ size = 38 }: BrandMarkProps) {
  const shadows = useShadows();
  return (
    <LinearGradient
      colors={SparkGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.3 },
        shadows.brand,
      ]}>
      <Icon name="cards" size={size * 0.56} color="#FFFFFF" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
});
