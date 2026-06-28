import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { CardForm } from '@/components/card-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getCard, getDeck, updateCard } from '@/db/queries';
import { confirmDeleteCard } from '@/lib/deck-actions';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const card = getCard(Number(id));
  const deck = card ? getDeck(card.deckId) : undefined;

  if (!card) {
    return (
      <ThemedView style={{ flex: 1, padding: Spacing.xxl }}>
        <ThemedText>{t('card.cardNotFound')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => confirmDeleteCard(card.id, card.front, () => router.back())}>
              <ThemedText type="smBold" themeColor="danger">
                {t('card.delete')}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <CardForm
        submitLabel={t('cardForm.saveChanges')}
        frontLabel={deck ? t('cardForm.frontWithLang', { lang: deck.knownLang }) : t('cardForm.front')}
        backLabel={deck ? t('cardForm.backWithLang', { lang: deck.targetLang }) : t('cardForm.back')}
        initial={{ front: card.front, back: card.back }}
        onSubmit={(v) => {
          updateCard(card.id, v);
          router.back();
        }}
      />
    </ThemedView>
  );
}
