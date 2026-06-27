import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIButton } from '@/components/ai-button';
import { Button } from '@/components/button';
import { InputMethodButton } from '@/components/input-method-button';
import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { countCardsInDeck, createCards, createDeck, getDeck } from '@/db/queries';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useImageInput } from '@/hooks/use-image-input';
import { useTheme } from '@/hooks/use-theme';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { generateCards, GenerationError, type DraftCard, type OutputStyle } from '@/lib/generation';
import { MAX_CARDS_PER_DECK, MAX_RECORDING_SECONDS } from '@/lib/limits';
import { useSettings } from '@/store/settings';

type Draft = DraftCard & { id: number };

const OUTPUT_SEGMENTS: readonly Segment<OutputStyle>[] = [
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
];

const DELETE_ICON_SIZE = 22;

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function GenerateScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const existingDeck = deckId ? getDeck(Number(deckId)) : undefined;
  const usedCount = existingDeck ? countCardsInDeck(existingDeck.id) : 0;
  const remaining = MAX_CARDS_PER_DECK - usedCount;
  const deckFull = remaining <= 0;

  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const { isPro } = useEntitlement();

  const [deckName, setDeckName] = useState('');
  const [knownLang, setKnownLang] = useState(existingDeck?.knownLang ?? settings.knownLang);
  const [targetLang, setTargetLang] = useState(existingDeck?.targetLang ?? settings.targetLang);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  // Input items the model skipped because the 50-card limit was hit.
  const [omitted, setOmitted] = useState<string[]>([]);

  // Voice and image are input methods: they append their text to the field, then
  // the normal generation runs on it. Append (rather than replace) so a user can
  // combine several captures.
  const fillField = (text: string) =>
    setInputText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
  const voice = useVoiceInput(fillField);
  const image = useImageInput(fillField);

  const capturing = voice.phase !== 'idle' || image.loading;
  const captureError = voice.error ?? image.error;

  function showProUpsell() {
    // TODO(monetization Phase 3): router.push('/paywall') once the paywall exists.
    Alert.alert('Repaso Pro', 'Photo and voice input are part of Repaso Pro — coming soon.');
  }

  function handleRecordPress() {
    if (!isPro) {
      showProUpsell();
      return;
    }
    voice.toggle();
  }

  function handlePhotoPress() {
    if (!isPro) {
      showProUpsell();
      return;
    }
    Alert.alert('Add a photo', 'Read the text from a photo and turn it into cards.', [
      { text: 'Take photo', onPress: image.fromCamera },
      { text: 'Choose photo', onPress: image.fromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const { cards, omitted } = await generateCards({
        knownLang,
        targetLang,
        input: inputText,
        outputStyle: settings.outputStyle,
        max: remaining,
      });
      if (cards.length === 0) {
        setError('No cards were generated. Try different input.');
      } else {
        setOmitted(omitted);
        // The index is a permanent id: the list only ever shrinks (delete), so
        // ids stay unique and stable, keeping each card's TextInput instance.
        setDrafts(cards.map((c, i) => ({ ...c, id: i })));
      }
    } catch (e) {
      setError(e instanceof GenerationError ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    const selected = (drafts ?? []).filter((d) => d.front.trim() && d.back.trim());
    if (selected.length === 0) {
      Alert.alert('Nothing to save', 'Keep at least one card.');
      return;
    }
    const targetDeck =
      existingDeck ?? createDeck({ name: deckName.trim() || 'Generated deck', knownLang, targetLang });
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
            Review and edit each card before saving. Remove any you don’t want.
          </ThemedText>
          {omitted.length > 0 ? (
            <ThemedText type="small" themeColor="warning">
              Reached the {MAX_CARDS_PER_DECK}-card limit — not added: {omitted.join(', ')}
            </ThemedText>
          ) : null}
          {drafts.length === 0 ? (
            <ThemedText style={styles.emptyDrafts} themeColor="textSecondary">
              No cards left. Go back to generate again.
            </ThemedText>
          ) : (
            drafts.map((d, i) => (
              <View
                key={d.id}
                style={[styles.draft, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.draftHeader}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    Card {i + 1}
                  </ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove card ${i + 1}`}
                    hitSlop={Spacing.two}
                    onPress={() => setDrafts((ds) => ds!.filter((x) => x.id !== d.id))}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <MaterialIcons name="delete-outline" size={DELETE_ICON_SIZE} color={theme.danger} />
                  </Pressable>
                </View>

                <View style={styles.draftField}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {knownLang}
                  </ThemedText>
                  <TextField
                    value={d.front}
                    onChangeText={(t) => setDrafts((ds) => ds!.map((x) => (x.id === d.id ? { ...x, front: t } : x)))}
                    style={styles.draftInput}
                    multiline
                  />
                </View>

                <View style={styles.draftField}>
                  <ThemedText type="smallBold" themeColor="tint">
                    {targetLang}
                  </ThemedText>
                  <TextField
                    value={d.back}
                    onChangeText={(t) => setDrafts((ds) => ds!.map((x) => (x.id === d.id ? { ...x, back: t } : x)))}
                    style={styles.draftInput}
                    multiline
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
        <View style={[styles.footer, insetStyle, { borderTopColor: theme.border }]}>
          <Button title="Back" variant="secondary" style={styles.flex} onPress={() => setDrafts(null)} />
          <Button
            title={`Save ${drafts.length} cards`}
            style={styles.flex}
            disabled={drafts.length === 0}
            onPress={handleSave}
          />
        </View>
      </ThemedView>
    );
  }

  const styleNoun = settings.outputStyle === 'words' ? 'word' : 'sentence';

  // --- Input stage ---
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          segments={OUTPUT_SEGMENTS}
          value={settings.outputStyle}
          onChange={settings.setOutputStyle}
        />

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
          label="Words, phrases, sentences, or a topic"
          value={inputText}
          onChangeText={setInputText}
          placeholder={'house, to run, good morning\nOr a topic: banking and mortgage vocabulary'}
          multiline
          editable={!deckFull}
          style={styles.itemsInput}
        />

        <View style={styles.captureRow}>
          <InputMethodButton
            icon={voice.phase === 'recording' ? 'stop' : 'mic'}
            label={
              voice.phase === 'recording'
                ? `${formatSeconds(voice.seconds)} / ${formatSeconds(MAX_RECORDING_SECONDS)}`
                : voice.phase === 'transcribing'
                  ? 'Transcribing…'
                  : 'Record'
            }
            accessibilityLabel="Record audio to generate cards from"
            active={voice.phase === 'recording'}
            busy={voice.phase === 'transcribing'}
            locked={!isPro}
            disabled={deckFull || image.loading}
            onPress={handleRecordPress}
          />
          <InputMethodButton
            icon="photo-camera"
            label={image.loading ? 'Reading…' : 'Photo'}
            accessibilityLabel="Add a photo to generate cards from"
            busy={image.loading}
            locked={!isPro}
            disabled={deckFull || voice.phase !== 'idle'}
            onPress={handlePhotoPress}
          />
        </View>

        {captureError ? (
          <ThemedText type="small" themeColor="danger">
            {captureError}
          </ThemedText>
        ) : null}

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary">
          Type or speak words to translate, or describe what you want to learn (e.g.
          banking and mortgage vocabulary). Each card is a {knownLang} {styleNoun} with
          its {targetLang} translation.
        </ThemedText>

        <ThemedText type="small" themeColor={deckFull ? 'danger' : 'textSecondary'}>
          {existingDeck
            ? deckFull
              ? `This deck is full (${MAX_CARDS_PER_DECK} cards max). Delete some cards to add more.`
              : `${usedCount} of ${MAX_CARDS_PER_DECK} cards used — up to ${remaining} more.`
            : `Up to ${MAX_CARDS_PER_DECK} cards per deck.`}
        </ThemedText>
      </ScrollView>

      <View style={[styles.footer, insetStyle, { borderTopColor: theme.border }]}>
        <AIButton
          title="Generate cards"
          loading={loading}
          disabled={deckFull || capturing || inputText.trim().length === 0}
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
  captureRow: { flexDirection: 'row', gap: Spacing.three },
  draft: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draftField: { gap: Spacing.one },
  draftInput: { minHeight: 56 },
  emptyDrafts: { paddingVertical: Spacing.four, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
