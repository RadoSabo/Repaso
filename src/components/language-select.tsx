import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import type { LanguagePreference } from '@/store/settings';

const FLAG_FONT_SIZE = 20;

/** Full-width dropdown for the app language: a field-style trigger that opens a
 *  modal list of every supported language (plus "System default"). */
export function LanguageSelect({
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
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={() => setOpen(false)}>
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

const styles = StyleSheet.create({
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
  flag: { fontSize: FLAG_FONT_SIZE },
  pressed: { opacity: 0.7 },
});
