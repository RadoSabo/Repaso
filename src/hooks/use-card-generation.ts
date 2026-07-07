import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { countCardsInDeck, createCards, createDeck, getDeck } from '@/db/queries';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useGenerationQuota } from '@/hooks/use-generation-quota';
import { generateCards, GenerationError, type DraftCard } from '@/lib/generation';
import { MAX_CARDS_PER_DECK } from '@/lib/limits';
import { useSettings } from '@/store/settings';

export type Draft = DraftCard & { id: number };

export interface CardGeneration {
  /** Deck the cards are being added to, if the screen was opened from one. */
  existingDeck: ReturnType<typeof getDeck>;
  usedCount: number;
  /** How many more cards the deck can hold. */
  remaining: number;
  deckFull: boolean;
  isPro: boolean;
  /** Free generations left (ignored when Pro). */
  quotaRemaining: number;
  loading: boolean;
  error: string | null;
  /** Generated cards awaiting review, or null while still on the input stage. */
  drafts: Draft[] | null;
  /** Input items the model skipped because the card limit was hit. */
  omitted: string[];
  /** Drafts that would actually be saved (blank ones are dropped). */
  saveableCount: number;
  goToPaywall: () => void;
  generate: (params: { knownLang: string; targetLang: string; input: string }) => Promise<void>;
  updateDraft: (id: number, patch: Partial<DraftCard>) => void;
  removeDraft: (id: number) => void;
  /** Return to the input stage, discarding the current drafts. */
  discardDrafts: () => void;
  save: (params: { deckName: string; knownLang: string; targetLang: string }) => void;
}

/**
 * Owns one card-generation flow: the deck snapshot and its capacity, quota
 * gating (free allowance → paywall), the generate call, the editable draft
 * list, and saving the result. Kept free of presentation so the screen just
 * composes it with components.
 */
export function useCardGeneration(deckId: string | undefined): CardGeneration {
  const router = useRouter();
  const { t } = useTranslation();
  const outputStyle = useSettings((s) => s.outputStyle);
  const { isPro } = useEntitlement();
  const quota = useGenerationQuota(isPro);

  // The deck and its card count are fixed for this screen's lifetime — snapshot once.
  const [existingDeck] = useState(() => (deckId ? getDeck(Number(deckId)) : undefined));
  const [usedCount] = useState(() => (existingDeck ? countCardsInDeck(existingDeck.id) : 0));
  const remaining = MAX_CARDS_PER_DECK - usedCount;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [omitted, setOmitted] = useState<string[]>([]);

  const goToPaywall = () => router.push('/paywall');

  async function generate(params: { knownLang: string; targetLang: string; input: string }) {
    // Free allowance spent → straight to the paywall (server enforces this too).
    if (!quota.canGenerate) {
      goToPaywall();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generateCards({ ...params, outputStyle, max: remaining });
      if (result.cards.length === 0) {
        setError(t('generate.noCardsGenerated'));
      } else {
        setOmitted(result.omitted);
        // The index is a permanent id: the list only ever shrinks (delete), so
        // ids stay unique and stable, keeping each card's TextInput instance.
        setDrafts(result.cards.map((c, i) => ({ ...c, id: i })));
      }
      quota.refresh();
    } catch (e) {
      if (e instanceof GenerationError && e.paywall) {
        goToPaywall();
        return;
      }
      setError(e instanceof GenerationError ? e.message : t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  }

  const updateDraft = (id: number, patch: Partial<DraftCard>) =>
    setDrafts((ds) => ds!.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDraft = (id: number) => setDrafts((ds) => ds!.filter((d) => d.id !== id));
  const discardDrafts = () => setDrafts(null);

  const saveable = (drafts ?? []).filter((d) => d.front.trim() && d.back.trim());

  function save(params: { deckName: string; knownLang: string; targetLang: string }) {
    if (saveable.length === 0) {
      Alert.alert(t('generate.nothingToSaveTitle'), t('generate.nothingToSaveBody'));
      return;
    }
    const targetDeck =
      existingDeck ??
      createDeck({
        name: params.deckName.trim() || t('generate.generatedDeck'),
        knownLang: params.knownLang,
        targetLang: params.targetLang,
      });
    createCards(targetDeck.id, saveable, 'generated');
    router.replace(`/deck/${targetDeck.id}`);
  }

  return {
    existingDeck,
    usedCount,
    remaining,
    deckFull: remaining <= 0,
    isPro,
    quotaRemaining: quota.remaining,
    loading,
    error,
    drafts,
    omitted,
    saveableCount: saveable.length,
    goToPaywall,
    generate,
    updateDraft,
    removeDraft,
    discardDrafts,
    save,
  };
}
