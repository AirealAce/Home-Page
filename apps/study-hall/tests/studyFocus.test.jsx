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
const flushSpeech = () => act(() => vi.advanceTimersByTime(150));
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
  vi.useFakeTimers();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
describe("continuous keyboard study", () => {
  it("keeps the same focus across reveal, Good, Again, and repeated undo", () => {
    act(() => root.render(<Harness />));
    const keyboard = host.querySelector('[role="application"]');
    const speech = host.querySelector('[role="status"]');
    const focusChanges = [];
    host.addEventListener("focusin", (e) => focusChanges.push(e.target));
    expect(document.activeElement).toBe(keyboard);
    flushSpeech();
    expect(speech.textContent).toBe("Card 1 of 2. Question. First question");
    for (const [key, extra, message] of [
      [" ", {}, "Card 1 of 2. Answer. First answer"],
      [" ", {}, "Card 2 of 2. Question. Second question"],
      [" ", {}, "Card 2 of 2. Answer. Second answer"],
      ["1", {}, "Card 2 of 2. Question. Second question"],
      ["z", { ctrlKey: true }, "Card 2 of 2. Answer. Second answer"],
      ["z", { ctrlKey: true }, "Card 1 of 2. Answer. First answer"],
    ]) {
      press(key, extra);
      flushSpeech();
      expect(document.activeElement).toBe(keyboard);
      expect(host.querySelector('[role="status"]')).toBe(speech);
      expect(speech.textContent).toBe(message);
    }
    expect(focusChanges).toEqual([]);
    expect(keyboard.contains(host.querySelector(".study-card"))).toBe(false);
  });
  it("offers a reading escape that pauses shortcuts and an explicit return", () => {
    act(() => root.render(<Harness />));
    press("Escape");
    expect(document.activeElement).toBe(host.querySelector(".card-side"));
    press(" ");
    expect(host.querySelector(".answer-side")).toBeNull();
    flushSpeech();
    expect(host.querySelector('[role="status"]').textContent).toBe("");
    click("Resume keyboard study");
    expect(document.activeElement).toBe(
      host.querySelector('[role="application"]'),
    );
    press(" ");
    expect(host.querySelector(".answer-side")).not.toBeNull();
    click("Read card");
    expect(document.activeElement).toBe(host.querySelector(".card-side"));
    click("Repeat current question or answer");
    flushSpeech();
    expect(host.querySelector('[role="status"]').textContent).toBe(
      "Card 1 of 2. Answer. First answer",
    );
  });
  it("does not trap Tab or Shift+Tab", () => {
    act(() => root.render(<Harness />));
    for (const shiftKey of [false, true]) {
      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      act(() => document.activeElement.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
    }
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
    flushSpeech();
    expect(host.querySelector('[role="status"]').textContent).toBe("");
  });
});
