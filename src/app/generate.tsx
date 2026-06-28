import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { IconButton } from '@/components/icon-button';
import { InputMethodButton } from '@/components/input-method-button';
import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { countCardsInDeck, createCards, createDeck, getDeck } from '@/db/queries';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useGenerationQuota } from '@/hooks/use-generation-quota';
import { useImageInput } from '@/hooks/use-image-input';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { generateCards, GenerationError, type DraftCard, type OutputStyle } from '@/lib/generation';
import { MAX_CARDS_PER_DECK, MAX_RECORDING_SECONDS } from '@/lib/limits';
import { useSettings } from '@/store/settings';

type Draft = DraftCard & { id: number };

const OUTPUT_SEGMENTS: readonly Segment<OutputStyle>[] = [
  { value: 'sentences', label: 'Sentences', icon: 'chat' },
  { value: 'words', label: 'Words', icon: 'text' },
];

// Each chip drops a complete, ready-to-run instruction into the field.
const TOPIC_SUGGESTIONS: readonly { label: string; prompt: string }[] = [
  { label: 'Numbers', prompt: 'Numbers from 1 to 50' },
  { label: 'At the airport', prompt: 'Vocabulary you need at the airport' },
  { label: 'Small talk', prompt: 'Useful small talk phrases' },
  { label: 'Banking', prompt: 'Banking and money vocabulary' },
  { label: 'Cooking', prompt: 'Cooking and kitchen vocabulary' },
  { label: 'Body parts', prompt: 'Common parts of the body' },
];

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

  const router = useRouter();
  const settings = useSettings();
  const { isPro } = useEntitlement();
  const quota = useGenerationQuota(isPro);

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
  const goToPaywall = () => router.push('/paywall');
  const voice = useVoiceInput(fillField, goToPaywall);
  const image = useImageInput(fillField, goToPaywall);

  const capturing = voice.phase !== 'idle' || image.loading;
  const captureError = voice.error ?? image.error;

  function showProUpsell() {
    router.push('/paywall');
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
    // Free allowance spent → straight to the paywall (server enforces this too).
    if (!quota.canGenerate) {
      router.push('/paywall');
      return;
    }
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
      quota.refresh();
    } catch (e) {
      if (e instanceof GenerationError && e.paywall) {
        router.push('/paywall');
        return;
      }
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

  // --- Draft review stage ---
  if (drafts) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="sm" themeColor="textSecondary">
            Review and edit each card before saving. Remove any you don’t want.
          </ThemedText>
          {omitted.length > 0 ? (
            <ThemedText type="sm" themeColor="accentOn">
              Reached the {MAX_CARDS_PER_DECK}-card limit — not added: {omitted.join(', ')}
            </ThemedText>
          ) : null}
          {drafts.length === 0 ? (
            <ThemedText style={styles.emptyDrafts} themeColor="textMuted">
              No cards left. Go back to generate again.
            </ThemedText>
          ) : (
            drafts.map((d, i) => (
              <Animated.View
                key={d.id}
                layout={LinearTransition.duration(220)}
                exiting={FadeOut.duration(180)}>
                <Card padding="md" style={styles.draft}>
                  <View style={styles.draftHeader}>
                    <ThemedText type="h3" themeColor="textSecondary">
                      Card {i + 1}
                    </ThemedText>
                    <IconButton
                      icon="trash"
                      variant="danger"
                      size="sm"
                      label={`Remove card ${i + 1}`}
                      onPress={() => setDrafts((ds) => ds!.filter((x) => x.id !== d.id))}
                    />
                  </View>
                  <TextField
                    label={knownLang}
                    value={d.front}
                    onChangeText={(t) =>
                      setDrafts((ds) => ds!.map((x) => (x.id === d.id ? { ...x, front: t } : x)))
                    }
                  />
                  <TextField
                    label={targetLang}
                    value={d.back}
                    onChangeText={(t) =>
                      setDrafts((ds) => ds!.map((x) => (x.id === d.id ? { ...x, back: t } : x)))
                    }
                  />
                </Card>
              </Animated.View>
            ))
          )}
        </ScrollView>
        <BottomBar>
          <View style={styles.row}>
            <Button title="Back" variant="secondary" size="lg" onPress={() => setDrafts(null)} />
            <Button
              title={`Save ${drafts.length} cards`}
              size="lg"
              leadingIcon="check"
              style={styles.flex}
              disabled={drafts.length === 0}
              onPress={handleSave}
            />
          </View>
        </BottomBar>
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
          <ThemedText type="sm" themeColor="textSecondary">
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
            <View style={styles.row}>
              <TextField containerStyle={styles.flex} label="I know" value={knownLang} onChangeText={setKnownLang} />
              <TextField containerStyle={styles.flex} label="I'm learning" value={targetLang} onChangeText={setTargetLang} />
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

        {inputText.trim() === '' ? (
          <View style={styles.chips}>
            {TOPIC_SUGGESTIONS.map((t) => (
              <Chip key={t.label} icon="sparkle" onPress={() => setInputText(t.prompt)}>
                {t.label}
              </Chip>
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          <InputMethodButton
            icon={voice.phase === 'recording' ? 'stop' : 'microphone'}
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
            icon="camera"
            label={image.loading ? 'Reading…' : 'Photo'}
            accessibilityLabel="Add a photo to generate cards from"
            busy={image.loading}
            locked={!isPro}
            disabled={deckFull || voice.phase !== 'idle'}
            onPress={handlePhotoPress}
          />
        </View>

        {captureError ? (
          <ThemedText type="sm" themeColor="danger">
            {captureError}
          </ThemedText>
        ) : null}

        {error ? (
          <ThemedText type="sm" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <ThemedText type="sm" themeColor="textMuted">
          Type or speak words to translate, or describe what you want to learn (e.g. banking and
          mortgage vocabulary). Each card is a {knownLang} {styleNoun} with its {targetLang}{' '}
          translation.
        </ThemedText>

        <ThemedText type="sm" themeColor={deckFull ? 'danger' : 'textMuted'}>
          {existingDeck
            ? deckFull
              ? `This deck is full (${MAX_CARDS_PER_DECK} cards max). Delete some cards to add more.`
              : `${usedCount} of ${MAX_CARDS_PER_DECK} cards used — up to ${remaining} more.`
            : `Up to ${MAX_CARDS_PER_DECK} cards per deck.`}
        </ThemedText>

        {!isPro ? (
          <ThemedText type="sm" themeColor={quota.remaining === 0 ? 'danger' : 'textMuted'}>
            {quota.remaining} free {quota.remaining === 1 ? 'generation' : 'generations'} left this
            month — unlimited with Repaso Pro.
          </ThemedText>
        ) : null}
      </ScrollView>

      <BottomBar>
        <Button
          title="Generate cards"
          variant="spark"
          size="lg"
          block
          leadingIcon="sparkle"
          loading={loading}
          disabled={deckFull || capturing || inputText.trim().length === 0}
          onPress={handleGenerate}
        />
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.gutter, gap: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
  itemsInput: { minHeight: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  draft: { gap: Spacing.md },
  draftHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyDrafts: { paddingVertical: Spacing.xxl, textAlign: 'center' },
});
