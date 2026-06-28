import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Repaso icon set. The design system is specified with Phosphor glyph names;
 * the app maps each to its closest match in the already-bundled
 * `@expo/vector-icons` (rounded Ionicons, with MaterialCommunityIcons for the
 * glyphs Ionicons lacks). Screens reference the semantic Phosphor-style name so
 * the mapping lives in exactly one place.
 */
export type IconName =
  | 'sparkle'
  | 'crown'
  | 'plus'
  | 'check'
  | 'check-circle'
  | 'arrow-right'
  | 'arrow-left'
  | 'caret-right'
  | 'caret-down'
  | 'play'
  | 'gear'
  | 'calendar-check'
  | 'cards'
  | 'microphone'
  | 'stop'
  | 'camera'
  | 'trash'
  | 'pencil'
  | 'x'
  | 'lightbulb'
  | 'lock'
  | 'lock-open'
  | 'shield-check'
  | 'infinity'
  | 'confetti'
  | 'hand-tap'
  | 'swipe'
  | 'refresh'
  | 'chat'
  | 'text'
  | 'translate'
  | 'moon'
  | 'download'
  | 'upload';

type Glyph =
  | { set: 'ion'; name: keyof typeof Ionicons.glyphMap }
  | { set: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

const GLYPHS: Record<IconName, Glyph> = {
  sparkle: { set: 'ion', name: 'sparkles' },
  crown: { set: 'mci', name: 'crown' },
  plus: { set: 'ion', name: 'add' },
  check: { set: 'ion', name: 'checkmark' },
  'check-circle': { set: 'ion', name: 'checkmark-circle' },
  'arrow-right': { set: 'ion', name: 'arrow-forward' },
  'arrow-left': { set: 'ion', name: 'arrow-back' },
  'caret-right': { set: 'ion', name: 'chevron-forward' },
  'caret-down': { set: 'ion', name: 'chevron-down' },
  play: { set: 'ion', name: 'play' },
  gear: { set: 'ion', name: 'settings-sharp' },
  'calendar-check': { set: 'mci', name: 'calendar-check' },
  cards: { set: 'mci', name: 'cards' },
  microphone: { set: 'ion', name: 'mic' },
  stop: { set: 'ion', name: 'stop' },
  camera: { set: 'ion', name: 'camera' },
  trash: { set: 'ion', name: 'trash' },
  pencil: { set: 'ion', name: 'pencil' },
  x: { set: 'ion', name: 'close' },
  lightbulb: { set: 'ion', name: 'bulb' },
  lock: { set: 'ion', name: 'lock-closed' },
  'lock-open': { set: 'ion', name: 'lock-open' },
  'shield-check': { set: 'ion', name: 'shield-checkmark' },
  infinity: { set: 'mci', name: 'infinity' },
  confetti: { set: 'mci', name: 'party-popper' },
  'hand-tap': { set: 'mci', name: 'gesture-tap' },
  swipe: { set: 'mci', name: 'gesture-swipe-horizontal' },
  refresh: { set: 'ion', name: 'refresh' },
  chat: { set: 'ion', name: 'chatbubble' },
  text: { set: 'mci', name: 'format-letter-case' },
  translate: { set: 'mci', name: 'translate' },
  moon: { set: 'ion', name: 'moon' },
  download: { set: 'ion', name: 'download-outline' },
  upload: { set: 'ion', name: 'cloud-upload-outline' },
};

export interface IconProps {
  name: IconName;
  size?: number;
  /** A palette color key, or a literal color string. Defaults to current text. */
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 20, color, style }: IconProps) {
  const theme = useTheme();
  const tint = color ?? theme.text;
  const glyph = GLYPHS[name];
  if (glyph.set === 'mci') {
    return <MaterialCommunityIcons name={glyph.name} size={size} color={tint} style={style} />;
  }
  return <Ionicons name={glyph.name} size={size} color={tint} style={style} />;
}
