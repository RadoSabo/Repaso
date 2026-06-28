import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { DeckTransferError, exportDecks, importDecks } from '@/lib/deck-transfer';
import { useSettings, type LanguagePreference, type ThemePreference } from '@/store/settings';

export default function SettingsScreen() {
  const s = useSettings();
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
            value={s.themePreference}
            onChange={s.setThemePreference}
          />
        </Section>

        <Section title={t('settings.language')}>
          <LanguageSelect value={s.languagePreference} onChange={s.setLanguagePreference} />
        </Section>

        <Section
          title={t('settings.defaultLanguages')}
          subtitle={t('settings.defaultLanguagesSub')}>
          <View style={styles.row}>
            <TextField containerStyle={styles.flex} label={t('common.iKnow')} value={s.knownLang} onChangeText={s.setKnownLang} />
            <TextField
              containerStyle={styles.flex}
              label={t('common.imLearning')}
              value={s.targetLang}
              onChangeText={s.setTargetLang}
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

/** Full-width dropdown for the app language: a field-style trigger that opens a
 *  modal list of every supported language (plus "System default"). */
function LanguageSelect({
  value,
  onChange,
}: {
  value: LanguagePreference;
  onChange: (v: LanguagePreference) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const options: { value: LanguagePreference; flag: string; label: string }[] =
    SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, flag: l.flag, label: l.nativeName }));
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.language')}
        accessibilityValue={{ text: current.label }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.selectTrigger,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        <View style={styles.optionLabel}>
          <Text style={styles.flag}>{current.flag}</Text>
          <ThemedText type="body">{current.label}</ThemedText>
        </View>
        <Icon name="caret-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Swallow taps on the sheet so only the backdrop dismisses. */}
          <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <ScrollView>
              {options.map((o) => {
                const isSelected = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={o.label}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}>
                    <View style={styles.optionLabel}>
                      <Text style={styles.flag}>{o.flag}</Text>
                      <ThemedText type={isSelected ? 'bodyBold' : 'body'}>{o.label}</ThemedText>
                    </View>
                    {isSelected ? <Icon name="check" size={19} color={theme.brand} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  sheet: {
    borderRadius: Radius.lg,
    maxHeight: '70%',
    paddingVertical: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  optionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flag: { fontSize: 20 },
  pressed: { opacity: 0.7 },
});
