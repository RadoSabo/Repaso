/**
 * Repaso design system — tokens.
 *
 * Translated from the Repaso web design system into React Native primitives.
 * Brand direction: "Sunset" (warm orange). Two schemes: light + dark.
 *
 * Components never hard-code px or hex; they read from `Spacing`, `Radius`,
 * `Typography`, `Shadows`, and the active palette via `useTheme()`.
 */

import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Color — semantic palette per scheme
// ---------------------------------------------------------------------------

const light = {
    // surfaces
    bg: '#F4F8F7',
    surface: '#FFFFFF',
    surfaceSunk: '#ECF2F0',
    surfaceRaised: '#FFFFFF',

    // text / ink
    text: '#151D1B',
    textSecondary: '#4D5955',
    textMuted: '#697672',
    textFaint: '#8E9C98',
    textOnBrand: '#FFFFFF',

    // borders & lines
    border: '#D0D9D6',
    borderStrong: '#B4C0BC',
    borderSubtle: '#E2E9E7',

    // brand (sunset orange)
    brand: '#EA6212',
    brandStrong: '#C9500B',
    brandPress: '#9E3D08',
    brandSoft: '#FFE3D2',
    brandSofter: '#FFF3EC',
    brandOn: '#FFFFFF',
    brandContrast: '#9E3D08',

    // accent (honey amber — rewards, "upgrade")
    accent: '#F2C463',
    accentStrong: '#E0A92E',
    accentSoft: '#FBEFD0',
    accentOn: '#C28A12',

    // success (mint — "I knew it", done)
    success: '#18B981',
    successSoft: '#D2F4E4',
    successOn: '#0E9D6C',

    // info (sky — tips, links)
    info: '#2B8CF0',
    infoSoft: '#DCEEFF',
    infoOn: '#1C72CC',

    // danger (rose — destructive, "I didn't know")
    danger: '#F4524E',
    dangerStrong: '#D63A38',
    dangerSoft: '#FFE0E0',
    dangerOn: '#D63A38',

    // controls
    switchTrackOff: '#B4C0BC',
};

export type Palette = typeof light;

const dark: Palette = {
    bg: '#111614',
    surface: '#1B211F',
    surfaceSunk: '#161B19',
    surfaceRaised: '#232B28',

    text: '#F2F8F4',
    textSecondary: '#AEBAB3',
    textMuted: '#8A968F',
    textFaint: '#647069',
    textOnBrand: '#FFFFFF',

    border: '#2B332F',
    borderStrong: '#38423D',
    borderSubtle: '#202724',

    brand: '#FB7E38',
    brandStrong: '#EA6212',
    brandPress: '#C9500B',
    brandSoft: '#3A2410',
    brandSofter: '#241608',
    brandOn: '#1B211F',
    brandContrast: '#FFA46E',

    accent: '#F2C463',
    accentStrong: '#E0A92E',
    accentSoft: '#332814',
    accentOn: '#F2C463',

    success: '#34D399',
    successSoft: '#133227',
    successOn: '#34D399',

    info: '#4FA9FF',
    infoSoft: '#14293F',
    infoOn: '#6FB4FF',

    danger: '#FF7A7A',
    dangerStrong: '#FF7A7A',
    dangerSoft: '#3A1D1D',
    dangerOn: '#FF9B9B',

    switchTrackOff: '#434E49',
};

export const Colors = { light, dark };

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof Palette;

/** The one tasteful gradient: the AI "Generate" magic action. Same in both schemes. */
export const SparkGradient = ['#FB7E38', '#EA6212', '#C9500B'] as const;
/** Soft brand wash used behind hero areas. */
export const HeroGradient = ['#FB7E38', '#EA6212', '#C9500B'] as const;

// ---------------------------------------------------------------------------
// Typography — Fredoka (display) · Nunito (body/UI) · DM Mono (numeric)
// ---------------------------------------------------------------------------

/** Font-family keys. These match the names registered with `useFonts` in _layout. */
export const FontFamily = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  displayBold: 'Fredoka_700Bold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemibold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtrabold: 'Nunito_800ExtraBold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

export type TextRole =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodyBold'
  | 'sm'
  | 'smBold'
  | 'xs'
  | 'overline'
  | 'mono';

export const Typography: Record<TextRole, TextStyle> = {
  display: { fontFamily: FontFamily.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  h1: { fontFamily: FontFamily.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: FontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: FontFamily.displayMedium, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: FontFamily.bodyMedium, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: FontFamily.body, fontSize: 16, lineHeight: 23 },
  bodyBold: { fontFamily: FontFamily.bodyBold, fontSize: 16, lineHeight: 23 },
  sm: { fontFamily: FontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  smBold: { fontFamily: FontFamily.bodyBold, fontSize: 14, lineHeight: 20 },
  xs: { fontFamily: FontFamily.bodySemibold, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  mono: { fontFamily: FontFamily.mono, fontSize: 13, lineHeight: 18 },
};

// ---------------------------------------------------------------------------
// Spacing — 4px base grid
// ---------------------------------------------------------------------------

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  /** Standard horizontal screen gutter. */
  gutter: 20,
} as const;

// ---------------------------------------------------------------------------
// Radius — generous, friendly rounding
// ---------------------------------------------------------------------------

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  pill: 999,
} as const;

// ---------------------------------------------------------------------------
// Motion — friendly with a touch of bounce
// ---------------------------------------------------------------------------

export const Motion = {
  fast: 120,
  base: 200,
  slow: 320,
  flip: 460,
  pressScale: 0.96,
} as const;

// ---------------------------------------------------------------------------
// Elevation — soft, low, diffuse shadows. Brand-tinted lift under spark/brand.
// ---------------------------------------------------------------------------

function shadow(
  color: string,
  opacity: number,
  radius: number,
  offsetY: number,
  elevation: number,
): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation,
  };
}

const INK = '#4A4236';

/** Scheme-aware elevation. Brand-tinted shadows use the active brand color. */
export function makeShadows(palette: Palette) {
  // Diffuse neutral shadows read as muddy on dark surfaces; soften there.
  const isDark = palette === Colors.dark;
  const inkOpacity = (lightVal: number, darkVal: number) => (isDark ? darkVal : lightVal);
  return {
    sm: shadow(INK, inkOpacity(0.1, 0.3), 3, 1, 1),
    card: shadow(INK, inkOpacity(0.1, 0.35), 16, 8, 3),
    raised: shadow(INK, inkOpacity(0.14, 0.45), 28, 12, 6),
    brand: shadow(palette.brand, 0.3, 14, 6, 4),
    spark: shadow(palette.brand, 0.32, 18, 8, 5),
  } satisfies Record<string, ViewStyle>;
}

export type Shadows = ReturnType<typeof makeShadows>;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
