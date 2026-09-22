import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudySession from "../src/components/StudySession";
import { DEFAULT_SETTINGS } from "../src/services/preferences";
import {
  startSession,
  rateCard,
  undoRating,
} from "../src/services/studyEngine";

const deck = {
  id: "focus-test",
  name: "Focus test",
  media: {},
  cards: [
    { id: "a", front: "First question", back: "First answer" },
    { id: "b", front: "Second question", back: "Second answer" },
  ],
};
function Harness({ settings = DEFAULT_SETTINGS }) {
  const [session, setSession] = useState(() => startSession(deck));
  return (
    <StudySession
      deck={deck}
      session={session}
      settings={settings}
      onReveal={() => setSession((s) => ({ ...s, revealed: true }))}
      onRate={(rating) => setSession((s) => rateCard(s, rating))}
      onUndo={() => setSession(undoRating)}
      onLibrary={() => {}}
      dialogOpen={false}
    />
  );
}
let host, root;
const press = (key, extra = {}) =>
  act(() =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...extra,
      }),
    ),
  );
const click = (text) =>
  act(() =>
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent.includes(text))
      .click(),
  );
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:test");
      static revokeObjectURL = vi.fn();
    },
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
describe("continuous keyboard study", () => {
  it("keeps one text control focused and selects each question or answer across ratings and undo", () => {
    act(() => root.render(<Harness />));
    const keyboard = host.querySelector("#study-reader");
    const focusChanges = [];
    host.addEventListener("focusin", (e) => focusChanges.push(e.target));
    expect(document.activeElement).toBe(keyboard);
    expect(keyboard.getAttribute("aria-readonly")).toBe("true");
    expect(keyboard.value).toBe("First question");
    expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([
      0,
      keyboard.value.length,
    ]);
    for (const [key, extra, message] of [
      [" ", {}, "First answer"],
      [" ", {}, "Second question"],
      [" ", {}, "Second answer"],
      ["1", {}, "Second question"],
      ["z", { ctrlKey: true }, "Second answer"],
      ["z", { ctrlKey: true }, "First answer"],
    ]) {
      press(key, extra);
      expect(document.activeElement).toBe(keyboard);
      expect(host.querySelector("#study-reader")).toBe(keyboard);
      expect(keyboard.value).toBe(message);
      expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([
        0,
        message.length,
      ]);
    }
    expect(focusChanges).toEqual([]);
    expect(
      host
        .querySelector('[role="application"]')
        .contains(host.querySelector(".study-card")),
    ).toBe(false);
    expect(host.querySelector("[aria-live]")).toBeNull();
  });
  it("offers a reading escape that pauses shortcuts and an explicit return", () => {
    act(() => root.render(<Harness />));
    press("Escape");
    expect(document.activeElement).toBe(host.querySelector(".card-side"));
    press(" ");
    expect(host.querySelector(".answer-side")).toBeNull();
    click("Resume keyboard study");
    expect(document.activeElement).toBe(host.querySelector("#study-reader"));
    press(" ");
    expect(host.querySelector(".answer-side")).not.toBeNull();
    click("Read card");
    expect(document.activeElement).toBe(host.querySelector(".answer-side"));
    click("Repeat current question or answer");
    const reader = host.querySelector("#study-reader");
    expect(document.activeElement).toBe(reader);
    expect(reader.value).toBe("First answer");
    expect([reader.selectionStart, reader.selectionEnd]).toEqual([
      0,
      reader.value.length,
    ]);
  });
  it("leaves arrows, Home/End, selection, copy, and Tab to the native text control", () => {
    act(() => root.render(<Harness />));
    for (const [key, modifiers] of [
      ["Tab", {}],
      ["Tab", { shiftKey: true }],
      ["ArrowUp", {}],
      ["ArrowDown", {}],
      ["ArrowLeft", {}],
      ["ArrowRight", {}],
      ["ArrowDown", { shiftKey: true }],
      ["ArrowRight", { ctrlKey: true }],
      ["Home", {}],
      ["End", { ctrlKey: true }],
      ["a", { ctrlKey: true }],
      ["c", { ctrlKey: true }],
    ]) {
      const event = new KeyboardEvent("keydown", {
        key,
        ...modifiers,
        bubbles: true,
        cancelable: true,
      });
      act(() => document.activeElement.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
    }
    expect(host.querySelector("#study-reader").value).toBe("First question");
  });
  it("keeps ordinary button and focus behavior when shortcuts are disabled", () => {
    act(() =>
      root.render(
        <Harness settings={{ ...DEFAULT_SETTINGS, shortcuts: false }} />,
      ),
    );
    expect(host.querySelector('[role="application"]')).toBeNull();
    expect(document.activeElement).toBe(host.querySelector(".card-side"));
    click("Show Answer");
    expect(document.activeElement).toBe(host.querySelector(".answer-side"));
    expect(host.querySelector("#study-reader")).toBeNull();
  });
  it("blocks typing, paste, cut, and drop without changing the card text", () => {
    act(() => root.render(<Harness />));
    const reader = host.querySelector("#study-reader");
    for (const type of [
      "insertText",
      "insertFromPaste",
      "deleteContentBackward",
      "historyUndo",
    ]) {
      const event = new InputEvent("beforeinput", {
        inputType: type,
        data: "changed",
        bubbles: true,
        cancelable: true,
      });
      act(() => reader.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
    }
    for (const type of ["paste", "cut", "drop"]) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      act(() => reader.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
    }
    expect(reader.value).toBe("First question");
    // Simulate a noncancelable platform/IME input that bypasses beforeinput.
    const nativeSetValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    ).set;
    act(() => {
      nativeSetValue.call(reader, "Unexpected edit");
      reader.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(reader.value).toBe("First question");
  });
});
