import { categories, questions } from "../data/questions";
import {
  defaultSettings,
  makeRound,
  MAX_ANSWER,
  MAX_NICKNAME,
  maxImpostors,
  nextHistory,
  validSetup,
} from "./game";
import type { Category, Locale, Member, Settings, Vault } from "./types";

export const LOCAL_STORAGE_KEY = "sq-pass-play-v1";
export type LocalPhase = "setup" | "answering" | "discussion" | "reveal";
export interface LocalGame {
  version: 1;
  phase: LocalPhase;
  settings: Settings;
  names: string[];
  round: number;
  used: string[];
  vault: Vault | null;
  answers: Record<string, string>;
}
export type LocalErrorCode =
  "localMissingNames" | "localDuplicateNames" | "error_setup" | "error_answer";
export class LocalGameError extends Error {
  constructor(public code: LocalErrorCode) {
    super(code);
  }
}
export function freshLocalGame(locale: Locale): LocalGame {
  return {
    version: 1,
    phase: "setup",
    settings: {
      ...defaultSettings,
      capacity: 3,
      categories: [...defaultSettings.categories],
      locale,
    },
    names: Array(10).fill(""),
    round: 0,
    used: [],
    vault: null,
    answers: {},
  };
}
export function localMembers(game: LocalGame): Record<string, Member> {
  return Object.fromEntries(
    game.names
      .slice(0, game.settings.capacity)
      .map((nickname, slot) => [
        `local-${slot}`,
        { nickname: nickname.trim(), ready: true, joinedAt: 0, slot },
      ]),
  );
}
export function localSetupError(game: LocalGame): LocalErrorCode | null {
  if (
    !validSetup(game.settings.capacity, game.settings.impostors) ||
    !game.settings.categories.length
  )
    return "error_setup";
  const names = game.names
    .slice(0, game.settings.capacity)
    .map((n) => n.trim());
  if (names.some((n) => !n || n.length > MAX_NICKNAME))
    return "localMissingNames";
  if (new Set(names.map((n) => n.toLocaleLowerCase())).size !== names.length)
    return "localDuplicateNames";
  return null;
}
export function startLocalRound(game: LocalGame): LocalGame {
  if (!["setup", "reveal"].includes(game.phase))
    throw new LocalGameError("error_setup");
  const error = localSetupError(game);
  if (error) throw new LocalGameError(error);
  const vault = makeRound(
    localMembers(game),
    game.settings,
    game.used,
    crypto.randomUUID(),
  );
  return {
    ...game,
    names: game.names.map((n) => n.trim()),
    phase: "answering",
    round: game.round + 1,
    vault,
    answers: {},
    used: nextHistory(game.settings, game.used, vault.questionId),
  };
}
export function submitLocalAnswer(
  game: LocalGame,
  uid: string,
  answer: string,
): LocalGame {
  const clean = answer.trim();
  if (
    game.phase !== "answering" ||
    !game.vault ||
    !Object.hasOwn(game.vault.assignments, uid) ||
    Object.hasOwn(game.answers, uid) ||
    !clean ||
    clean.length > MAX_ANSWER
  )
    throw new LocalGameError("error_answer");
  return { ...game, answers: { ...game.answers, [uid]: clean } };
}
export function allLocalAnswered(game: LocalGame) {
  return (
    !!game.vault &&
    Object.keys(localMembers(game)).every((uid) =>
      Object.hasOwn(game.answers, uid),
    )
  );
}
export function discussLocalRound(game: LocalGame): LocalGame {
  if (game.phase !== "answering" || !allLocalAnswered(game))
    throw new LocalGameError("error_setup");
  return { ...game, phase: "discussion" };
}
export function revealLocalRound(game: LocalGame): LocalGame {
  if (game.phase !== "discussion") throw new LocalGameError("error_setup");
  return { ...game, phase: "reveal" };
}
export function resetLocalSetup(game: LocalGame): LocalGame {
  return { ...game, phase: "setup", vault: null, answers: {} };
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
// Restore only validated structure and canonical questions. Private UI selection is
// never persisted: a refreshed phone always returns to neutral player cards.
export function restoreLocalGame(serialized: string | null): LocalGame | null {
  if (!serialized) return null;
  try {
    const raw: unknown = JSON.parse(serialized);
    if (
      !record(raw) ||
      raw.version !== 1 ||
      !["setup", "answering", "discussion", "reveal"].includes(
        String(raw.phase),
      ) ||
      !record(raw.settings)
    )
      return null;
    const s = raw.settings;
    if (
      typeof s.capacity !== "number" ||
      !Number.isInteger(s.capacity) ||
      ![1, 2, 3, "random"].includes(s.impostors as number | string) ||
      !validSetup(s.capacity, s.impostors as Settings["impostors"]) ||
      !["en", "nl"].includes(String(s.locale)) ||
      !Array.isArray(s.categories) ||
      !s.categories.length ||
      s.categories.some((c) => !categories.some((k) => k.id === c))
    )
      return null;
    if (
      !Array.isArray(raw.names) ||
      raw.names.length !== 10 ||
      raw.names.some((n) => typeof n !== "string" || n.length > MAX_NICKNAME) ||
      typeof raw.round !== "number" ||
      !Number.isInteger(raw.round) ||
      raw.round < 0 ||
      !Array.isArray(raw.used) ||
      raw.used.length > 10000 ||
      raw.used.some((id) => typeof id !== "string")
    )
      return null;
    const settings: Settings = {
      capacity: s.capacity,
      impostors: s.impostors as Settings["impostors"],
      categories: [...new Set(s.categories)] as Category[],
      locale: s.locale as Locale,
    };
    const game: LocalGame = {
      version: 1,
      phase: raw.phase as LocalPhase,
      settings,
      names: raw.names as string[],
      round: raw.round,
      used: [...new Set(raw.used)] as string[],
      vault: null,
      answers: {},
    };
    if (game.phase === "setup") return game;
    if (
      localSetupError(game) ||
      game.round < 1 ||
      !record(raw.vault) ||
      typeof raw.vault.roundId !== "string" ||
      !raw.vault.roundId ||
      raw.vault.roundId.length > 64 ||
      !record(raw.vault.impostors) ||
      !record(raw.answers)
    )
      return null;
    const questionId = raw.vault.questionId;
    const question = questions[settings.locale].find(
      (q) => q.id === questionId,
    );
    if (!question) return null;
    const members = localMembers(game);
    const assignments: Vault["assignments"] = {};
    const impostors: Vault["impostors"] = {};
    const variations = new Set<string>();
    for (const [uid, p] of Object.entries(raw.vault.impostors)) {
      if (
        !Object.hasOwn(members, uid) ||
        !record(p) ||
        !["I1", "I2", "I3"].includes(String(p.variation)) ||
        variations.has(String(p.variation))
      )
        return null;
      const variation = p.variation as "I1" | "I2" | "I3";
      variations.add(variation);
      impostors[uid] = {
        nickname: members[uid].nickname,
        variation,
        question: question[variation],
      };
    }
    if (
      variations.size < 1 ||
      variations.size > maxImpostors(settings.capacity) ||
      (settings.impostors !== "random" &&
        variations.size !== settings.impostors)
    )
      return null;
    for (const uid of Object.keys(members))
      assignments[uid] = {
        roundId: raw.vault.roundId,
        question: impostors[uid]?.question || question.original,
      };
    for (const [uid, answer] of Object.entries(raw.answers)) {
      if (
        !Object.hasOwn(members, uid) ||
        typeof answer !== "string" ||
        !answer.trim() ||
        answer.length > MAX_ANSWER
      )
        return null;
      game.answers[uid] = answer;
    }
    game.vault = {
      roundId: raw.vault.roundId,
      questionId: question.id,
      category: question.category,
      original: question.original,
      assignments,
      impostors,
    };
    if (
      (game.phase === "discussion" || game.phase === "reveal") &&
      !allLocalAnswered(game)
    )
      return null;
    return game;
  } catch {
    return null;
  }
}
