import { useRouter } from "expo-router";

import { DeckForm } from "@/components/deck-form";
import { ThemedView } from "@/components/themed-view";
import { createDeck } from "@/db/queries";
import { useSettings } from "@/store/settings";

export default function NewDeckScreen() {
  const router = useRouter();
  const { knownLang, targetLang } = useSettings();

  return (
    <ThemedView style={{ flex: 1 }}>
      <DeckForm
        submitLabel="Create deck"
        initial={{ name: "", description: "", knownLang, targetLang }}
        onSubmit={(v) => {
          const deck = createDeck(v);
          router.replace(`/deck/${deck.id}`);
        }}
      />
    </ThemedView>
  );
}
