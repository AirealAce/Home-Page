import { useEffect } from "react";
import { studyShortcut } from "../services/keyboardShortcuts";
export function useStudyShortcuts(options) {
  useEffect(() => {
    const keydown = (event) => {
      const action = studyShortcut(event, options);
      if (!action) return;
      event.preventDefault();
      if (action === "reveal") options.onReveal();
      else if (action === "replay") options.onReplay();
      else if (action === "undo") options.onUndo();
      else options.onRate(action);
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [options]);
}
