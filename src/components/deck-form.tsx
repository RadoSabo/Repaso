import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface DeckFormValues {
  name: string;
  description: string;
  knownLang: string;
  targetLang: string;
}

export function DeckForm({
  initial,
  submitLabel,
  notice,
  lockLanguages = false,
  onSubmit,
}: {
  initial: DeckFormValues;
  submitLabel: string;
  notice?: string;
  /** Prevent changing the deck's languages (used once a deck already has cards). */
  lockLanguages?: boolean;
  onSubmit: (values: DeckFormValues) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [knownLang, setKnownLang] = useState(initial.knownLang);
  const [targetLang, setTargetLang] = useState(initial.targetLang);

  const canSubmit = name.trim().length > 0 && knownLang.trim() && targetLang.trim();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label={t('deckForm.deckName')}
          value={name}
          onChangeText={setName}
          placeholder={t('deckForm.deckNamePlaceholder')}
          autoFocus
        />
        <TextField
          label={t('deckForm.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('deckForm.descriptionPlaceholder')}
        />
        <View>
          <View style={styles.langRow}>
            <TextField
              containerStyle={styles.langCol}
              label={t('common.iKnow')}
              value={knownLang}
              onChangeText={setKnownLang}
              placeholder={t('deckForm.knownPlaceholder')}
              editable={!lockLanguages}
            />
            <TextField
              containerStyle={styles.langCol}
              label={t('common.imLearning')}
              value={targetLang}
              onChangeText={setTargetLang}
              placeholder={t('deckForm.targetPlaceholder')}
              editable={!lockLanguages}
            />
          </View>
          {lockLanguages ? (
            <ThemedText type="sm" themeColor="textMuted" style={styles.langNote}>
              {t('deckForm.langLocked')}
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>

      <BottomBar>
        <Button
          title={submitLabel}
          size="lg"
          block
          leadingIcon="check"
          disabled={!canSubmit}
          onPress={() => onSubmit({ name, description, knownLang, targetLang })}
        />
        {notice ? (
          <ThemedText type="sm" themeColor="textMuted" style={styles.notice}>
            {notice}
          </ThemedText>
        ) : null}
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.xl },
  langRow: { flexDirection: 'row', gap: Spacing.md },
  langCol: { flex: 1 },
  langNote: { marginTop: Spacing.sm },
  notice: { textAlign: 'center' },
});
