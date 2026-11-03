import { questions } from "../data/questions";
import type { ImpostorSetting, Member, Settings, Vault } from "./types";
export const MAX_ANSWER = 160;
export const MAX_NICKNAME = 20;
export const defaultSettings: Settings = {
  capacity: 10,
  impostors: 1,
  categories: [
    "social",
    "food",
    "party",
    "love",
    "opinions",
    "culture",
    "person",
    "whatif",
    "numbers",
    "weird",
  ],
  locale: "en",
};
export const maxImpostors = (players: number) =>
  Math.min(3, Math.floor((players - 1) / 2));
export function validSetup(players: number, impostors: ImpostorSetting) {
  return (
    players >= 3 &&
    players <= 10 &&
    (impostors === "random" ||
      (Number.isInteger(impostors) &&
        impostors >= 1 &&
        impostors <= maxImpostors(players)))
  );
}
export function randomInt(max: number) {
  if (max < 1) throw new Error("Empty random pool");
  const range = 0x100000000;
  const limit = range - (range % max);
  let n: number;
  do {
    n = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (n >= limit);
  return n % max;
}
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function makeRound(
  members: Record<string, Member>,
  settings: Settings,
  used: string[],
  roundId: string,
): Vault {
  const ids = Object.keys(members);
  if (!validSetup(ids.length, settings.impostors)) throw new Error("setup");
  const pool = questions[settings.locale].filter((q) =>
    settings.categories.includes(q.category),
  );
  if (!pool.length) throw new Error("setup");
  const available = pool.filter((q) => !used.includes(q.id));
  const question = (available.length ? available : pool)[
    randomInt((available.length ? available : pool).length)
  ];
  const count =
    settings.impostors === "random"
      ? 1 + randomInt(maxImpostors(ids.length))
      : settings.impostors;
  const impostorIds = shuffled(ids).slice(0, count);
  const variations = shuffled(["I1", "I2", "I3"] as const);
  const assignments: Vault["assignments"] = {};
  const impostors: Vault["impostors"] = {};
  ids.forEach((uid) => {
    const index = impostorIds.indexOf(uid);
    const variation = variations[index];
    const text = index < 0 ? question.original : question[variation];
    assignments[uid] = { roundId, question: text };
    if (index >= 0)
      impostors[uid] = {
        nickname: members[uid].nickname,
        question: text,
        variation,
      };
  });
  return {
    roundId,
    original: question.original,
    category: question.category,
    questionId: question.id,
    assignments,
    impostors,
  };
}
export function nextHistory(
  settings: Settings,
  used: string[],
  questionId: string,
): string[] {
  const pool = questions[settings.locale].filter((q) =>
    settings.categories.includes(q.category),
  );
  const exhausted = pool.every((q) => used.includes(q.id));
  return [
    ...(exhausted ? used.filter((id) => !pool.some((q) => q.id === id)) : used),
    questionId,
  ];
}
export const roomCode = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)],
  ).join("");
export const normalizeCode = (code: string) => code.trim().toUpperCase();
