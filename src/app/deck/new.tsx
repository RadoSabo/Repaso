import { useRouter } from "expo-router";

import { DeckForm } from "@/components/deck-form";
import { ThemedView } from "@/components/themed-view";
import { createDeck } from "@/db/queries";
import { MAX_CARDS_PER_DECK } from "@/lib/limits";
import { useSettings } from "@/store/settings";

export default function NewDeckScreen() {
  const router = useRouter();
  const { knownLang, targetLang } = useSettings();

  return (
    <ThemedView style={{ flex: 1 }}>
      <DeckForm
        submitLabel="Create deck"
        notice={`Each deck holds up to ${MAX_CARDS_PER_DECK} cards.`}
        initial={{ name: "", description: "", knownLang, targetLang }}
        onSubmit={(v) => {
          const deck = createDeck(v);
          router.replace(`/deck/${deck.id}`);
        }}
      />
    </ThemedView>
  );
}
