import { RATINGS } from "./studyEngine";
export function studyShortcut(
  event,
  {
    settings,
    dialogOpen,
    canUndo,
    studying = true,
    revealed,
    hasAudio,
    studyTextControl,
  },
) {
  if (
    !settings.shortcuts ||
    dialogOpen ||
    event.repeat ||
    event.defaultPrevented ||
    event.isComposing
  )
    return null;
  const target = event.target;
  // Only the explicitly supplied, read-only card reader permits study keys.
  // Other inputs (including unrelated read-only fields) keep native behavior.
  const isStudyReader =
    target === studyTextControl &&
    target?.tagName === "TEXTAREA" &&
    target.getAttribute("aria-readonly") === "true";
  if (
    !isStudyReader &&
    (target?.isContentEditable ||
      target?.closest?.(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],dialog',
      ))
  )
    return null;
  const key = event.key.toLowerCase();
  if (
    key === "z" &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey
  )
    return canUndo ? "undo" : null;
  if (
    !studying ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey
  )
    return null;
  // Keep native Space/Enter activation on controls and links.
  if ((key === " " || key === "enter") && target?.closest?.("button,a"))
    return null;
  if (key === " ") return revealed ? "good" : "reveal";
  if (key === "enter" && !revealed) return "reveal";
  if (key === settings.keys.replay && hasAudio) return "replay";
  return revealed
    ? RATINGS.find((rating) => settings.keys[rating] === key) || null
    : null;
}
