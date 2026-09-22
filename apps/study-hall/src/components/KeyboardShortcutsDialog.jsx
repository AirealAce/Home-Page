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
        default. You can turn them off here if you prefer your screen reader’s
        usual navigation keys.
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
          the answer when the question has focus. After revealing,{" "}
          <kbd>Space</kbd> rates Good. <kbd>1</kbd> Again, <kbd>2</kbd> Hard,{" "}
          <kbd>3</kbd> Good, <kbd>4</kbd> Easy are the default rating keys.{" "}
          <kbd>Ctrl+Z</kbd> (or <kbd>⌘Z</kbd> on Mac) undoes the last rating and
          returns to that card with its answer shown. Repeated undo steps back
          through this session’s ratings.
        </p>
        <p>
          Shortcuts never run in typing fields or dialogs. Buttons and links
          keep their normal Space/Enter behavior. Other modifier-key
          combinations are left alone.
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
          JAWS or NVDA may reserve these keys in browse mode. Use the buttons,
          or switch to your screen reader’s forms/focus mode to send study
          shortcuts to the page. No application mode is forced.
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
