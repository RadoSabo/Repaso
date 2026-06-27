import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSettings, type ThemePreference } from '@/store/settings';

const THEME_OPTIONS: readonly Segment<ThemePreference>[] = [
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
          <SegmentedControl
            segments={THEME_OPTIONS}
            value={s.themePreference}
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

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.five },
  section: { gap: Spacing.two },
  sectionBody: { gap: Spacing.three, marginTop: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
});
