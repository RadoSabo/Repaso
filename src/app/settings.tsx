import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useTheme } from '@/hooks/use-theme';
import { DeckTransferError, exportDecks, importDecks } from '@/lib/deck-transfer';
import { useSettings, type ThemePreference } from '@/store/settings';

const THEME_OPTIONS: readonly Segment<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const s = useSettings();
  const router = useRouter();
  const { isPro } = useEntitlement();
  const [transferBusy, setTransferBusy] = useState(false);

  async function handleExport() {
    setTransferBusy(true);
    try {
      await exportDecks();
    } catch (e) {
      Alert.alert('Export failed', e instanceof DeckTransferError ? e.message : 'Something went wrong.');
    } finally {
      setTransferBusy(false);
    }
  }

  async function handleImport() {
    setTransferBusy(true);
    try {
      const count = await importDecks();
      if (count > 0) {
        Alert.alert('Import complete', `Added ${count} ${count === 1 ? 'deck' : 'decks'}.`);
      }
    } catch (e) {
      Alert.alert('Import failed', e instanceof DeckTransferError ? e.message : 'Something went wrong.');
    } finally {
      setTransferBusy(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Repaso Pro">
          <Card padding="none">
            <SettingRow
              icon="crown"
              title="Repaso Pro"
              sub={isPro ? 'Unlimited AI-generated decks' : 'Unlock unlimited AI generations'}
              onPress={isPro ? undefined : () => router.push('/paywall')}
              trailing={
                isPro ? (
                  <Badge tone="success" icon="check">
                    Active
                  </Badge>
                ) : (
                  <Badge tone="warning">Upgrade</Badge>
                )
              }
            />
          </Card>
        </Section>

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
            <TextField containerStyle={styles.flex} label="I know" value={s.knownLang} onChangeText={s.setKnownLang} />
            <TextField
              containerStyle={styles.flex}
              label="I'm learning"
              value={s.targetLang}
              onChangeText={s.setTargetLang}
            />
          </View>
        </Section>

        <Section
          title="Your data"
          subtitle="Decks live only on this device. Export a backup you can import on a new device — a reinstall loses them otherwise.">
          <Button
            title="Export decks"
            variant="secondary"
            block
            leadingIcon="download"
            loading={transferBusy}
            onPress={handleExport}
          />
          <Button
            title="Import decks"
            variant="secondary"
            block
            leadingIcon="upload"
            disabled={transferBusy}
            onPress={handleImport}
          />
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
      <ThemedText type="overline">{title}</ThemedText>
      {subtitle ? (
        <ThemedText type="sm" themeColor="textMuted">
          {subtitle}
        </ThemedText>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  sub,
  trailing,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: theme.surfaceSunk }]}>
        <Icon name={icon} size={19} color={theme.textSecondary} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="bodyBold">{title}</ThemedText>
        {sub ? (
          <ThemedText type="sm" themeColor="textMuted">
            {sub}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.xxl },
  section: { gap: Spacing.sm },
  sectionBody: { gap: Spacing.md, marginTop: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md + 2,
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
