import { describe, expect, it } from "vitest";
import { questions } from "../src/data/questions";
import {
  allLocalAnswered,
  discussLocalRound,
  freshLocalGame,
  localSetupError,
  resetLocalSetup,
  restoreLocalGame,
  revealLocalRound,
  startLocalRound,
  submitLocalAnswer,
} from "../src/lib/local";
import type { LocalGame } from "../src/lib/local";
function setup(players = 3): LocalGame {
  const game = freshLocalGame("en");
  game.settings.capacity = players;
  game.names = game.names.map((_, i) => `Player ${i + 1}`);
  return game;
}
function finish(game: LocalGame) {
  for (const uid of Object.keys(game.vault!.assignments))
    game = submitLocalAnswer(game, uid, `Answer from ${uid}`);
  return revealLocalRound(discussLocalRound(game));
}
describe("shared-phone party lifecycle", () => {
  it("requires a name for every player and rejects ambiguous duplicate names", () => {
    expect(localSetupError(freshLocalGame("en"))).toBe("localMissingNames");
    const game = setup();
    game.names[0] = " Alice ";
    game.names[1] = "alice";
    expect(localSetupError(game)).toBe("localDuplicateNames");
    expect(() => startLocalRound(game)).toThrow();
  });
  it("uses the original assignments and unique variations for multiple impostors", () => {
    const game = setup(7);
    game.settings.impostors = 3;
    const round = startLocalRound(game);
    expect(Object.keys(round.vault!.assignments)).toHaveLength(7);
    expect(Object.keys(round.vault!.impostors)).toHaveLength(3);
    expect(
      new Set(Object.values(round.vault!.impostors).map((p) => p.variation))
        .size,
    ).toBe(3);
    expect(
      Object.values(round.vault!.assignments).filter(
        (a) => a.question === round.vault!.original,
      ),
    ).toHaveLength(4);
  });
  it("locks a submitted answer and accepts any player order", () => {
    let game = startLocalRound(setup());
    game = submitLocalAnswer(game, "local-2", "  My answer  ");
    expect(game.answers["local-2"]).toBe("My answer");
    expect(allLocalAnswered(game)).toBe(false);
    expect(() => submitLocalAnswer(game, "local-2", "Replacement")).toThrow();
    for (const uid of ["unknown", "__proto__", "toString"])
      expect(() => submitLocalAnswer(game, uid, "No")).toThrow();
    expect(() => submitLocalAnswer(game, "local-0", " ".repeat(10))).toThrow();
    expect(() => submitLocalAnswer(game, "local-0", "x".repeat(161))).toThrow();
  });
  it("blocks premature discussion and reveal, then supports replay/reset", () => {
    let game = startLocalRound(setup());
    expect(() => discussLocalRound(game)).toThrow();
    expect(() => revealLocalRound(game)).toThrow();
    game = finish(game);
    expect(game.phase).toBe("reveal");
    expect(allLocalAnswered(game)).toBe(true);
    const previous = game.vault!.questionId;
    const replay = startLocalRound(game);
    expect(replay.round).toBe(2);
    expect(replay.vault!.questionId).not.toBe(previous);
    expect(replay.answers).toEqual({});
    const reset = resetLocalSetup(replay);
    expect(reset.phase).toBe("setup");
    expect(reset.names).toEqual(replay.names);
    expect(reset.used).toEqual(replay.used);
    expect(reset.vault).toBeNull();
  });
  it("preserves assignments and completed answers on refresh without a persisted private screen", () => {
    let game = startLocalRound(setup());
    game = submitLocalAnswer(game, "local-1", "Saved");
    const restored = restoreLocalGame(
      JSON.stringify({
        ...game,
        selected: "local-0",
        revealed: true,
        draft: "Private draft",
      }),
    );
    expect(restored).toEqual(game);
    expect(restored!.vault).toEqual(game.vault);
    expect(restored!.answers["local-1"]).toBe("Saved");
    expect(restored).not.toHaveProperty("selected");
    expect(restored).not.toHaveProperty("revealed");
    expect(restored).not.toHaveProperty("draft");
  });
  it("rejects broken or inconsistent saved games and reconstructs canonical questions", () => {
    expect(restoreLocalGame("broken JSON")).toBeNull();
    expect(restoreLocalGame('{"version":2}')).toBeNull();
    const game = startLocalRound(setup());
    expect(
      restoreLocalGame(JSON.stringify({ ...game, phase: "reveal" })),
    ).toBeNull();
    expect(
      restoreLocalGame(JSON.stringify({ ...game, names: ["A", "B"] })),
    ).toBeNull();
    const changed = JSON.parse(JSON.stringify(game));
    changed.vault.assignments["local-0"].question = "Corrupted text";
    expect(restoreLocalGame(JSON.stringify(changed))!.vault).toEqual(
      game.vault,
    );
  });
  it("uses complete Dutch content and exhausts a category before repeating", () => {
    let game = setup();
    game.settings.locale = "nl";
    game.settings.categories = ["party"];
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      game = startLocalRound(game);
      expect(seen.has(game.vault!.questionId)).toBe(false);
      seen.add(game.vault!.questionId);
      expect(game.vault!.original).toBe(
        questions.nl.find((q) => q.id === game.vault!.questionId)!.original,
      );
      game = finish(game);
    }
    game = startLocalRound(game);
    expect(seen.has(game.vault!.questionId)).toBe(true);
    expect(game.used).toHaveLength(1);
  });
});
