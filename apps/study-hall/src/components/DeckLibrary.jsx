import { useRef } from "react";
export default function DeckLibrary({
  decks,
  busy,
  onImport,
  onStart,
  active,
  history,
  onResults,
  ready,
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
            <p className="eyebrow">Your collection</p>
            <h2 id="library-title">
              Deck library <span className="count">{decks.length}</span>
            </h2>
          </div>
          <span className="small">Saved on this device</span>
        </div>
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
            <p>Bring an Anki deck. We’ll take it from here.</p>
            <button
              className="primary"
              disabled={busy || !ready}
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
              disabled={busy || !ready}
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
        {decks.length === 0 && !busy && (
          <p className="empty-note">
            Your library is ready for its first deck. Choose one or more .apkg
            files to get started.
          </p>
        )}
      </section>
      <aside className="local-note">
        <span aria-hidden="true">◎</span>
        <div>
          <h2>A space that stays yours</h2>
          <p>
            Decks, media, and progress stay in this browser. No account needed.
            Clearing this site’s browser data removes them, so keep your
            original Anki files.
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
