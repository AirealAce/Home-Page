import { useEffect, useMemo, useRef, useState } from "react";
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
  const question = useRef(null),
    answer = useRef(null),
    keyboard = useRef(null),
    [audioError, setAudioError] = useState(""),
    [keyboardActive, setKeyboardActive] = useState(true),
    [announcement, setAnnouncement] = useState(""),
    [repeat, setRepeat] = useState(0);
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
  const audio = session.revealed
    ? [...new Set([...front.audio, ...back.audio])]
    : front.audio;
  const summary = summarize(session),
    number = deck.cards.indexOf(card) + 1;
  const spokenCard = `Card ${number} of ${summary.total}. ${session.revealed ? "Answer" : "Question"}. ${questionText(session.revealed ? back.html : front.html) || "Audio card. Use Replay Audio to listen."}`;
  useEffect(() => {
    // Keep one DOM focus target throughout the keyboard study loop. Moving
    // between static question/answer groups makes JAWS leave Forms Mode.
    if (settings.shortcuts) {
      setKeyboardActive(true);
      if (document.activeElement !== keyboard.current)
        keyboard.current?.focus();
    } else (session.revealed ? answer : question).current?.focus();
    setAudioError("");
  }, [session.id, session.revision, session.revealed, settings.shortcuts]);
  useEffect(() => {
    setAnnouncement("");
    if (!settings.shortcuts || !keyboardActive || dialogOpen) return;
    // Populate an already-mounted live region, including when consecutive
    // cards have identical text or the user requests the same card again.
    const timer = setTimeout(() => setAnnouncement(spokenCard), 120);
    return () => clearTimeout(timer);
  }, [
    spokenCard,
    session.revision,
    repeat,
    settings.shortcuts,
    keyboardActive,
    dialogOpen,
  ]);
  function readCard() {
    setKeyboardActive(false);
    question.current?.focus();
  }
  function resumeKeyboard() {
    setKeyboardActive(true);
    keyboard.current?.focus();
    setRepeat((value) => value + 1);
  }
  useEffect(() => {
    stopAudio();
    if (settings.autoplay)
      replayAudio(session.revealed ? back.audio : front.audio, setAudioError);
    return stopAudio;
  }, [session.revision, session.revealed, settings.autoplay]);
  const canUndo = !!session.undoStack?.length;
  useStudyShortcuts({
    settings: { ...settings, shortcuts: settings.shortcuts && keyboardActive },
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
      {settings.shortcuts && (
        <div
          className="keyboard-study"
          role="application"
          aria-label="Keyboard study"
          aria-describedby="keyboard-study-help"
          tabIndex={0}
          ref={keyboard}
          onFocus={(event) => {
            if (event.target === event.currentTarget) {
              setKeyboardActive(true);
              setRepeat((value) => value + 1);
            }
          }}
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
          <p id="keyboard-study-help" className="small">
            Space shows the answer, then rates Good. Use 1–4 to rate and Ctrl+Z
            to undo. Card changes are announced here. Escape pauses shortcuts so
            you can read the card. Tab moves to the buttons.
          </p>
          <div className="button-row">
            <button onClick={resumeKeyboard}>Resume keyboard study</button>
            <button onClick={readCard}>Read card</button>
            <button onClick={resumeKeyboard}>
              Repeat current question or answer
            </button>
          </div>
        </div>
      )}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
      <div
        className="study-card"
        onFocusCapture={() => setKeyboardActive(false)}
      >
        <div className="card-caption">
          <span>
            Card {number} of {summary.total}
          </span>
          <span>
            {session.stats[card.id].presented > 1
              ? `Review · attempt ${session.stats[card.id].attempts + 1}`
              : "Take your time"}
          </span>
        </div>
        <div
          className="card-side"
          role="group"
          tabIndex={-1}
          ref={question}
          aria-labelledby="question-label"
          aria-describedby="question-content"
        >
          <h2 id="question-label">
            Question{" "}
            <span className="sr-only">
              — Card {number} of {summary.total}
            </span>
          </h2>
          <div
            id="question-content"
            className="card-content"
            dangerouslySetInnerHTML={{ __html: front.html }}
          />
        </div>
        {session.revealed && (
          <div
            className="card-side answer-side"
            role="group"
            tabIndex={-1}
            ref={answer}
            aria-labelledby="answer-label"
            aria-describedby="answer-content"
          >
            <h2 id="answer-label">Answer</h2>
            <div
              id="answer-content"
              className="card-content"
              dangerouslySetInnerHTML={{ __html: back.html }}
            />
          </div>
        )}
        {!!audio.length && (
          <div className="audio-controls">
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
      {!session.revealed ? (
        <div className="reveal">
          <button className="primary big-button" onClick={onReveal}>
            Show Answer {settings.shortcuts && <kbd>Space / Enter</kbd>}
          </button>
          <p className="small">Think it through. Reveal when you’re ready.</p>
        </div>
      ) : (
        <section className="ratings" aria-labelledby="rating-title">
          <h2 id="rating-title">How did you do?</h2>
          <div className="rating-grid">
            {RATINGS.map((rating, i) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
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
      )}
      <p className="shortcut-status small">
        Study shortcuts are{" "}
        {settings.shortcuts
          ? keyboardActive
            ? "on"
            : "paused for reading"
          : "off"}
        . Change them in Keyboard & settings.{" "}
        {settings.shortcuts &&
          "Space reveals the answer, then rates Good. Ctrl+Z undoes the last rating. Escape pauses shortcuts to read the card; Resume keyboard study starts them again. "}
        Again returns this card to the end of the queue.
      </p>
    </div>
  );
}
