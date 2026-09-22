import { describe, it, expect, vi } from "vitest";
import {
  BUNDLED_DECKS,
  bundledDeckUrl,
  isBundledDeck,
} from "../src/data/bundledDecks";
import {
  loadBundledDecks,
  mergeLibraryDecks,
} from "../src/services/bundledDecks";

const deckFor = (entry) => ({
  id: `${entry.packageId}:original-anki-deck-id`,
  packageId: entry.packageId,
  name: entry.name,
  cards: Array.from({ length: entry.cardCount }, (_, i) => ({
    id: String(i),
    front: "Question",
    back: "Answer",
  })),
  media: {},
});
const savedDecks = () => BUNDLED_DECKS.map(deckFor);
const importer = () =>
  vi.fn(async (file) => ({
    decks: [
      deckFor(BUNDLED_DECKS.find((entry) => entry.fileName === file.name)),
    ],
  }));
const fetcher = () =>
  vi.fn(async () => ({ ok: true, blob: async () => new Blob(["package"]) }));

describe("public CPACC collection", () => {
  it("loads every included deck for a new visitor without a file upload", async () => {
    const download = fetcher(),
      parse = importer();
    const result = await loadBundledDecks([], {
      fetcher: download,
      importer: parse,
    });
    expect(result.decks).toHaveLength(6);
    expect(result.added).toHaveLength(6);
    expect(result.failed).toEqual([]);
    expect(
      result.decks.reduce((count, deck) => count + deck.cards.length, 0),
    ).toBe(432);
    expect(download).toHaveBeenCalledTimes(6);
    for (const entry of BUNDLED_DECKS) {
      expect(download).toHaveBeenCalledWith(
        bundledDeckUrl(entry),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    }
  });

  it("reuses exact prior imports without downloading, duplicating, or changing their IDs", async () => {
    const original = savedDecks(),
      download = fetcher(),
      parse = importer();
    const result = await loadBundledDecks(original, {
      fetcher: download,
      importer: parse,
    });
    expect(download).not.toHaveBeenCalled();
    expect(parse).not.toHaveBeenCalled();
    expect(result.added).toEqual([]);
    original.forEach((deck, i) => expect(result.decks[i]).toBe(deck));
    expect(mergeLibraryDecks(original, result.decks)).toHaveLength(6);
  });

  it("keeps successful and personal decks available after a failed download, then retries only the missing one", async () => {
    const original = savedDecks().slice(0, 4),
      download = fetcher();
    download.mockImplementationOnce(async () => ({ ok: false }));
    const first = await loadBundledDecks(original, {
      fetcher: download,
      importer: importer(),
    });
    expect(first.failed).toEqual([BUNDLED_DECKS[4].name]);
    expect(first.decks).toHaveLength(5);
    const personal = {
      ...deckFor(BUNDLED_DECKS[0]),
      id: "personal:id",
      packageId: "personal",
    };
    const library = mergeLibraryDecks([personal], original, first.decks);
    expect(library).toHaveLength(6);
    expect(library.at(-1)).toBe(personal);
    expect(isBundledDeck(personal)).toBe(false);
    const retry = fetcher();
    const result = await loadBundledDecks(library, {
      fetcher: retry,
      importer: importer(),
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(result.failed).toEqual([]);
    expect(mergeLibraryDecks(library, result.decks)).toHaveLength(7);
  });

  it("does not cache a wrong package or an incomplete public deck", async () => {
    const original = savedDecks().slice(1);
    for (const changed of [
      { ...deckFor(BUNDLED_DECKS[0]), packageId: "wrong-package" },
      { ...deckFor(BUNDLED_DECKS[0]), cards: [] },
    ]) {
      const result = await loadBundledDecks(original, {
        fetcher: fetcher(),
        importer: async () => ({ decks: [changed] }),
      });
      expect(result.added).toEqual([]);
      expect(result.failed).toEqual([BUNDLED_DECKS[0].name]);
    }
  });
});
