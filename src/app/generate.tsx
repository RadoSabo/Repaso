import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIButton } from '@/components/ai-button';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { createCards, createDeck, getDeck } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { generateCards, GenerationError, type DraftCard } from '@/lib/generation';
import { useSettings } from '@/store/settings';

type Draft = DraftCard & { include: boolean };

export default function GenerateScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const existingDeck = deckId ? getDeck(Number(deckId)) : undefined;

  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSettings();

  const [deckName, setDeckName] = useState('');
  const [knownLang, setKnownLang] = useState(existingDeck?.knownLang ?? settings.knownLang);
  const [targetLang, setTargetLang] = useState(existingDeck?.targetLang ?? settings.targetLang);
  const [itemsText, setItemsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const cards = await generateCards({
        knownLang,
        targetLang,
        items: itemsText.split('\n'),
      });
      if (cards.length === 0) {
        setError('No cards were generated. Try different input.');
      } else {
        setDrafts(cards.map((c) => ({ ...c, include: true })));
      }
    } catch (e) {
      setError(e instanceof GenerationError ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    const selected = (drafts ?? []).filter((d) => d.include && d.front.trim() && d.back.trim());
    if (selected.length === 0) {
      Alert.alert('Nothing to save', 'Keep at least one card.');
      return;
    }
    const targetDeck = existingDeck ?? createDeck({ name: deckName.trim() || 'Generated deck', knownLang, targetLang });
    createCards(targetDeck.id, selected, 'generated');
    router.replace(`/deck/${targetDeck.id}`);
  }

  const insetStyle = { paddingBottom: insets.bottom + Spacing.three };

  // --- Draft review stage ---
  if (drafts) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary">
            Review and edit before saving. Tap a card to exclude it.
          </ThemedText>
          {drafts.map((d, i) => (
            <Pressable
              key={i}
              onPress={() => setDrafts((ds) => ds!.map((x, j) => (j === i ? { ...x, include: !x.include } : x)))}
              style={[
                styles.draft,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: d.include ? 1 : 0.45 },
              ]}>
              <TextField
                value={d.front}
                onChangeText={(t) => setDrafts((ds) => ds!.map((x, j) => (j === i ? { ...x, front: t } : x)))}
                multiline
              />
              <TextField
                value={d.back}
                onChangeText={(t) => setDrafts((ds) => ds!.map((x, j) => (j === i ? { ...x, back: t } : x)))}
                multiline
              />
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.footer, insetStyle, { borderTopColor: theme.border }]}>
          <Button title="Back" variant="secondary" style={styles.flex} onPress={() => setDrafts(null)} />
          <Button
            title={`Save ${drafts.filter((d) => d.include).length} cards`}
            style={styles.flex}
            onPress={handleSave}
          />
        </View>
      </ThemedView>
    );
  }

  // --- Input stage ---
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {existingDeck ? (
          <ThemedText type="small" themeColor="textSecondary">
            Adding to “{existingDeck.name}”.
          </ThemedText>
        ) : (
          <>
            <TextField
              label="New deck name"
              value={deckName}
              onChangeText={setDeckName}
              placeholder="Generated deck"
            />

            <View style={styles.langRow}>
              <View style={styles.flex}>
                <TextField label="I know" value={knownLang} onChangeText={setKnownLang} />
              </View>
              <View style={styles.flex}>
                <TextField label="I'm learning" value={targetLang} onChangeText={setTargetLang} />
              </View>
            </View>
          </>
        )}

        <TextField
          label="Words or phrases (one per line)"
          value={itemsText}
          onChangeText={setItemsText}
          placeholder={'house\nto run\ngood morning'}
          multiline
          style={styles.itemsInput}
        />

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary">
          Front = a sentence using the word in {knownLang}. Back = its {targetLang} translation.
        </ThemedText>
      </ScrollView>

      <View style={[styles.footer, insetStyle, { borderTopColor: theme.border }]}>
        <AIButton
          title="Generate cards"
          loading={loading}
          disabled={itemsText.trim().length === 0}
          style={styles.flex}
          onPress={handleGenerate}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  langRow: { flexDirection: 'row', gap: Spacing.three },
  itemsInput: { minHeight: 160 },
  draft: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
