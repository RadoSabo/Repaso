import { useState } from 'react';
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
          label="Deck name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Spanish basics"
          autoFocus
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What is this deck for?"
        />
        <View>
          <View style={styles.langRow}>
            <TextField
              containerStyle={styles.langCol}
              label="I know"
              value={knownLang}
              onChangeText={setKnownLang}
              placeholder="English"
              editable={!lockLanguages}
            />
            <TextField
              containerStyle={styles.langCol}
              label="I'm learning"
              value={targetLang}
              onChangeText={setTargetLang}
              placeholder="Spanish"
              editable={!lockLanguages}
            />
          </View>
          {lockLanguages ? (
            <ThemedText type="sm" themeColor="textMuted" style={styles.langNote}>
              Languages can’t be changed once a deck has cards.
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
