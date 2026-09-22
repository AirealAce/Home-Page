import { BUNDLED_DECKS, bundledDeckUrl } from "../data/bundledDecks";
import { importApkg } from "./apkgParser";

// Reuse the ordinary importer and its SHA-256 identities. A previously
// imported copy of a public deck keeps the same card IDs and saved progress.
export async function loadBundledDecks(
  savedDecks,
  { fetcher = fetch, importer = importApkg } = {},
) {
  const results = await Promise.all(
    BUNDLED_DECKS.map(async (entry) => {
      const cached = savedDecks.filter(
        (deck) => deck.packageId === entry.packageId,
      );
      if (
        cached.reduce((count, deck) => count + deck.cards.length, 0) ===
        entry.cardCount
      )
        return { decks: cached, added: [] };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      try {
        const response = await fetcher(bundledDeckUrl(entry), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Deck download failed");
        const file = new File([await response.blob()], entry.fileName);
        const result = await importer(file);
        if (
          !result.decks.every((deck) => deck.packageId === entry.packageId) ||
          result.decks.reduce((count, deck) => count + deck.cards.length, 0) !==
            entry.cardCount
        )
          throw new Error(
            "Deck package does not match the published collection",
          );
        return { decks: result.decks, added: result.decks };
      } catch {
        return { decks: [], added: [], failed: entry.name };
      } finally {
        clearTimeout(timeout);
      }
    }),
  );
  return {
    decks: results.flatMap((result) => result.decks),
    added: results.flatMap((result) => result.added),
    failed: results.flatMap((result) => (result.failed ? [result.failed] : [])),
  };
}

export function mergeLibraryDecks(...collections) {
  const decks = new Map();
  for (const deck of collections.flat()) decks.set(deck.id, deck);
  const order = (deck) => {
    const index = BUNDLED_DECKS.findIndex(
      (entry) => entry.packageId === deck.packageId,
    );
    return index < 0 ? BUNDLED_DECKS.length : index;
  };
  return [...decks.values()].sort(
    (a, b) => order(a) - order(b) || a.name.localeCompare(b.name),
  );
}
