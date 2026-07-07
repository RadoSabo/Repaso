import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { LanguageSelect } from '@/components/language-select';
import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useTheme } from '@/hooks/use-theme';
import { DeckTransferError, exportDecks, importDecks } from '@/lib/deck-transfer';
import { useSettings, type ThemePreference } from '@/store/settings';

/** Slightly wider than Spacing.md so the icon tile doesn't crowd the text. */
const SETTING_ROW_GAP = 14;

export default function SettingsScreen() {
  const themePreference = useSettings((s) => s.themePreference);
  const setThemePreference = useSettings((s) => s.setThemePreference);
  const languagePreference = useSettings((s) => s.languagePreference);
  const setLanguagePreference = useSettings((s) => s.setLanguagePreference);
  const knownLang = useSettings((s) => s.knownLang);
  const setKnownLang = useSettings((s) => s.setKnownLang);
  const targetLang = useSettings((s) => s.targetLang);
  const setTargetLang = useSettings((s) => s.setTargetLang);
  const router = useRouter();
  const { t } = useTranslation();
  const { isPro } = useEntitlement();
  const [transferBusy, setTransferBusy] = useState(false);

  const themeOptions: readonly Segment<ThemePreference>[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  async function handleExport() {
    setTransferBusy(true);
    try {
      await exportDecks();
    } catch (e) {
      Alert.alert(
        t('settings.exportFailed'),
        e instanceof DeckTransferError ? e.message : t('common.somethingWrong'),
      );
    } finally {
      setTransferBusy(false);
    }
  }

  async function handleImport() {
    setTransferBusy(true);
    try {
      const count = await importDecks();
      if (count > 0) {
        Alert.alert(t('settings.importComplete'), t('settings.importedDecks', { count }));
      }
    } catch (e) {
      Alert.alert(
        t('settings.importFailed'),
        e instanceof DeckTransferError ? e.message : t('common.somethingWrong'),
      );
    } finally {
      setTransferBusy(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title={t('settings.proSection')}>
          <Card padding="none">
            <SettingRow
              icon="crown"
              title={t('settings.proSection')}
              sub={isPro ? t('settings.proActiveSub') : t('settings.proInactiveSub')}
              onPress={isPro ? undefined : () => router.push('/paywall')}
              trailing={
                isPro ? (
                  <Badge tone="success" icon="check">
                    {t('settings.active')}
                  </Badge>
                ) : (
                  <Badge tone="warning">{t('settings.upgrade')}</Badge>
                )
              }
            />
          </Card>
        </Section>

        <Section title={t('settings.appearance')}>
          <SegmentedControl
            segments={themeOptions}
            value={themePreference}
            onChange={setThemePreference}
          />
        </Section>

        <Section title={t('settings.language')}>
          <LanguageSelect value={languagePreference} onChange={setLanguagePreference} />
        </Section>

        <Section
          title={t('settings.defaultLanguages')}
          subtitle={t('settings.defaultLanguagesSub')}>
          <View style={styles.row}>
            <TextField containerStyle={styles.flex} label={t('common.iKnow')} value={knownLang} onChangeText={setKnownLang} />
            <TextField
              containerStyle={styles.flex}
              label={t('common.imLearning')}
              value={targetLang}
              onChangeText={setTargetLang}
            />
          </View>
        </Section>

        <Section title={t('settings.yourData')} subtitle={t('settings.yourDataSub')}>
          <Button
            title={t('settings.exportDecks')}
            variant="secondary"
            block
            leadingIcon="download"
            loading={transferBusy}
            onPress={handleExport}
          />
          <Button
            title={t('settings.importDecks')}
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
    gap: SETTING_ROW_GAP,
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
