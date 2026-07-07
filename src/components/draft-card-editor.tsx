import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Draft } from '@/hooks/use-card-generation';

const INPUT_MIN_HEIGHT = 52;

/** One generated card in the review stage: editable front/back plus a remove button. */
export function DraftCardEditor({
  draft,
  position,
  frontLabel,
  backLabel,
  onChangeFront,
  onChangeBack,
  onRemove,
}: {
  draft: Draft;
  /** 1-based position shown in the header. */
  position: number;
  frontLabel: string;
  backLabel: string;
  onChangeFront: (text: string) => void;
  onChangeBack: (text: string) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="h3" themeColor="textSecondary">
          {t('generate.cardN', { n: position })}
        </ThemedText>
        <IconButton
          icon="trash"
          variant="danger"
          size="sm"
          label={t('generate.removeCardN', { n: position })}
          onPress={onRemove}
        />
      </View>
      <TextField
        label={frontLabel}
        value={draft.front}
        multiline
        style={styles.input}
        onChangeText={onChangeFront}
      />
      <TextField
        label={backLabel}
        value={draft.back}
        multiline
        style={styles.input}
        onChangeText={onChangeBack}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { minHeight: INPUT_MIN_HEIGHT },
});
