import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function CardForm({
  initial,
  submitLabel,
  frontLabel = 'Front',
  backLabel = 'Back',
  notice,
  onSubmit,
}: {
  initial: { front: string; back: string };
  submitLabel: string;
  frontLabel?: string;
  backLabel?: string;
  notice?: string;
  onSubmit: (values: { front: string; back: string }) => void;
}) {
  const [front, setFront] = useState(initial.front);
  const [back, setBack] = useState(initial.back);
  const canSubmit = front.trim().length > 0 && back.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextField
        label={frontLabel}
        value={front}
        onChangeText={setFront}
        placeholder="Shown first"
        multiline
        autoFocus
      />
      <TextField
        label={backLabel}
        value={back}
        onChangeText={setBack}
        placeholder="The answer"
        multiline
      />
      <Button
        title={submitLabel}
        disabled={!canSubmit}
        onPress={() => onSubmit({ front, back })}
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
});
