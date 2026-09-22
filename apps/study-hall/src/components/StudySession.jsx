import { useEffect, useMemo, useRef, useState } from "react";
import { cardContent } from "../services/cardContent";
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
    [audioError, setAudioError] = useState("");
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
  useEffect(() => {
    (session.revealed ? answer : question).current?.focus();
    setAudioError("");
  }, [session.revision, session.revealed]);
  useEffect(() => {
    stopAudio();
    if (settings.autoplay)
      replayAudio(session.revealed ? back.audio : front.audio, setAudioError);
    return stopAudio;
  }, [session.revision, session.revealed, settings.autoplay]);
  const canUndo = !!session.undoStack?.length;
  useStudyShortcuts({
    settings,
    dialogOpen,
    canUndo,
    revealed: session.revealed,
    hasAudio: audio.length > 0,
    onReveal,
    onRate,
    onUndo,
    onReplay: () => replayAudio(audio, setAudioError),
  });
  const summary = summarize(session),
    number = deck.cards.indexOf(card) + 1;
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
      <div className="study-card">
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
        Study shortcuts are {settings.shortcuts ? "on" : "off"}. Change them in
        Keyboard & settings.{" "}
        {settings.shortcuts &&
          "Space reveals the answer, then rates Good. Ctrl+Z undoes the last rating. "}
        Again returns this card to the end of the queue.
      </p>
    </div>
  );
}
