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
function Harness({
  settings = DEFAULT_SETTINGS,
  dialogOpen = false,
  studyDeck = deck,
}) {
  const [session, setSession] = useState(() => startSession(studyDeck));
  return (
    <StudySession
      deck={studyDeck}
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
    expect(keyboard.value).toBe("Question — Card 1 of 2\nFirst question");
    const bodyStart = keyboard.value.indexOf("\n") + 1;
    expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([
      bodyStart,
      bodyStart,
    ]);
    expect(host.querySelector('label[for="study-reader"]').textContent).toBe(
      "Card reader",
    );
    const announcement = host.querySelector("#study-announcement");
    expect(announcement.getAttribute("aria-live")).toBe("assertive");
    expect(announcement.getAttribute("aria-atomic")).toBe("true");
    expect(announcement.textContent).toBe("");
    finishAnnouncement();
    expect(announcement.textContent).toBe("First question");
    for (const [key, extra, message, context] of [
      [" ", {}, "First answer", "Answer — Card 1 of 2"],
      [" ", {}, "Second question", "Question — Card 2 of 2"],
      [" ", {}, "Second answer", "Answer — Card 2 of 2"],
      ["1", {}, "Second question", "Question — Card 2 of 2"],
      ["z", { ctrlKey: true }, "Second answer", "Answer — Card 2 of 2"],
      ["z", { ctrlKey: true }, "First answer", "Answer — Card 1 of 2"],
    ]) {
      press(key, extra);
      expect(document.activeElement).toBe(keyboard);
      expect(host.querySelector("#study-reader")).toBe(keyboard);
      expect(keyboard.value).toBe(`${context}\n${message}`);
      expect([keyboard.selectionStart, keyboard.selectionEnd]).toEqual([
        context.length + 1,
        context.length + 1,
      ]);
      expect(host.querySelector('label[for="study-reader"]').textContent).toBe(
        "Card reader",
      );
      expect(host.querySelector("#study-announcement")).toBe(announcement);
      expect(announcement.textContent).toBe("");
      finishAnnouncement();
      expect(announcement.textContent).toBe(message);
    }
    expect(focusChanges).toEqual([]);
    expect(host.querySelectorAll(".study-pane")).toHaveLength(1);
    expect(host.querySelector(".study-card")).toBeNull();
    expect(host.querySelector(".formatted-reader")).toBeNull();
    expect(host.querySelectorAll("[aria-live]")).toHaveLength(1);
  });
  it("offers a reading escape that pauses shortcuts and an explicit return", () => {
    act(() => root.render(<Harness />));
    press("Escape");
    expect(document.activeElement).toBe(
      host.querySelector(".formatted-reader"),
    );
    expect(host.querySelector('[role="application"]').hidden).toBe(true);
    press(" ");
    expect(host.querySelector("#card-label").textContent).toBe(
      "Question — Card 1 of 2",
    );
    click("Resume keyboard study");
    expect(document.activeElement).toBe(host.querySelector("#study-reader"));
    press(" ");
    expect(host.querySelector(".formatted-reader")).toBeNull();
    expect(host.querySelector('[role="application"]').hidden).toBe(false);
    click("Read formatted card");
    expect(document.activeElement).toBe(
      host.querySelector(".formatted-reader"),
    );
    expect(host.querySelector("#card-content").textContent).toBe(
      "First answer",
    );
    expect(host.querySelectorAll(".study-pane")).toHaveLength(1);
    click("Repeat current question or answer");
    const reader = host.querySelector("#study-reader");
    expect(document.activeElement).toBe(reader);
    expect(reader.value).toBe("Answer — Card 1 of 2\nFirst answer");
    const bodyStart = reader.value.indexOf("\n") + 1;
    expect([reader.selectionStart, reader.selectionEnd]).toEqual([
      bodyStart,
      bodyStart,
    ]);
  });
  it.each(["1", "2", "3", "4", " "])(
    "announces the revealed answer and next question after rating with %j, without an arrow press",
    (key) => {
      act(() => root.render(<Harness />));
      const reader = host.querySelector("#study-reader");
      const announcement = host.querySelector("#study-announcement");
      press(" ");
      finishAnnouncement();
      expect(announcement.textContent).toBe("First answer");
      press(key);
      finishAnnouncement();
      expect(announcement.textContent).toBe("Second question");
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
    expect(announcement.textContent).toBe("First answer");
    finishAnnouncement();
    expect(announcement.textContent).toBe("First answer");
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
    expect(host.querySelector("#study-reader").value).toBe(
      "Question — Card 1 of 2\nFirst question",
    );
  });
  it("keeps ordinary button and focus behavior when shortcuts are disabled", () => {
    act(() =>
      root.render(
        <Harness settings={{ ...DEFAULT_SETTINGS, shortcuts: false }} />,
      ),
    );
    expect(host.querySelector('[role="application"]')).toBeNull();
    expect(document.activeElement).toBe(
      host.querySelector(".formatted-reader"),
    );
    expect(host.querySelector("#card-content").textContent).toBe(
      "First question",
    );
    click("Show Answer");
    expect(document.activeElement).toBe(
      host.querySelector(".formatted-reader"),
    );
    expect(host.querySelector("#card-content").textContent).toBe(
      "First answer",
    );
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
    expect(reader.value).toBe("Question — Card 1 of 2\nFirst question");
    // Simulate a noncancelable platform/IME input that bypasses beforeinput.
    const nativeSetValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    ).set;
    act(() => {
      nativeSetValue.call(reader, "Unexpected edit");
      reader.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(reader.value).toBe("Question — Card 1 of 2\nFirst question");
  });
  it("keeps reveal and rating controls in the same DOM positions across card changes", () => {
    act(() => root.render(<Harness />));
    const reveal = host.querySelector(".reveal button");
    const ratings = [...host.querySelectorAll(".rating-grid button")];
    expect(reveal.disabled).toBe(false);
    expect(ratings.every((button) => button.disabled)).toBe(true);
    press(" ");
    expect(host.querySelector(".reveal button")).toBe(reveal);
    expect(reveal.disabled).toBe(true);
    expect(ratings.every((button) => !button.disabled)).toBe(true);
    press("3");
    expect(host.querySelector(".reveal button")).toBe(reveal);
    expect([...host.querySelectorAll(".rating-grid button")]).toEqual(ratings);
    expect(reveal.disabled).toBe(false);
    expect(ratings.every((button) => button.disabled)).toBe(true);
  });
  it("keeps images available in the same pane's optional formatted view", () => {
    const studyDeck = {
      ...deck,
      media: { "diagram.png": new Blob(["image"], { type: "image/png" }) },
      cards: [
        {
          ...deck.cards[0],
          front:
            'Read this diagram.<img src="diagram.png" alt="A labeled triangle">',
        },
        deck.cards[1],
      ],
    };
    act(() => root.render(<Harness studyDeck={studyDeck} />));
    expect(host.querySelector("#study-reader").value).toContain(
      "A labeled triangle",
    );
    expect(host.querySelector(".formatted-reader")).toBeNull();
    click("Read formatted card");
    expect(host.querySelector(".study-pane img").getAttribute("src")).toBe(
      "blob:test",
    );
    expect(host.querySelector(".study-pane img").getAttribute("alt")).toBe(
      "A labeled triangle",
    );
    expect(host.querySelector('[role="application"]').hidden).toBe(true);
    click("Resume keyboard study");
    expect(host.querySelector(".study-pane img")).toBeNull();
    expect(document.activeElement).toBe(host.querySelector("#study-reader"));
  });
  it("reserves the audio controls' layout in mixed-media decks without showing inactive controls", () => {
    const studyDeck = {
      ...deck,
      media: { "voice.mp3": new Blob(["audio"], { type: "audio/mpeg" }) },
      cards: [
        { ...deck.cards[0], front: "Listen. [sound:voice.mp3]" },
        deck.cards[1],
      ],
    };
    act(() => root.render(<Harness studyDeck={studyDeck} />));
    const controls = host.querySelector(".audio-controls");
    expect(controls.style.visibility).toBe("visible");
    press(" ");
    press("3");
    expect(host.querySelector(".audio-controls")).toBe(controls);
    expect(controls.style.visibility).toBe("hidden");
  });
});
