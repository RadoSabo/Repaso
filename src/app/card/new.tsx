import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { countCardsInDeck, createCard, getDeck } from '@/db/queries';
import { MAX_CARDS_PER_DECK } from '@/lib/limits';

export default function NewCardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const deck = getDeck(Number(deckId));

  if (!deck) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <ThemedText>{t('card.deckNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  const usedCount = countCardsInDeck(deck.id);
  const remaining = MAX_CARDS_PER_DECK - usedCount;

  if (remaining <= 0) {
    return (
      <ThemedView style={{ flex: 1, padding: 24, gap: 8 }}>
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
