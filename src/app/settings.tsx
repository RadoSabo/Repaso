import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings, type ThemePreference } from '@/store/settings';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const s = useSettings();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Appearance">
          <Segmented
            value={s.themePreference}
            options={THEME_OPTIONS}
            onChange={s.setThemePreference}
          />
        </Section>

        <Section
          title="Default languages"
          subtitle="Used when creating new decks and generating cards.">
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label="I know" value={s.knownLang} onChangeText={s.setKnownLang} />
            </View>
            <View style={styles.flex}>
              <TextField label="I'm learning" value={s.targetLang} onChangeText={s.setTargetLang} />
            </View>
          </View>
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <ThemedText
            key={opt.value}
            type="smallBold"
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              active && { backgroundColor: theme.tint },
              { color: active ? theme.tintText : theme.text },
            ]}>
            {opt.label}
          </ThemedText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.five },
  section: { gap: Spacing.two },
  sectionBody: { gap: Spacing.three, marginTop: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
  segmented: { flexDirection: 'row', borderRadius: Spacing.three, padding: Spacing.half },
  segment: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
});
