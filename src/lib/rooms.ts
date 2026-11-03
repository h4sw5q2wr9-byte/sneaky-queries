import {
  get,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { db, identity } from "./firebase";
import {
  makeRound,
  nextHistory,
  normalizeCode,
  roomCode,
  validSetup,
} from "./game";
import type {
  Member,
  Meta,
  Response,
  RoomState,
  Settings,
  Vault,
} from "./types";
export class GameError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
const path = (code: string, child = "") =>
  ref(db, `rooms/${code}${child ? "/" + child : ""}`);
const member = (nickname: string, slot = 0): Member => ({
  nickname: nickname.trim(),
  ready: false,
  joinedAt: Date.now(),
  slot,
});
function checkNickname(nickname: string) {
  if (!nickname.trim() || nickname.trim().length > 20)
    throw new GameError("nickname");
}
export async function createRoom(nickname: string, settings: Settings) {
  checkNickname(nickname);
  const uid = await identity();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = roomCode();
    const now = Date.now();
    try {
      await set(path(code), {
        meta: {
          hostId: uid,
          createdAt: now,
          expiresAt: now + 12 * 60 * 60 * 1000,
          phase: "lobby",
          round: 0,
          roundId: "none",
          settings,
        },
        members: { [uid]: member(nickname) },
        seats: { 0: uid },
      });
      return code;
    } catch (error) {
      if ((error as { code?: string }).code !== "PERMISSION_DENIED")
        throw error;
    }
  }
  throw new GameError("createFailed");
}
export async function joinRoom(input: string, nickname: string) {
  checkNickname(nickname);
  const code = normalizeCode(input);
  if (!/^[A-Z2-9]{6}$/.test(code)) throw new GameError("invalidCode");
  const uid = await identity();
  const snap = await get(path(code, "meta"));
  if (!snap.exists()) throw new GameError("invalidCode");
  const meta = snap.val() as Meta;
  if (meta.expiresAt < Date.now()) throw new GameError("expired");
  if ((await get(path(code, `members/${uid}`))).exists()) return code;
  if (meta.phase !== "lobby") throw new GameError("inProgress");
  for (let attempt = 0; attempt < 12; attempt++) {
    const seats = (await get(path(code, "seats"))).val() || {};
    const slot = Array.from(
      { length: meta.settings.capacity },
      (_, i) => i,
    ).find((i) => !seats[i]);
    if (slot === undefined) throw new GameError("full");
    try {
      await update(path(code), {
        [`members/${uid}`]: member(nickname, slot),
        [`seats/${slot}`]: uid,
      });
      return code;
    } catch {
      const latest = (await get(path(code, "meta"))).val() as Meta;
      if (latest.expiresAt < Date.now()) throw new GameError("expired");
      if (latest.phase !== "lobby") throw new GameError("inProgress");
    }
  }
  throw new GameError("joinFailed");
}
export function subscribeRoom(
  code: string,
  uid: string,
  onChange: (state: RoomState) => void,
  onError: (e: Error) => void,
) {
  let state: RoomState = {
    meta: null,
    members: {},
    presence: {},
    submitted: {},
    assignment: null,
    discussion: null,
    reveal: null,
  };
  let phaseOff: (() => void)[] = [];
  let phaseKey = "";
  const listen = (child: string, key: keyof RoomState, fallback: unknown) =>
    onValue(
      path(code, child),
      (snap) => {
        state = { ...state, [key]: snap.val() ?? fallback };
        onChange(state);
      },
      onError,
    );
  const offs = [
    listen("members", "members", {}),
    listen("presence", "presence", {}),
    listen("submitted", "submitted", {}),
    listen(`assignments/${uid}`, "assignment", null),
  ];
  offs.push(
    onValue(
      path(code, "meta"),
      (snap) => {
        state = { ...state, meta: snap.val() };
        const key = state.meta?.phase + ":" + state.meta?.roundId;
        if (key !== phaseKey) {
          phaseKey = key;
          phaseOff.forEach((off) => off());
          phaseOff = [];
          state = { ...state, discussion: null, reveal: null };
          if (
            state.meta?.phase === "discussion" ||
            state.meta?.phase === "reveal"
          )
            phaseOff.push(listen("discussion", "discussion", null));
          if (state.meta?.phase === "reveal")
            phaseOff.push(listen("reveal", "reveal", null));
        }
        onChange(state);
      },
      onError,
    ),
  );
  return () => {
    offs.forEach((off) => off());
    phaseOff.forEach((off) => off());
  };
}
export function presence(
  code: string,
  uid: string,
  onConnection: (connected: boolean) => void,
) {
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let stopped = false;
  const node = path(code, `presence/${uid}`);
  const off = onValue(ref(db, ".info/connected"), async (snap) => {
    const connected = snap.val() === true;
    onConnection(connected);
    clearInterval(heartbeat);
    if (connected) {
      try {
        await onDisconnect(node).set({
          online: false,
          lastSeen: serverTimestamp(),
        });
        if (stopped) return;
        await set(node, { online: true, lastSeen: serverTimestamp() });
        heartbeat = setInterval(() => {
          void set(node, { online: true, lastSeen: serverTimestamp() }).catch(
            () => {},
          );
        }, 15000);
      } catch {
        /* A removed member cannot restore presence. */
      }
    }
  });
  return () => {
    stopped = true;
    off();
    clearInterval(heartbeat);
    void onDisconnect(node).cancel();
    void set(node, { online: false, lastSeen: serverTimestamp() }).catch(
      () => {},
    );
  };
}
export async function ready(code: string, uid: string, value: boolean) {
  await set(path(code, `members/${uid}/ready`), value);
}
export async function saveSettings(code: string, settings: Settings) {
  await set(path(code, "meta/settings"), settings);
}
export async function startRound(code: string) {
  const [metaSnap, membersSnap, historySnap, presenceSnap] = await Promise.all([
    get(path(code, "meta")),
    get(path(code, "members")),
    get(path(code, "history")),
    get(path(code, "presence")),
  ]);
  const meta = metaSnap.val() as Meta;
  const members = membersSnap.val() as Record<string, Member>;
  if (!["lobby", "reveal"].includes(meta.phase))
    throw new GameError("inProgress");
  if (!validSetup(Object.keys(members).length, meta.settings.impostors))
    throw new GameError("setup");
  if (
    Object.entries(members).some(
      ([uid, m]) => !m.ready || !presenceSnap.child(`${uid}/online`).val(),
    )
  )
    throw new GameError("notReady");
  const id = crypto.randomUUID();
  const used: string[] = historySnap.val() || [];
  const vault = makeRound(members, meta.settings, used, id);
  await update(path(code), {
    "meta/phase": "answering",
    "meta/round": meta.round + 1,
    "meta/roundId": id,
    vault,
    assignments: vault.assignments,
    history: nextHistory(meta.settings, used, vault.questionId),
    responses: null,
    submitted: null,
    discussion: null,
    reveal: null,
  });
}
export async function submitAnswer(
  code: string,
  uid: string,
  roundId: string,
  answer: string,
) {
  const clean = answer.trim();
  if (!clean || clean.length > 160) throw new GameError("answer");
  await update(path(code), {
    [`responses/${uid}`]: { roundId, answer: clean },
    [`submitted/${uid}`]: roundId,
  });
}
export async function finishAnswers(code: string) {
  const [metaSnap, vaultSnap, membersSnap, responseSnap] = await Promise.all([
    get(path(code, "meta")),
    get(path(code, "vault")),
    get(path(code, "members")),
    get(path(code, "responses")),
  ]);
  const meta = metaSnap.val() as Meta;
  const vault = vaultSnap.val() as Vault;
  const members = membersSnap.val() as Record<string, Member>;
  const responses = (responseSnap.val() || {}) as Record<string, Response>;
  if (meta.phase !== "answering" || vault.roundId !== meta.roundId) return;
  if (
    !Object.keys(members).every(
      (uid) => responses[uid]?.roundId === meta.roundId,
    )
  )
    return;
  const answers = Object.fromEntries(
    Object.entries(members).map(([uid, m]) => [
      uid,
      { nickname: m.nickname, answer: responses[uid].answer },
    ]),
  );
  await update(path(code), {
    "meta/phase": "discussion",
    discussion: {
      roundId: meta.roundId,
      original: vault.original,
      category: vault.category,
      answers,
    },
  });
}
export async function revealRound(code: string) {
  const snap = await get(path(code, "vault"));
  const vault = snap.val() as Vault;
  await update(path(code), {
    "meta/phase": "reveal",
    reveal: { roundId: vault.roundId, impostors: vault.impostors },
  });
}
export async function resetRoom(code: string) {
  await update(path(code), {
    "meta/phase": "lobby",
    assignments: null,
    responses: null,
    submitted: null,
    discussion: null,
    reveal: null,
    vault: null,
  });
}
export async function removePlayer(code: string, uid: string) {
  const snap = await get(path(code, `members/${uid}`));
  if (!snap.exists()) return;
  await update(path(code), {
    [`members/${uid}`]: null,
    [`seats/${snap.val().slot}`]: null,
    [`presence/${uid}`]: null,
  });
}
export async function takeOver(code: string, uid: string) {
  await set(path(code, "meta/hostId"), uid);
}
export function errorCode(error: unknown): string {
  if (error instanceof GameError) return error.code;
  const code = (error as { code?: string })?.code || "";
  if (code.includes("network")) return "network";
  if (code.includes("permission") || code === "PERMISSION_DENIED")
    return "permission";
  if (code.includes("operation-not-allowed")) return "authDisabled";
  if ((error as Error)?.message === "configuration") return "configuration";
  return "unknown";
}
