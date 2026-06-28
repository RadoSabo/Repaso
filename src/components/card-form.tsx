import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CardForm({
  initial,
  submitLabel,
  frontLabel = 'Front',
  backLabel = 'Back',
  notice,
  tip,
  onSubmit,
}: {
  initial: { front: string; back: string };
  submitLabel: string;
  frontLabel?: string;
  backLabel?: string;
  notice?: string;
  /** Optional teaching tip shown in an info callout. */
  tip?: string;
  onSubmit: (values: { front: string; back: string }) => void;
}) {
  const theme = useTheme();
  const [front, setFront] = useState(initial.front);
  const [back, setBack] = useState(initial.back);
  const canSubmit = front.trim().length > 0 && back.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        {tip ? (
          <View style={[styles.tip, { backgroundColor: theme.infoSoft }]}>
            <Icon name="lightbulb" size={18} color={theme.infoOn} />
            <ThemedText type="sm" themeColor="infoOn" style={styles.tipText}>
              {tip}
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <BottomBar>
        <Button
          title={submitLabel}
          size="lg"
          block
          leadingIcon="check"
          disabled={!canSubmit}
          onPress={() => onSubmit({ front, back })}
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
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md + 2,
    borderRadius: Radius.md,
  },
  tipText: { flex: 1 },
  notice: { textAlign: 'center' },
});
