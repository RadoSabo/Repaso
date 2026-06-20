import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

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
  onSubmit,
}: {
  initial: DeckFormValues;
  submitLabel: string;
  notice?: string;
  onSubmit: (values: DeckFormValues) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [knownLang, setKnownLang] = useState(initial.knownLang);
  const [targetLang, setTargetLang] = useState(initial.targetLang);

  const canSubmit = name.trim().length > 0 && knownLang.trim() && targetLang.trim();

  return (
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
      <View style={styles.langRow}>
        <View style={styles.langCol}>
          <TextField
            label="I know"
            value={knownLang}
            onChangeText={setKnownLang}
            placeholder="English"
          />
        </View>
        <View style={styles.langCol}>
          <TextField
            label="I'm learning"
            value={targetLang}
            onChangeText={setTargetLang}
            placeholder="Spanish"
          />
        </View>
      </View>
      <Button
        title={submitLabel}
        disabled={!canSubmit}
        onPress={() => onSubmit({ name, description, knownLang, targetLang })}
      />
      {notice ? (
        <ThemedText type="small" themeColor="textSecondary">
          {notice}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three },
  langRow: { flexDirection: 'row', gap: Spacing.three },
  langCol: { flex: 1 },
});
