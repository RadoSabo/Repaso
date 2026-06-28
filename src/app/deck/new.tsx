import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { DeckForm } from "@/components/deck-form";
import { ThemedView } from "@/components/themed-view";
import { createDeck } from "@/db/queries";
import { MAX_CARDS_PER_DECK } from "@/lib/limits";
import { useSettings } from "@/store/settings";

export default function NewDeckScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { knownLang, targetLang } = useSettings();

  return (
    <ThemedView style={{ flex: 1 }}>
      <DeckForm
        submitLabel={t("deckForm.createDeck")}
        notice={t("deckForm.notice", { max: MAX_CARDS_PER_DECK })}
        initial={{ name: "", description: "", knownLang, targetLang }}
        onSubmit={(v) => {
          const deck = createDeck(v);
          router.replace(`/deck/${deck.id}`);
        }}
      />
    </ThemedView>
  );
}
