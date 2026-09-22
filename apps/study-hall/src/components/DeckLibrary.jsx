import { useRef } from "react";
import {
  BUNDLED_DECKS,
  bundledDeckUrl,
  isBundledDeck,
} from "../data/bundledDecks";
export default function DeckLibrary({
  decks,
  busy,
  onImport,
  onStart,
  active,
  history,
  onResults,
  ready,
  loadingBundled,
  bundledFailures = [],
  onRetryBundled,
}) {
  const file = useRef(null);
  return (
    <>
      <section className="library-hero">
        <div>
          <p className="eyebrow">A little practice. A little progress.</p>
          <h1>
            Choose a Deck
            <span className="heading-dot" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="intro">
            Big ideas, one card at a time.
            <br />
            Your own quiet corner of the study hall.
          </p>
        </div>
        <div className="card-drawing" aria-hidden="true">
          <div className="draw-card back-card" />
          <div className="draw-card front-card">
            <span className="star">✦</span>
            <span className="eyes">
              <i />
              <i />
            </span>
            <span className="smile" />
            <span className="card-line" />
          </div>
          <span className="spark one">✧</span>
          <span className="spark two">✦</span>
          <span className="drawing-label">LET’S LEARN SOMETHING.</span>
        </div>
      </section>
      <section aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ready to study</p>
            <h2 id="library-title">
              Deck library <span className="count">{decks.length}</span>
            </h2>
          </div>
          <span className="small">
            {BUNDLED_DECKS.length} CPACC decks ·{" "}
            {BUNDLED_DECKS.reduce((total, deck) => total + deck.cardCount, 0)}{" "}
            cards included
          </span>
        </div>
        {loadingBundled && (
          <p className="small">Loading included CPACC decks…</p>
        )}
        {bundledFailures.length > 0 && (
          <div className="notice">
            <p role="alert">
              Could not load: {bundledFailures.join(", ")}. Check your
              connection and retry. Any decks already loaded are still
              available.
            </p>
            <button disabled={loadingBundled} onClick={onRetryBundled}>
              {loadingBundled
                ? "Loading CPACC decks…"
                : "Retry loading CPACC decks"}
            </button>
          </div>
        )}
        <div className="deck-grid">
          {decks.map((deck, i) => (
            <button
              className="deck-button"
              key={deck.id}
              onClick={() => onStart(deck)}
            >
              <span className="deck-top">
                <span className="deck-index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="deck-tag">{deck.cards.length} cards</span>
              </span>
              <span className="deck-name">{deck.name}</span>
              <span className="small">
                {isBundledDeck(deck)
                  ? "Included with this site"
                  : "Imported on this device"}
              </span>
              <span className="deck-action">
                {active?.deckId === deck.id && active.queue.length
                  ? "Resume studying"
                  : "Start studying"}
                <span aria-hidden="true">↗</span>
              </span>
            </button>
          ))}
          <div className="import-tile">
            <span className="import-icon" aria-hidden="true">
              ＋
            </span>
            <h3>A new stack of possibilities</h3>
            <p>
              Add your own Anki decks. Personal imports stay on this device.
            </p>
            <button
              className="primary"
              disabled={busy || !ready || loadingBundled}
              onClick={() => file.current.click()}
            >
              {busy ? "Importing…" : "Import Anki Deck"}
            </button>
            <label className="file-label" htmlFor="deck-file">
              Or choose .apkg files
            </label>
            <input
              ref={file}
              id="deck-file"
              type="file"
              accept=".apkg"
              multiple
              disabled={busy || !ready || loadingBundled}
              onChange={(e) => {
                onImport([...e.target.files]);
                e.target.value = "";
              }}
            />
            <span className="small">
              Up to 100 MB per file · stored locally
            </span>
          </div>
        </div>
        {decks.length === 0 && ready && !busy && !loadingBundled && (
          <p className="empty-note">
            The included decks have not loaded yet. Retry above, or import your
            own .apkg files.
          </p>
        )}
        <details className="deck-downloads">
          <summary>Download the CPACC Anki files</summary>
          <p className="small">
            These same decks are included above, ready to study.
          </p>
          <ul>
            {BUNDLED_DECKS.map((deck) => (
              <li key={deck.packageId}>
                <a href={bundledDeckUrl(deck)} download={deck.fileName}>
                  {deck.name} (.apkg)
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <aside className="local-note">
        <span aria-hidden="true">◎</span>
        <div>
          <h2>A space that stays yours</h2>
          <p>
            The CPACC decks are available to everyone. Your personal imports,
            progress, and settings are saved only in this browser. Clearing
            browser data removes your imports and progress; the included CPACC
            decks load again automatically. No account needed.
          </p>
        </div>
      </aside>
      {active?.queue.length > 0 && (
        <p className="small">
          Your {active.deckName} session is paused. Choosing a different deck
          starts a new session and replaces this paused session.
        </p>
      )}
      {history.length > 0 && (
        <section className="history" aria-labelledby="history-title">
          <h2 id="history-title">Recently studied</h2>
          <ul>
            {history.slice(0, 8).map((result) => (
              <li key={result.id}>
                <button
                  className="history-button"
                  onClick={() => onResults(result)}
                >
                  <span>{result.deckName}</span>
                  <span>
                    {new Date(result.completedAt).toLocaleDateString()} · View
                    results <span aria-hidden="true">↗</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
