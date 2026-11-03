import { describe, expect, it } from "vitest";
import { categories, questions } from "../src/data/questions";
import {
  makeRound,
  maxImpostors,
  nextHistory,
  roomCode,
  validSetup,
  defaultSettings,
} from "../src/lib/game";
import type { Member } from "../src/lib/types";
const members = (n: number): Record<string, Member> =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [
      `player${i}`,
      { nickname: `Player ${i}`, ready: true, joinedAt: 1, slot: i },
    ]),
  );
describe("player and impostor combinations", () => {
  it("requires 3–10 players and a normal majority", () => {
    for (let n = 0; n <= 12; n++) {
      for (const k of [1, 2, 3] as const)
        expect(validSetup(n, k)).toBe(n >= 3 && n <= 10 && k < n - k);
    }
    expect(validSetup(3, "random")).toBe(true);
    expect(validSetup(2, "random")).toBe(false);
  });
  it("delivers uniform private objects and unique variations for every valid setup", () => {
    for (let n = 3; n <= 10; n++)
      for (let k = 1; k <= maxImpostors(n); k++) {
        const round = makeRound(
          members(n),
          { ...defaultSettings, impostors: k as 1 | 2 | 3 },
          [],
          "round-1",
        );
        expect(Object.keys(round.assignments)).toHaveLength(n);
        expect(Object.keys(round.impostors)).toHaveLength(k);
        expect(
          new Set(Object.values(round.impostors).map((p) => p.variation)).size,
        ).toBe(k);
        for (const [id, a] of Object.entries(round.assignments)) {
          expect(Object.keys(a).sort()).toEqual(["question", "roundId"]);
          expect(a.roundId).toBe("round-1");
          expect(a.question).toBe(
            round.impostors[id]?.question || round.original,
          );
        }
      }
  });
  it("random respects the player count", () => {
    for (let i = 0; i < 50; i++) {
      const r = makeRound(
        members(3),
        { ...defaultSettings, impostors: "random" },
        [],
        "r",
      );
      expect(Object.keys(r.impostors)).toHaveLength(1);
    }
  });
  it("exhausts the enabled pool before repeating", () => {
    const settings = { ...defaultSettings, categories: ["party"] as const };
    let used: string[] = [];
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      const round = makeRound(
        members(3),
        { ...settings, categories: [...settings.categories] },
        used,
        "r",
      );
      expect(seen.has(round.questionId)).toBe(false);
      seen.add(round.questionId);
      used = nextHistory(
        { ...settings, categories: [...settings.categories] },
        used,
        round.questionId,
      );
    }
    const next = makeRound(
      members(3),
      { ...settings, categories: [...settings.categories] },
      used,
      "r",
    );
    expect(seen.has(next.questionId)).toBe(true);
    expect(
      nextHistory(
        { ...settings, categories: [...settings.categories] },
        used,
        next.questionId,
      ),
    ).toEqual([next.questionId]);
  });
  it("generates safe six-character invitation codes", () => {
    for (let i = 0; i < 100; i++)
      expect(roomCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
describe("complete translated content", () => {
  it("has 10 complete unique sets in every category in both locales", () => {
    for (const locale of ["en", "nl"] as const) {
      expect(questions[locale]).toHaveLength(100);
      expect(new Set(questions[locale].map((q) => q.id)).size).toBe(100);
      for (const category of categories)
        expect(
          questions[locale].filter((q) => q.category === category.id),
        ).toHaveLength(10);
      for (const q of questions[locale]) {
        expect(new Set([q.original, q.I1, q.I2, q.I3]).size).toBe(4);
        for (const text of [q.original, q.I1, q.I2, q.I3])
          expect(text.length).toBeGreaterThan(12);
      }
    }
    expect(questions.en.map((q) => q.id)).toEqual(
      questions.nl.map((q) => q.id),
    );
  });
});
