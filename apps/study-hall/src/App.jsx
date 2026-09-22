import { useEffect, useRef, useState } from "react";
import DeckLibrary from "./components/DeckLibrary";
import StudySession from "./components/StudySession";
import StudyResults from "./components/StudyResults";
import KeyboardShortcutsDialog from "./components/KeyboardShortcutsDialog";
import { storageService as storage } from "./services/storageService";
import { importApkg } from "./services/apkgParser";
import { DEFAULT_KEYS, rateCard, startSession } from "./services/studyEngine";
const DEFAULT_SETTINGS = {
  shortcuts: false,
  autoplay: false,
  keys: DEFAULT_KEYS,
};
export default function App() {
  const [decks, setDecks] = useState([]),
    [history, setHistory] = useState([]),
    [active, setActive] = useState(null),
    [view, setView] = useState("library"),
    [result, setResult] = useState(null),
    [settings, setSettings] = useState(DEFAULT_SETTINGS),
    [dialog, setDialog] = useState(false),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("Loading your library…"),
    [error, setError] = useState("");
  const main = useRef(null),
    saveQueue = useRef(Promise.resolve()),
    ratingLock = useRef(false);
  function save(operation) {
    saveQueue.current = saveQueue.current
      .then(operation)
      .catch(() =>
        setError(
          "Your latest changes could not be saved in this browser. Free some storage and try again. Keep this tab open to continue this session.",
        ),
      );
    return saveQueue.current;
  }
  useEffect(() => {
    Promise.all([
      storage.listDecks(),
      storage.listResults(),
      storage.getSetting("settings"),
      storage.getSetting("active"),
    ])
      .then(([d, h, s, a]) => {
        setDecks(d);
        setHistory(h.sort((a, b) => b.completedAt - a.completedAt));
        if (s)
          setSettings({
            ...DEFAULT_SETTINGS,
            ...s,
            keys: { ...DEFAULT_KEYS, ...s.keys },
          });
        if (
          a?.queue?.length &&
          d.some((x) => x.id === a.deckId) &&
          !h.some((r) => r.id === a.id)
        )
          setActive(a);
        setStatus("");
        setReady(true);
      })
      .catch(() => {
        setError(
          "Local storage is unavailable. Allow site storage or try a regular browser window, then reload.",
        );
        setStatus("");
      });
  }, []);
  useEffect(() => {
    document.title = `${view === "library" ? "Choose a Deck" : view === "study" ? "Study Session" : "Study Results"} · Study Hall`;
  }, [view]);
  async function onImport(files) {
    setBusy(true);
    setError("");
    let count = 0;
    const errors = [],
      warnings = [];
    for (const file of files) {
      try {
        setStatus(`Importing ${file.name}…`);
        const imported = await importApkg(file);
        await storage.saveDecks(imported.decks);
        count += imported.decks.length;
        warnings.push(...imported.warnings);
      } catch (e) {
        errors.push(`${file.name}: ${e.message}`);
      }
    }
    try {
      setDecks(await storage.listDecks());
    } catch {
      errors.push("Could not reload the library. Please reload the page.");
    }
    setStatus(
      `${count} ${count === 1 ? "deck" : "decks"} imported. ${[...new Set(warnings)].join(" ")}`,
    );
    setError(errors.join(" "));
    setBusy(false);
  }
  function start(deck, fresh = false) {
    const session =
      !fresh && active?.deckId === deck.id && active.queue.length
        ? active
        : startSession(deck);
    setActive(session);
    setView("study");
    setStatus("");
    setError("");
    save(() => storage.setSetting("active", session));
    save(() => storage.setSetting("lastDeck", deck.id));
  }
  function library() {
    setView("library");
    setStatus("");
    setTimeout(() => main.current?.focus(), 0);
  }
  function reveal() {
    if (!active.revealed) {
      const next = { ...active, revealed: true };
      setActive(next);
      save(() => storage.setSetting("active", next));
    }
  }
  function rate(rating) {
    if (ratingLock.current) return;
    ratingLock.current = true;
    queueMicrotask(() => {
      ratingLock.current = false;
    });
    const next = rateCard(active, rating);
    if (next === active) return;
    setActive(next);
    if (!next.queue.length) {
      setResult(next);
      setView("results");
      setHistory((h) => [next, ...h.filter((r) => r.id !== next.id)]);
      save(async () => {
        await storage.saveResult(next);
        await storage.setSetting("active", null);
      });
    } else save(() => storage.setSetting("active", next));
  }
  const currentDeck = decks.find(
    (d) => d.id === (view === "results" ? result?.deckId : active?.deckId),
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <a
          href="./"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            library();
          }}
          aria-label="Study Hall, deck library"
        >
          <span className="brand-mark" aria-hidden="true">
            S<span>H</span>
          </span>
          <span>
            STUDY HALL
            <span className="brand-sub">A FRESH TAKE ON FLASHCARDS</span>
          </span>
        </a>
        <nav aria-label="Main">
          <button
            className="nav-button"
            onClick={library}
            aria-current={view === "library" ? "page" : undefined}
          >
            Library
          </button>
          <button className="nav-button" onClick={() => setDialog(true)}>
            Keyboard & settings
          </button>
        </nav>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        <div className="status" role="status" aria-live="polite">
          {status}
        </div>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        {view === "library" && (
          <DeckLibrary
            decks={decks}
            busy={busy}
            ready={ready}
            onImport={onImport}
            onStart={start}
            active={active}
            history={history}
            onResults={(r) => {
              setResult(r);
              setView("results");
            }}
          />
        )}
        {view === "study" && currentDeck && (
          <StudySession
            deck={currentDeck}
            session={active}
            onReveal={reveal}
            onRate={rate}
            onLibrary={library}
            settings={settings}
            dialogOpen={dialog}
          />
        )}
        {view === "results" && currentDeck && (
          <StudyResults
            result={result}
            deck={currentDeck}
            onLibrary={library}
            onRestart={() => start(currentDeck, true)}
          />
        )}
      </main>
      <footer className="site-footer">
        <span>
          STUDY HALL <span aria-hidden="true">✦</span> A little better, every
          day.
        </span>
        <span>Made for keyboards, screen readers & curious minds.</span>
      </footer>
      {dialog && (
        <KeyboardShortcutsDialog
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            save(() => storage.setSetting("settings", s));
          }}
          onClose={() => setDialog(false)}
        />
      )}
    </>
  );
}
