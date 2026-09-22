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
function Harness({ settings = DEFAULT_SETTINGS, dialogOpen = false }) {
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
      dialogOpen={dialogOpen}
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
const finishAnnouncement = () => act(() => vi.advanceTimersByTime(150));
beforeEach(() => {
  vi.useFakeTimers();
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
  vi.useRealTimers();
  host.remove();
  vi.unstubAllGlobals();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
describe("continuous keyboard study", () => {
  it("announces each question or answer while retaining focus and positioning reading at the start", () => {
    act(() => root.render(<Harness />));
    const keyboard = host.querySelector("#study-reader");
    const focusChanges = [];
    host.addEventListener("focusin", (e) => focusChanges.push(e.target));
    expect(document.activeElement).toBe(keyboard);
    expect(keyboard.getAttribute("aria-readonly")).toBe("true");
    expect(keyboard.value).toBe("First question");
    expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([0, 0]);
    const announcement = host.querySelector("#study-announcement");
    expect(announcement.getAttribute("aria-live")).toBe("assertive");
    expect(announcement.getAttribute("aria-atomic")).toBe("true");
    expect(announcement.textContent).toBe("");
    finishAnnouncement();
    expect(announcement.textContent).toBe(
      "Question. Card 1 of 2. First question",
    );
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
      expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([0, 0]);
      expect(host.querySelector("#study-announcement")).toBe(announcement);
      expect(announcement.textContent).toBe("");
      finishAnnouncement();
      expect(announcement.textContent).toContain(message);
    }
    expect(focusChanges).toEqual([]);
    expect(
      host
        .querySelector('[role="application"]')
        .contains(host.querySelector(".study-card")),
    ).toBe(false);
    expect(host.querySelectorAll("[aria-live]")).toHaveLength(1);
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
    expect([reader.selectionStart, reader.selectionEnd]).toEqual([0, 0]);
  });
  it.each(["1", "2", "3", "4", " "])(
    "announces the revealed answer and next question after rating with %j, without an arrow press",
    (key) => {
      act(() => root.render(<Harness />));
      const reader = host.querySelector("#study-reader");
      const announcement = host.querySelector("#study-announcement");
      press(" ");
      finishAnnouncement();
      expect(announcement.textContent).toBe(
        "Answer. Card 1 of 2. First answer",
      );
      press(key);
      finishAnnouncement();
      expect(announcement.textContent).toBe(
        "Question. Card 2 of 2. Second question",
      );
      expect(document.activeElement).toBe(reader);
    },
  );
  it("announces only the latest side after rapid reveal, rating, and undo", () => {
    act(() => root.render(<Harness />));
    const announcement = host.querySelector("#study-announcement");
    act(() => vi.advanceTimersByTime(100));
    press(" ");
    act(() => vi.advanceTimersByTime(100));
    press("3");
    act(() => vi.advanceTimersByTime(100));
    press("z", { ctrlKey: true });
    expect(announcement.textContent).toBe("");
    finishAnnouncement();
    expect(announcement.textContent).toBe("Answer. Card 1 of 2. First answer");
    finishAnnouncement();
    expect(announcement.textContent).toBe("Answer. Card 1 of 2. First answer");
  });
  it("repeats identical text through the existing live region", () => {
    act(() => root.render(<Harness />));
    const announcement = host.querySelector("#study-announcement");
    finishAnnouncement();
    const message = announcement.textContent;
    click("Repeat current question or answer");
    expect(announcement.textContent).toBe("");
    finishAnnouncement();
    expect(announcement.textContent).toBe(message);
    expect(host.querySelector("#study-announcement")).toBe(announcement);
  });
  it("cancels pending speech when reading the formatted card, opening settings, or disabling shortcuts", () => {
    act(() => root.render(<Harness />));
    const announcement = host.querySelector("#study-announcement");
    press("Escape");
    finishAnnouncement();
    expect(announcement.textContent).toBe("");
    click("Resume keyboard study");
    act(() => root.render(<Harness dialogOpen />));
    finishAnnouncement();
    expect(announcement.textContent).toBe("");
    act(() =>
      root.render(
        <Harness settings={{ ...DEFAULT_SETTINGS, shortcuts: false }} />,
      ),
    );
    finishAnnouncement();
    expect(announcement.textContent).toBe("");
  });
  it("does not announce a pending card after focus leaves the reader", () => {
    act(() => root.render(<Harness />));
    act(() => host.querySelector("button").focus());
    finishAnnouncement();
    expect(host.querySelector("#study-announcement").textContent).toBe("");
  });
  it("cleans up pending announcements when leaving the study session", () => {
    act(() => root.render(<Harness />));
    // Flush the text control's asynchronous selection events first.
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(1);
    act(() => root.render(null));
    expect(vi.getTimerCount()).toBe(0);
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
