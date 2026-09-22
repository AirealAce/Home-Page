import { describe, it, expect } from "vitest";
import {
  startSession,
  rateCard,
  summarize,
  undoRating,
  RATINGS,
} from "../src/services/studyEngine";
describe("study sessions", () => {
  it("requeues Again, counts presentations, and completes only on success", () => {
    let s = startSession({
      id: "deck",
      name: "Test",
      cards: [{ id: "a" }, { id: "b" }],
    });
    s = rateCard({ ...s, revealed: true }, "again");
    expect(s.queue).toEqual(["b", "a"]);
    s = rateCard({ ...s, revealed: true }, "easy");
    expect(s.queue).toEqual(["a"]);
    s = rateCard({ ...s, revealed: true }, "again");
    s = rateCard({ ...s, revealed: true }, "good");
    expect(s.queue).toEqual([]);
    expect(s.completedAt).toBeTruthy();
    expect(s.stats.a).toMatchObject({
      attempts: 3,
      presented: 3,
      again: 2,
      good: 1,
      attemptsToSuccess: 3,
      finalRating: "good",
    });
    expect(summarize(s)).toMatchObject({
      total: 2,
      first: 1,
      score: 50,
      attempts: 4,
      average: "2.00",
      again: 2,
      easy: 1,
      good: 1,
    });
  });
  it("ignores ratings before revealing and counts Hard as a first-attempt success", () => {
    let s = startSession({ id: "deck", name: "Test", cards: [{ id: "a" }] });
    expect(rateCard(s, "good")).toBe(s);
    expect(rateCard({ ...s, revealed: true }, "invalid").queue).toEqual(["a"]);
    s = rateCard({ ...s, revealed: true }, "hard");
    expect(summarize(s).score).toBe(100);
  });
});
describe("undo ratings", () => {
  const deck = { id: "deck", name: "Test", cards: [{ id: "a" }, { id: "b" }] };
  it.each(RATINGS)(
    "reverses %s, restoring the previous queue and both cards' statistics",
    (rating) => {
      const before = { ...startSession(deck), revealed: true };
      const after = rateCard(before, rating);
      const restored = undoRating(after);
      expect(restored.queue).toEqual(before.queue);
      expect(restored.stats).toEqual(before.stats);
      expect(restored.revealed).toBe(true);
      expect(restored.undoStack).toEqual([]);
      expect(before.stats.a.attempts).toBe(0);
      expect(after.stats.a.attempts).toBe(1);
      expect(restored.revision).toBeGreaterThan(after.revision);
    },
  );
  it("supports repeated undo across retries, including after a persisted session is reloaded", () => {
    const initial = startSession(deck);
    let s = initial;
    for (const rating of ["again", "hard", "again", "easy"])
      s = rateCard({ ...s, revealed: true }, rating);
    expect(summarize(s)).toMatchObject({ score: 50, attempts: 4 });
    s = JSON.parse(JSON.stringify(s));
    for (let i = 0; i < 4; i++) s = undoRating(s);
    expect(s.queue).toEqual(initial.queue);
    expect(s.stats).toEqual(initial.stats);
    expect(s.completedAt).toBeUndefined();
    expect(undoRating(s)).toBe(s);
  });
  it("reopens a completed final card and recalculates a replacement rating", () => {
    let s = startSession({ id: "one", name: "One", cards: [{ id: "a" }] });
    s = rateCard({ ...s, revealed: true }, "good");
    expect(s.completedAt).toBeTruthy();
    s = undoRating(s);
    expect(s.completedAt).toBeUndefined();
    expect(summarize(s)).toMatchObject({ completed: 0, attempts: 0, good: 0 });
    s = rateCard(s, "again");
    s = rateCard({ ...s, revealed: true }, "hard");
    expect(summarize(s)).toMatchObject({
      score: 0,
      attempts: 2,
      good: 0,
      hard: 1,
      again: 1,
    });
  });
  it("restores a one-card Again retry without counting an extra presentation", () => {
    const before = {
      ...startSession({ id: "one", name: "One", cards: [{ id: "a" }] }),
      revealed: true,
    };
    expect(undoRating(rateCard(before, "again")).stats).toEqual(before.stats);
  });
  it("leaves older sessions without undo history intact", () => {
    const s = startSession(deck);
    delete s.undoStack;
    expect(undoRating(s)).toBe(s);
    expect(
      undoRating(rateCard({ ...s, revealed: true }, "good")).stats,
    ).toEqual(s.stats);
  });
});
