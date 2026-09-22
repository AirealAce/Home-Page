import { useEffect, useRef, useState } from "react";
import { DEFAULT_KEYS } from "../services/studyEngine";
export default function KeyboardShortcutsDialog({ settings, onSave, onClose }) {
  const ref = useRef(null),
    [error, setError] = useState("");
  useEffect(() => {
    ref.current.showModal();
  }, []);
  function save(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const keys = Object.fromEntries(
      Object.keys(DEFAULT_KEYS).map((k) => [
        k,
        String(data.get(k)).trim().toLowerCase(),
      ]),
    );
    if (
      Object.values(keys).some((k) => !/^[a-z0-9]$/i.test(k)) ||
      new Set(Object.values(keys)).size !== 5
    ) {
      setError("Use a different single letter or number for each shortcut.");
      return;
    }
    onSave({
      shortcuts: data.get("shortcuts") === "on",
      autoplay: data.get("autoplay") === "on",
      keys,
    });
    ref.current.close();
  }
  return (
    <dialog ref={ref} aria-labelledby="dialog-title" onClose={onClose}>
      <div className="dialog-heading">
        <span className="eyebrow">Make yourself comfortable</span>
        <button
          aria-label="Close keyboard shortcuts and settings"
          onClick={() => ref.current.close()}
        >
          ×
        </button>
      </div>
      <h2 id="dialog-title">Keyboard & settings</h2>
      <p>
        Every study action also has a visible button. Shortcuts are on by
        default. Keyboard study announces each new question or answer and keeps
        the reader at its beginning. Arrow keys move through its text. You can
        turn shortcuts off to use ordinary page navigation throughout.
      </p>
      <form onSubmit={save}>
        <label className="check">
          <input
            name="shortcuts"
            type="checkbox"
            defaultChecked={settings.shortcuts}
          />{" "}
          Enable study shortcuts
        </label>
        <label className="check">
          <input
            name="autoplay"
            type="checkbox"
            defaultChecked={settings.autoplay}
          />{" "}
          Play card audio automatically
        </label>
        <p>
          With shortcuts enabled: <kbd>Space</kbd> or <kbd>Enter</kbd> reveals
          the answer in Keyboard study. After revealing, <kbd>Space</kbd> rates
          Good. <kbd>1</kbd> Again, <kbd>2</kbd> Hard, <kbd>3</kbd> Good,{" "}
          <kbd>4</kbd> Easy are the default rating keys. <kbd>Ctrl+Z</kbd> (or{" "}
          <kbd>⌘Z</kbd> on Mac) undoes the last rating and returns to that card
          with its answer shown. Repeated undo steps back through this session’s
          ratings.
        </p>
        <p>
          Study shortcuts work in the protected card reader, but never in typing
          fields or dialogs. Buttons and links keep their normal Space/Enter
          behavior. Other modifier-key combinations are left alone.
        </p>
        <fieldset>
          <legend>Change rating and audio shortcuts</legend>
          <div className="key-fields">
            {Object.keys(DEFAULT_KEYS).map((key) => (
              <label key={key}>
                {key === "replay"
                  ? "Replay audio"
                  : key[0].toUpperCase() + key.slice(1)}
                <input
                  name={key}
                  maxLength={1}
                  defaultValue={settings.keys[key]}
                  autoComplete="off"
                  aria-describedby="key-note"
                />
              </label>
            ))}
          </div>
          <p id="key-note" className="small">
            Use one unique letter or number per action.
          </p>
        </fieldset>
        <p>
          The Keyboard study area asks JAWS and NVDA to pass study keys to the
          app. Focus stays in the same text reader as cards change. Each new
          question or revealed answer is announced automatically, without a
          visible caret or highlight. Use arrow keys to read, Shift+arrows to
          select, Ctrl+Home to return to the beginning, and Ctrl+A then Ctrl+C
          to copy the whole card side. Card text cannot be edited. Press Escape
          or choose Read card to pause shortcuts and read the full question and
          answer with normal screen reader navigation. Choose Resume keyboard
          study to return, or Repeat current question or answer to hear it
          again. Tab and Shift+Tab remain available to leave the area.
        </p>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          Save settings
        </button>
      </form>
    </dialog>
  );
}
