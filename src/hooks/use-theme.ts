/**
 * Resolves the active color palette from the user's theme preference,
 * falling back to the system color scheme when set to "system".
 * Learn more: https://docs.expo.dev/guides/color-schemes/
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, makeShadows, type Palette, type Shadows } from '@/constants/theme';
import { useSettings } from '@/store/settings';

export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const preference = useSettings((s) => s.themePreference);

  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Palette {
  return Colors[useResolvedScheme()];
}

/** Scheme-aware elevation tokens (brand-tinted shadows track the active brand). */
export function useShadows(): Shadows {
  const scheme = useResolvedScheme();
  return useMemo(() => makeShadows(Colors[scheme], scheme), [scheme]);
}
