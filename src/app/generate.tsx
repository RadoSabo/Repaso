import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { DraftCardEditor } from '@/components/draft-card-editor';
import { InputMethodButton } from '@/components/input-method-button';
import { SegmentedControl, type Segment } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCardGeneration } from '@/hooks/use-card-generation';
import { useImageInput } from '@/hooks/use-image-input';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { type OutputStyle } from '@/lib/generation';
import { MAX_CARDS_PER_DECK, MAX_RECORDING_SECONDS } from '@/lib/limits';
import { useSettings } from '@/store/settings';

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
  const { t } = useTranslation();
  const outputStyle = useSettings((s) => s.outputStyle);
  const setOutputStyle = useSettings((s) => s.setOutputStyle);
  const defaultKnownLang = useSettings((s) => s.knownLang);
  const defaultTargetLang = useSettings((s) => s.targetLang);
  const gen = useCardGeneration(deckId);

  const outputSegments: readonly Segment<OutputStyle>[] = [
    { value: 'sentences', label: t('generate.styleSentences'), icon: 'chat' },
    { value: 'words', label: t('generate.styleWords'), icon: 'text' },
  ];
  const topicSuggestions = t('generate.topics', { returnObjects: true }) as TopicSuggestion[];

  const [deckName, setDeckName] = useState('');
  const [knownLang, setKnownLang] = useState(gen.existingDeck?.knownLang ?? defaultKnownLang);
  const [targetLang, setTargetLang] = useState(gen.existingDeck?.targetLang ?? defaultTargetLang);
  const [inputText, setInputText] = useState('');

  // Voice and image are input methods: they append their text to the field, then
  // the normal generation runs on it. Append (rather than replace) so a user can
  // combine several captures.
  const fillField = (text: string) =>
    setInputText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
  const voice = useVoiceInput(fillField, gen.goToPaywall);
  const image = useImageInput(fillField, gen.goToPaywall);

  const capturing = voice.phase !== 'idle' || image.loading;
  const captureError = voice.error ?? image.error;

  function handleRecordPress() {
    if (!gen.isPro) {
      gen.goToPaywall();
      return;
    }
    voice.toggle();
  }

  function handlePhotoPress() {
    if (!gen.isPro) {
      gen.goToPaywall();
      return;
    }
    Alert.alert(t('generate.addPhotoTitle'), t('generate.addPhotoBody'), [
      { text: t('generate.takePhoto'), onPress: image.fromCamera },
      { text: t('generate.choosePhoto'), onPress: image.fromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  // --- Draft review stage ---
  if (gen.drafts) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={KAV_BEHAVIOR}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="sm" themeColor="textSecondary">
            {t('generate.reviewIntro')}
          </ThemedText>
          {gen.omitted.length > 0 ? (
            <ThemedText type="sm" themeColor="accentOn">
              {t('generate.limitReached', { max: MAX_CARDS_PER_DECK, items: gen.omitted.join(', ') })}
            </ThemedText>
          ) : null}
          {gen.drafts.length === 0 ? (
            <ThemedText style={styles.emptyDrafts} themeColor="textMuted">
              {t('generate.noCardsLeft')}
            </ThemedText>
          ) : (
            gen.drafts.map((draft, i) => (
              <Animated.View
                key={draft.id}
                layout={LinearTransition.duration(220)}
                exiting={FadeOut.duration(180)}>
                <DraftCardEditor
                  draft={draft}
                  position={i + 1}
                  frontLabel={knownLang}
                  backLabel={targetLang}
                  onChangeFront={(text) => gen.updateDraft(draft.id, { front: text })}
                  onChangeBack={(text) => gen.updateDraft(draft.id, { back: text })}
                  onRemove={() => gen.removeDraft(draft.id)}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
        <BottomBar>
          <View style={styles.row}>
            <Button title={t('common.back')} variant="secondary" size="lg" onPress={gen.discardDrafts} />
            <Button
              title={t('generate.saveCards', { count: gen.saveableCount })}
              size="lg"
              leadingIcon="check"
              style={styles.flex}
              disabled={gen.drafts.length === 0}
              onPress={() => gen.save({ deckName, knownLang, targetLang })}
            />
          </View>
        </BottomBar>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  const styleNoun = t(outputStyle === 'words' ? 'generate.nounWord' : 'generate.nounSentence');

  // --- Input stage ---
  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={KAV_BEHAVIOR}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl segments={outputSegments} value={outputStyle} onChange={setOutputStyle} />

        {gen.existingDeck ? (
          <ThemedText type="sm" themeColor="textSecondary">
            {t('generate.addingTo', { name: gen.existingDeck.name })}
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
          editable={!gen.deckFull}
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
            locked={!gen.isPro}
            disabled={gen.deckFull || image.loading}
            onPress={handleRecordPress}
          />
          <InputMethodButton
            icon="camera"
            label={image.loading ? t('generate.reading') : t('generate.photo')}
            accessibilityLabel={t('generate.photoA11y')}
            busy={image.loading}
            locked={!gen.isPro}
            disabled={gen.deckFull || voice.phase !== 'idle'}
            onPress={handlePhotoPress}
          />
        </View>

        {captureError ? (
          <ThemedText type="sm" themeColor="danger">
            {captureError}
          </ThemedText>
        ) : null}

        {gen.error ? (
          <ThemedText type="sm" themeColor="danger">
            {gen.error}
          </ThemedText>
        ) : null}

        <ThemedText type="sm" themeColor="textMuted">
          {t('generate.explainer', { known: knownLang, noun: styleNoun, target: targetLang })}
        </ThemedText>

        <ThemedText type="sm" themeColor={gen.deckFull ? 'danger' : 'textMuted'}>
          {gen.existingDeck
            ? gen.deckFull
              ? t('generate.deckFull', { max: MAX_CARDS_PER_DECK })
              : t('generate.cardsUsed', {
                  used: gen.usedCount,
                  max: MAX_CARDS_PER_DECK,
                  remaining: gen.remaining,
                })
            : t('generate.cardsPerDeck', { max: MAX_CARDS_PER_DECK })}
        </ThemedText>

        {!gen.isPro ? (
          <ThemedText type="sm" themeColor={gen.quotaRemaining === 0 ? 'danger' : 'textMuted'}>
            {t('generate.freeLeft', { count: gen.quotaRemaining })}
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
          loading={gen.loading}
          disabled={gen.deckFull || capturing || inputText.trim().length === 0}
          onPress={() => gen.generate({ knownLang, targetLang, input: inputText })}
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
  emptyDrafts: { paddingVertical: Spacing.xxl, textAlign: 'center' },
});
