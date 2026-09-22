import { describe, it, expect } from "vitest";
import { studyShortcut } from "../src/services/keyboardShortcuts";
import { DEFAULT_SETTINGS, loadPreferences } from "../src/services/preferences";
const options = {
  settings: DEFAULT_SETTINGS,
  revealed: false,
  canUndo: true,
  hasAudio: true,
};
const event = (key, extra = {}) => ({
  key,
  target: document.createElement("div"),
  ...extra,
});
describe("default study shortcuts", () => {
  it("enables shortcuts by default and respects a saved opt-out or remapping", () => {
    expect(loadPreferences().shortcuts).toBe(true);
    expect(loadPreferences({ shortcuts: false }).shortcuts).toBe(false);
    expect(loadPreferences({ keys: { good: "g" } }).keys).toMatchObject({
      again: "1",
      good: "g",
    });
  });
  it("uses Space to reveal, then Space to rate Good; Enter reveals only", () => {
    expect(studyShortcut(event(" "), options)).toBe("reveal");
    expect(studyShortcut(event(" "), { ...options, revealed: true })).toBe(
      "good",
    );
    expect(studyShortcut(event("Enter"), options)).toBe("reveal");
    expect(
      studyShortcut(event("Enter"), { ...options, revealed: true }),
    ).toBeNull();
  });
  it.each([
    ["1", "again"],
    ["2", "hard"],
    ["3", "good"],
    ["4", "easy"],
  ])("maps %s to %s only after revealing", (key, rating) => {
    expect(studyShortcut(event(key), options)).toBeNull();
    expect(studyShortcut(event(key), { ...options, revealed: true })).toBe(
      rating,
    );
  });
  it("supports Ctrl+Z and Cmd+Z on either side and immediately after completion", () => {
    for (const extra of [{ ctrlKey: true }, { metaKey: true }]) {
      expect(studyShortcut(event("z", extra), options)).toBe("undo");
      expect(
        studyShortcut(event("z", extra), { ...options, studying: false }),
      ).toBe("undo");
    }
    expect(
      studyShortcut(event("z", { ctrlKey: true }), {
        ...options,
        canUndo: false,
      }),
    ).toBeNull();
    expect(
      studyShortcut(event(" "), { ...options, studying: false }),
    ).toBeNull();
  });
  it("never overrides typing, native button activation, dialogs, or modified shortcuts", () => {
    for (const markup of [
      "<input>",
      "<textarea></textarea>",
      "<select></select>",
      '<div contenteditable=""></div>',
      '<div contenteditable="plaintext-only"></div>',
      '<div role="textbox"></div>',
    ]) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = markup;
      expect(
        studyShortcut(event(" ", { target: wrapper.firstChild }), options),
      ).toBeNull();
      expect(
        studyShortcut(
          event("z", { target: wrapper.firstChild, ctrlKey: true }),
          options,
        ),
      ).toBeNull();
    }
    expect(
      studyShortcut(
        event(" ", { target: document.createElement("button") }),
        options,
      ),
    ).toBeNull();
    expect(
      studyShortcut(event("3", { target: document.createElement("button") }), {
        ...options,
        revealed: true,
      }),
    ).toBe("good");
    expect(
      studyShortcut(event("3"), {
        ...options,
        dialogOpen: true,
        revealed: true,
      }),
    ).toBeNull();
    for (const extra of [
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { shiftKey: true },
      { repeat: true },
      { isComposing: true },
      { defaultPrevented: true },
    ]) {
      expect(studyShortcut(event(" ", extra), options)).toBeNull();
    }
    expect(
      studyShortcut(event("z", { ctrlKey: true, shiftKey: true }), options),
    ).toBeNull();
  });
  it("can disable every shortcut, including undo", () => {
    const disabled = {
      ...options,
      settings: { ...DEFAULT_SETTINGS, shortcuts: false },
      revealed: true,
    };
    expect(studyShortcut(event(" "), disabled)).toBeNull();
    expect(studyShortcut(event("1"), disabled)).toBeNull();
    expect(studyShortcut(event("z", { ctrlKey: true }), disabled)).toBeNull();
  });
  it("permits study keys only in the explicitly registered read-only card reader", () => {
    const reader = document.createElement("textarea");
    reader.setAttribute("aria-readonly", "true");
    const reading = { ...options, studyTextControl: reader, revealed: true };
    expect(studyShortcut(event(" ", { target: reader }), reading)).toBe("good");
    expect(studyShortcut(event("1", { target: reader }), reading)).toBe(
      "again",
    );
    expect(
      studyShortcut(event("z", { target: reader, ctrlKey: true }), reading),
    ).toBe("undo");
    expect(studyShortcut(event(" ", { target: reader }), options)).toBeNull();
    reader.removeAttribute("aria-readonly");
    expect(studyShortcut(event(" ", { target: reader }), reading)).toBeNull();
    reader.setAttribute("aria-readonly", "true");
    expect(
      studyShortcut(event(" ", { target: reader }), {
        ...reading,
        dialogOpen: true,
      }),
    ).toBeNull();
  });
  it("keeps remapped keys and audio working without changing Space for Good", () => {
    const remapped = {
      ...options,
      revealed: true,
      settings: loadPreferences({ keys: { good: "g" } }),
    };
    expect(studyShortcut(event("3"), remapped)).toBeNull();
    expect(studyShortcut(event("g"), remapped)).toBe("good");
    expect(studyShortcut(event(" "), remapped)).toBe("good");
    expect(studyShortcut(event("r"), options)).toBe("replay");
    expect(
      studyShortcut(event("r"), { ...options, hasAudio: false }),
    ).toBeNull();
  });
});
