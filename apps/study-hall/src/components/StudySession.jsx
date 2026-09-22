import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cardContent, questionText } from "../services/cardContent";
import { RATINGS, summarize } from "../services/studyEngine";
import { replayAudio, stopAudio } from "../services/audioService";
import { useStudyShortcuts } from "../hooks/useStudyShortcuts";
export default function StudySession({
  deck,
  session,
  onReveal,
  onRate,
  onUndo,
  onLibrary,
  settings,
  dialogOpen,
}) {
  const formatted = useRef(null),
    keyboard = useRef(null),
    [audioError, setAudioError] = useState(""),
    [keyboardActive, setKeyboardActive] = useState(true),
    [announcement, setAnnouncement] = useState(""),
    [repeatRequest, setRepeatRequest] = useState(0);
  const media = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(deck.media).map(([name, blob]) => [
          name,
          URL.createObjectURL(blob),
        ]),
      ),
    [deck],
  );
  useEffect(
    () => () => {
      Object.values(media).forEach(URL.revokeObjectURL);
      stopAudio();
    },
    [media],
  );
  const card = deck.cards.find((c) => c.id === session.queue[0]);
  const front = useMemo(() => cardContent(card.front, media), [card, media]);
  const back = useMemo(() => cardContent(card.back, media), [card, media]);
  const deckHasAudio = useMemo(
    () =>
      deck.cards.some((item) =>
        /\[sound:|<audio\b/i.test(item.front + item.back),
      ),
    [deck],
  );
  const audio = session.revealed
    ? [...new Set([...front.audio, ...back.audio])]
    : front.audio;
  const summary = summarize(session),
    number = deck.cards.indexOf(card) + 1;
  const readingText = useMemo(
    () =>
      questionText(session.revealed ? back.html : front.html, {
        preserveLines: true,
      }) ||
      (audio.length
        ? "Audio card. Use Replay Audio to listen."
        : "No text on this side of the card."),
    [front, back, session.revealed, audio.length],
  );
  const cardContext = `${session.revealed ? "Answer" : "Question"} — Card ${number} of ${summary.total}`;
  const readerText = `${cardContext}\n${readingText}`;
  const readingStart = cardContext.length + 1;
  function focusCurrentText() {
    const reader = keyboard.current;
    if (!reader) return;
    if (document.activeElement !== reader) reader.focus();
    reader.setSelectionRange(readingStart, readingStart);
    reader.scrollTop = 0;
  }
  useLayoutEffect(() => {
    // Start at the card text, with its context one native line above it.
    // Announce changes separately; selection alone is unreliable in JAWS.
    setKeyboardActive(settings.shortcuts);
    setAudioError("");
  }, [
    session.id,
    session.revision,
    session.revealed,
    settings.shortcuts,
    readingText,
    readingStart,
  ]);
  useLayoutEffect(() => {
    if (settings.shortcuts && keyboardActive) focusCurrentText();
    else {
      formatted.current?.focus();
      if (formatted.current) formatted.current.scrollTop = 0;
    }
  }, [
    session.id,
    session.revision,
    session.revealed,
    settings.shortcuts,
    keyboardActive,
    readingText,
    readingStart,
  ]);
  useEffect(() => {
    // Mount the empty live region before inserting text. Clearing it also
    // lets Repeat announce identical text. Coalesce fast changes so an old
    // question cannot be announced after its answer or the next card.
    setAnnouncement("");
    if (!settings.shortcuts || !keyboardActive || dialogOpen) return;
    const timer = setTimeout(() => {
      if (document.activeElement !== keyboard.current) return;
      setAnnouncement(readingText);
    }, 150);
    return () => clearTimeout(timer);
  }, [
    session.id,
    session.revision,
    session.revealed,
    readingText,
    settings.shortcuts,
    keyboardActive,
    dialogOpen,
    repeatRequest,
  ]);
  function readCard() {
    setKeyboardActive(false);
  }
  function resumeKeyboard() {
    setKeyboardActive(true);
    focusCurrentText();
    setRepeatRequest((request) => request + 1);
  }
  useEffect(() => {
    const reader = keyboard.current;
    if (!reader) return;
    // Chromium's native readonly textarea scrolls instead of moving its
    // caret. Keep native text navigation, expose aria-readonly, and cancel
    // every edit through beforeinput; onChange also guards noncancelable edits.
    const preventEdit = (event) => event.preventDefault();
    reader.addEventListener("beforeinput", preventEdit);
    return () => reader.removeEventListener("beforeinput", preventEdit);
  }, [settings.shortcuts]);
  useEffect(() => {
    stopAudio();
    if (settings.autoplay)
      replayAudio(session.revealed ? back.audio : front.audio, setAudioError);
    return stopAudio;
  }, [session.revision, session.revealed, settings.autoplay]);
  const canUndo = !!session.undoStack?.length;
  useStudyShortcuts({
    settings: { ...settings, shortcuts: settings.shortcuts && keyboardActive },
    studyTextRef: keyboard,
    dialogOpen,
    canUndo,
    revealed: session.revealed,
    hasAudio: audio.length > 0,
    onReveal,
    onRate,
    onUndo,
    onReplay: () => replayAudio(audio, setAudioError),
  });
  return (
    <div className="study-view">
      <div
        className="sr-only"
        id="study-announcement"
        aria-live="assertive"
        aria-atomic="true"
        aria-relevant="additions text"
      >
        {announcement}
      </div>
      <div className="study-top">
        <button className="text-button" onClick={onLibrary}>
          ← Pause & return to library
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-keyshortcuts={
            settings.shortcuts ? "Control+z Meta+z" : undefined
          }
        >
          Undo last rating {settings.shortcuts && <kbd>Ctrl+Z</kbd>}
        </button>
        <span className="small">
          {summary.completed} of {summary.total} completed
        </span>
      </div>
      <p className="eyebrow">Now studying</p>
      <h1 className="study-title">{deck.name}</h1>
      <label className="sr-only" htmlFor="study-progress">
        Successfully completed cards
      </label>
      <progress
        id="study-progress"
        value={summary.completed}
        max={summary.total}
      />
      <div className="study-panel">
        {settings.shortcuts && (
          <p id="keyboard-study-help" className="small">
            Space shows the answer, then rates Good. Use 1–4 to rate and Ctrl+Z
            to undo. Card text is announced automatically. Up Arrow at the start
            of the text reads the card label and number. Arrow keys move through
            the text; Ctrl+Home returns to the top. Escape opens the formatted
            view in this pane and pauses shortcuts. Tab moves to the buttons.
          </p>
        )}
        <div className="study-pane">
          {settings.shortcuts && (
            <div
              className="keyboard-study"
              role="application"
              aria-label="Keyboard study"
              hidden={!keyboardActive}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape" &&
                  !event.ctrlKey &&
                  !event.altKey &&
                  !event.metaKey
                ) {
                  event.preventDefault();
                  readCard();
                }
              }}
            >
              <label htmlFor="study-reader" className="sr-only">
                Card reader
              </label>
              <textarea
                id="study-reader"
                className="study-reader"
                ref={keyboard}
                value={readerText}
                aria-readonly="true"
                inputMode="none"
                spellCheck={false}
                rows={18}
                aria-describedby="keyboard-study-help"
                onFocus={() => setKeyboardActive(true)}
                onChange={(event) => {
                  event.currentTarget.value = readerText;
                }}
                onPaste={(event) => event.preventDefault()}
                onCut={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
              />
            </div>
          )}
          {(!settings.shortcuts || !keyboardActive) && (
            <div
              className="formatted-reader"
              role="group"
              tabIndex={-1}
              ref={formatted}
              aria-labelledby="card-label"
              aria-describedby="card-content"
            >
              <h2 id="card-label">{cardContext}</h2>
              <div
                id="card-content"
                className="card-content"
                dangerouslySetInnerHTML={{
                  __html: session.revealed ? back.html : front.html,
                }}
              />
            </div>
          )}
        </div>
        {settings.shortcuts && (
          <div className="button-row">
            <button onClick={resumeKeyboard}>Resume keyboard study</button>
            <button onClick={readCard}>Read formatted card</button>
            <button onClick={resumeKeyboard}>
              Repeat current question or answer
            </button>
          </div>
        )}
        <div className="reveal">
          <button
            className="primary big-button"
            onClick={onReveal}
            disabled={session.revealed}
          >
            Show Answer {settings.shortcuts && <kbd>Space / Enter</kbd>}
          </button>
        </div>
        <section className="ratings" aria-labelledby="rating-title">
          <h2 id="rating-title">Rate your answer</h2>
          <div className="rating-grid">
            {RATINGS.map((rating, i) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                disabled={!session.revealed}
                aria-label={`${rating[0].toUpperCase() + rating.slice(1)}${settings.shortcuts ? `, keyboard shortcut ${settings.keys[rating]}${rating === "good" ? " or Space" : ""}` : ""}`}
              >
                <span>
                  {rating[0].toUpperCase() + rating.slice(1)}{" "}
                  {settings.shortcuts && (
                    <kbd>
                      {settings.keys[rating].toUpperCase()}
                      {rating === "good" ? " / Space" : ""}
                    </kbd>
                  )}
                </span>
                <small>
                  {
                    [
                      "Try again later",
                      "Got it, with effort",
                      "Got it right",
                      "Knew it easily",
                    ][i]
                  }
                </small>
              </button>
            ))}
          </div>
        </section>
        {deckHasAudio && (
          <div
            className="audio-controls"
            style={{ visibility: audio.length ? "visible" : "hidden" }}
          >
            <button onClick={() => replayAudio(audio, setAudioError)}>
              ↻ Replay Audio
              {settings.shortcuts && (
                <kbd>{settings.keys.replay.toUpperCase()}</kbd>
              )}
            </button>
            <button onClick={stopAudio}>Stop audio</button>
          </div>
        )}
        {audioError && (
          <p role="alert" className="notice">
            {audioError}
          </p>
        )}
      </div>
      <p className="shortcut-status small">
        Study shortcuts are{" "}
        {settings.shortcuts
          ? keyboardActive
            ? "on"
            : "paused for reading"
          : "off"}
        . Change them in Keyboard & settings.{" "}
        {settings.shortcuts &&
          "Space reveals the answer, then rates Good. Ctrl+Z undoes the last rating. Escape switches this pane to its formatted view; Resume keyboard study returns to the reader. "}
        Again returns this card to the end of the queue.
      </p>
    </div>
  );
}
