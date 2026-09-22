import { describe, it, expect } from "vitest";
import { startSession, rateCard, summarize } from "../src/services/studyEngine";
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
