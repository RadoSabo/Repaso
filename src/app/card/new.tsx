import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { countCardsInDeck, createCard, getDeck } from '@/db/queries';
import { MAX_CARDS_PER_DECK } from '@/lib/limits';

export default function NewCardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  // The deck and its card count are fixed for this screen's lifetime — snapshot once.
  const [deck] = useState(() => getDeck(Number(deckId)));
  const [usedCount] = useState(() => (deck ? countCardsInDeck(deck.id) : 0));

  if (!deck) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.xxl }}>
        <ThemedText>{t('card.deckNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  const remaining = MAX_CARDS_PER_DECK - usedCount;

  if (remaining <= 0) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.xxl, gap: Spacing.sm }}>
        <ThemedText type="h2">{t('card.deckFullTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {t('card.deckFullBody', { max: MAX_CARDS_PER_DECK })}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <CardForm
        submitLabel={t('cardForm.addCard')}
        frontLabel={t('cardForm.frontWithLang', { lang: deck.knownLang })}
        backLabel={t('cardForm.backWithLang', { lang: deck.targetLang })}
        tip={t('cardForm.tip')}
        notice={t('card.notice', { used: usedCount, max: MAX_CARDS_PER_DECK, remaining })}
        initial={{ front: '', back: '' }}
        onSubmit={(v) => {
          createCard({ deckId: deck.id, front: v.front, back: v.back, source: 'manual' });
          router.back();
        }}
      />
    </ThemedView>
  );
}
