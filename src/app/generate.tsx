import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
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

/** A topic chip drops a complete, ready-to-run instruction into the field. */
interface TopicSuggestion {
  label: string;
  prompt: string;
}

const KAV_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;

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
  const { t } = useTranslation();
  const settings = useSettings();
  const { isPro } = useEntitlement();
  const quota = useGenerationQuota(isPro);

  const outputSegments: readonly Segment<OutputStyle>[] = [
    { value: 'sentences', label: t('generate.styleSentences'), icon: 'chat' },
    { value: 'words', label: t('generate.styleWords'), icon: 'text' },
  ];
  const topicSuggestions = t('generate.topics', { returnObjects: true }) as TopicSuggestion[];

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
    Alert.alert(t('generate.addPhotoTitle'), t('generate.addPhotoBody'), [
      { text: t('generate.takePhoto'), onPress: image.fromCamera },
      { text: t('generate.choosePhoto'), onPress: image.fromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
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
        setError(t('generate.noCardsGenerated'));
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
      setError(e instanceof GenerationError ? e.message : t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    const selected = (drafts ?? []).filter((d) => d.front.trim() && d.back.trim());
    if (selected.length === 0) {
      Alert.alert(t('generate.nothingToSaveTitle'), t('generate.nothingToSaveBody'));
      return;
    }
    const targetDeck =
      existingDeck ??
      createDeck({ name: deckName.trim() || t('generate.generatedDeck'), knownLang, targetLang });
    createCards(targetDeck.id, selected, 'generated');
    router.replace(`/deck/${targetDeck.id}`);
  }

  // --- Draft review stage ---
  if (drafts) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={KAV_BEHAVIOR}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="sm" themeColor="textSecondary">
            {t('generate.reviewIntro')}
          </ThemedText>
          {omitted.length > 0 ? (
            <ThemedText type="sm" themeColor="accentOn">
              {t('generate.limitReached', { max: MAX_CARDS_PER_DECK, items: omitted.join(', ') })}
            </ThemedText>
          ) : null}
          {drafts.length === 0 ? (
            <ThemedText style={styles.emptyDrafts} themeColor="textMuted">
              {t('generate.noCardsLeft')}
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
                      {t('generate.cardN', { n: i + 1 })}
                    </ThemedText>
                    <IconButton
                      icon="trash"
                      variant="danger"
                      size="sm"
                      label={t('generate.removeCardN', { n: i + 1 })}
                      onPress={() => setDrafts((ds) => ds!.filter((x) => x.id !== d.id))}
                    />
                  </View>
                  <TextField
                    label={knownLang}
                    value={d.front}
                    multiline
                    style={styles.draftInput}
                    onChangeText={(t) =>
                      setDrafts((ds) => ds!.map((x) => (x.id === d.id ? { ...x, front: t } : x)))
                    }
                  />
                  <TextField
                    label={targetLang}
                    value={d.back}
                    multiline
                    style={styles.draftInput}
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
            <Button title={t('common.back')} variant="secondary" size="lg" onPress={() => setDrafts(null)} />
            <Button
              title={t('generate.saveCards', { count: drafts.length })}
              size="lg"
              leadingIcon="check"
              style={styles.flex}
              disabled={drafts.length === 0}
              onPress={handleSave}
            />
          </View>
        </BottomBar>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  const styleNoun = t(settings.outputStyle === 'words' ? 'generate.nounWord' : 'generate.nounSentence');

  // --- Input stage ---
  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={KAV_BEHAVIOR}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          segments={outputSegments}
          value={settings.outputStyle}
          onChange={settings.setOutputStyle}
        />

        {existingDeck ? (
          <ThemedText type="sm" themeColor="textSecondary">
            {t('generate.addingTo', { name: existingDeck.name })}
          </ThemedText>
        ) : (
          <>
            <TextField
              label={t('generate.newDeckName')}
              value={deckName}
              onChangeText={setDeckName}
              placeholder={t('generate.generatedDeck')}
            />
            <View style={styles.row}>
              <TextField containerStyle={styles.flex} label={t('common.iKnow')} value={knownLang} onChangeText={setKnownLang} />
              <TextField containerStyle={styles.flex} label={t('common.imLearning')} value={targetLang} onChangeText={setTargetLang} />
            </View>
          </>
        )}

        <TextField
          label={t('generate.inputLabel')}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('generate.inputPlaceholder')}
          multiline
          editable={!deckFull}
          style={styles.itemsInput}
        />

        {inputText.trim() === '' ? (
          <View style={styles.chips}>
            {topicSuggestions.map((topic) => (
              <Chip key={topic.label} icon="sparkle" onPress={() => setInputText(topic.prompt)}>
                {topic.label}
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
                  ? t('generate.transcribing')
                  : t('generate.record')
            }
            accessibilityLabel={t('generate.recordA11y')}
            active={voice.phase === 'recording'}
            busy={voice.phase === 'transcribing'}
            locked={!isPro}
            disabled={deckFull || image.loading}
            onPress={handleRecordPress}
          />
          <InputMethodButton
            icon="camera"
            label={image.loading ? t('generate.reading') : t('generate.photo')}
            accessibilityLabel={t('generate.photoA11y')}
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
          {t('generate.explainer', { known: knownLang, noun: styleNoun, target: targetLang })}
        </ThemedText>

        <ThemedText type="sm" themeColor={deckFull ? 'danger' : 'textMuted'}>
          {existingDeck
            ? deckFull
              ? t('generate.deckFull', { max: MAX_CARDS_PER_DECK })
              : t('generate.cardsUsed', { used: usedCount, max: MAX_CARDS_PER_DECK, remaining })
            : t('generate.cardsPerDeck', { max: MAX_CARDS_PER_DECK })}
        </ThemedText>

        {!isPro ? (
          <ThemedText type="sm" themeColor={quota.remaining === 0 ? 'danger' : 'textMuted'}>
            {t('generate.freeLeft', { count: quota.remaining })}
          </ThemedText>
        ) : null}
      </ScrollView>

      <BottomBar>
        <Button
          title={t('generate.generateCards')}
          variant="spark"
          size="lg"
          block
          leadingIcon="sparkle"
          loading={loading}
          disabled={deckFull || capturing || inputText.trim().length === 0}
          onPress={handleGenerate}
        />
      </BottomBar>
      </KeyboardAvoidingView>
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
  draftInput: { minHeight: 52 },
  draftHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyDrafts: { paddingVertical: Spacing.xxl, textAlign: 'center' },
});
