import { useEffect, useRef } from "react";
import { summarize, RATINGS } from "../services/studyEngine";
import { questionText } from "../services/cardContent";
import { useStudyShortcuts } from "../hooks/useStudyShortcuts";
export default function StudyResults({
  result,
  deck,
  onLibrary,
  onRestart,
  onUndo,
  canUndo,
  settings,
  dialogOpen,
}) {
  const heading = useRef(null),
    summary = summarize(result);
  useEffect(() => heading.current?.focus(), [result.id]);
  useStudyShortcuts({ settings, dialogOpen, canUndo, studying: false, onUndo });
  return (
    <div className="results">
      <p className="eyebrow">One stack wiser</p>
      <h1 ref={heading} tabIndex={-1}>
        Study Complete{" "}
        <span className="sr-only">. Score: {summary.score}%.</span>
      </h1>
      <p className="intro">{result.deckName}</p>
      <div className="results-summary">
        <div className="score-panel">
          <span className="eyebrow">First-attempt accuracy</span>
          <p>
            Score: <strong>{summary.score}%</strong>
          </p>
          <span>
            {summary.first} of {summary.total} cards right on the first attempt
          </span>
        </div>
        <dl className="stats">
          <div>
            <dt>Cards studied</dt>
            <dd>{summary.total}</dd>
          </div>
          <div>
            <dt>Total attempts</dt>
            <dd>{summary.attempts}</dd>
          </div>
          <div>
            <dt>Average attempts per card</dt>
            <dd>{summary.average}</dd>
          </div>
          <div>
            <dt>First-attempt correct</dt>
            <dd>{summary.first}</dd>
          </div>
        </dl>
      </div>
      <p className="small">
        The score counts cards completed without an Again response. Hard, Good,
        and Easy all count as successful. This is a self-assessment, not an exam
        score.
      </p>
      <dl className="rating-summary">
        {RATINGS.map((r) => (
          <div key={r}>
            <dt>{r[0].toUpperCase() + r.slice(1)} responses</dt>
            <dd>{summary[r]}</dd>
          </div>
        ))}
      </dl>
      <div className="button-row">
        <button className="primary" onClick={onRestart}>
          Study this deck again
        </button>
        <button onClick={onLibrary}>Back to library</button>
        {canUndo && (
          <button
            onClick={onUndo}
            aria-keyshortcuts={
              settings.shortcuts ? "Control+z Meta+z" : undefined
            }
          >
            Undo last rating {settings.shortcuts && <kbd>Ctrl+Z</kbd>}
          </button>
        )}
      </div>
      <h2>Every card, every attempt</h2>
      <p className="small">
        Attempts includes the final successful response. Presented counts each
        time a question appeared.
      </p>
      <div
        className="table-scroll"
        role="region"
        aria-label="Card results, scroll horizontally if needed"
        tabIndex={0}
      >
        <table>
          <caption>Results for every card in {result.deckName}</caption>
          <thead>
            <tr>
              {[
                "#",
                "Question",
                "Presented",
                "Attempts",
                "Again",
                "Hard",
                "Good",
                "Easy",
                "Final result",
              ].map((title) => (
                <th scope="col" key={title}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deck.cards.map((card, i) => {
              const row = result.stats[card.id];
              return (
                <tr key={card.id}>
                  <th scope="row">{i + 1}</th>
                  <td>{questionText(card.front) || "Media question"}</td>
                  <td>{row.presented}</td>
                  <td>{row.attempts}</td>
                  {RATINGS.map((r) => (
                    <td key={r}>{row[r]}</td>
                  ))}
                  <td className="capitalize">{row.finalRating}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
