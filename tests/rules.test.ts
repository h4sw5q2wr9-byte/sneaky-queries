import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { get, ref, set, update } from "firebase/database";
let env: RulesTestEnvironment;
const db = (uid: string) => env.authenticatedContext(uid).database();
const room = (uid: string, path = "") =>
  ref(db(uid), `rooms/ABC234${path ? "/" + path : ""}`);
const member = (name: string, slot = 0) => ({
  nickname: name,
  ready: true,
  joinedAt: Date.now(),
  slot,
});
const base = () => ({
  meta: {
    hostId: "host",
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000,
    phase: "lobby",
    round: 0,
    roundId: "none",
    settings: {
      capacity: 3,
      impostors: 1,
      categories: ["party"],
      locale: "en",
    },
  },
  members: { host: member("Host") },
  seats: { 0: "host" },
});
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-sneaky-queries",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearDatabase();
  await assertSucceeds(set(room("host"), base()));
});
afterAll(async () => {
  await env.cleanup();
});
async function add(uid: string, slot: number) {
  return update(room(uid), {
    [`members/${uid}`]: member(uid, slot),
    [`seats/${slot}`]: uid,
  });
}
async function players() {
  await add("alice", 1);
  await add("bob", 2);
}
async function start() {
  await players();
  await update(room("host"), {
    "meta/phase": "answering",
    "meta/round": 1,
    "meta/roundId": "r1",
    assignments: {
      host: { roundId: "r1", question: "Normal?" },
      alice: { roundId: "r1", question: "Normal?" },
      bob: { roundId: "r1", question: "Different?" },
    },
    vault: {
      roundId: "r1",
      original: "Normal?",
      impostors: { bob: { question: "Different?" } },
    },
  });
}
async function answer(uid: string, text = "My answer") {
  return update(room(uid), {
    [`responses/${uid}`]: { roundId: "r1", answer: text },
    [`submitted/${uid}`]: "r1",
  });
}
describe("Firebase authority and concurrency", () => {
  it("denies unauthenticated access and broad room reads", async () => {
    await assertFails(
      get(ref(env.unauthenticatedContext().database(), "rooms/ABC234/meta")),
    );
    await assertFails(get(room("host")));
    await assertFails(set(room("stranger", "meta/phase"), "reveal"));
  });
  it("admits concurrent joins without exceeding capacity", async () => {
    const attempts = await Promise.allSettled(
      ["alice", "bob", "charlie", "dana"].map((uid, i) =>
        add(uid, (i % 2) + 1),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(2);
    expect((await get(room("host", "members"))).size).toBe(3);
  });
  it("restricts settings, members and nicknames", async () => {
    await players();
    await assertFails(set(room("alice", "meta/settings/capacity"), 10));
    await assertFails(set(room("alice", "members/bob/nickname"), "Hacked"));
    await assertFails(set(room("alice", "members/alice/nickname"), "Changed"));
    await assertFails(set(room("eve", "members/eve"), member("x".repeat(21))));
    await assertSucceeds(set(room("alice", "members/alice/ready"), false));
  });
  it("rejects joining an active or expired room", async () => {
    await start();
    await assertFails(set(room("eve", "members/eve"), member("Eve")));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await update(ref(ctx.database(), "rooms/ABC234"), {
        "meta/phase": "lobby",
        "meta/expiresAt": Date.now() - 1,
      });
    });
    await assertFails(set(room("eve", "members/eve"), member("Eve")));
  });
  it("allows only own private assignment; vault and results stay private", async () => {
    await start();
    expect(
      (await assertSucceeds(get(room("alice", "assignments/alice")))).val()
        .question,
    ).toBe("Normal?");
    for (const path of [
      "assignments",
      "assignments/bob",
      "vault",
      "responses",
      "discussion",
      "reveal",
    ])
      await assertFails(get(room("alice", path)));
    await assertSucceeds(get(room("host", "vault")));
  });
  it("accepts a single answer and matching status, rejects impersonation, overlong and stale writes", async () => {
    await start();
    await assertFails(set(room("alice", "submitted/alice"), "r1"));
    await assertFails(answer("alice", " ".repeat(4)));
    await assertFails(answer("alice", "x".repeat(161)));
    await assertFails(
      set(room("alice", "responses/bob"), { roundId: "r1", answer: "Hacked" }),
    );
    await assertFails(
      update(room("alice"), {
        "responses/alice": { roundId: "old", answer: "Stale" },
        "submitted/alice": "old",
      }),
    );
    await assertSucceeds(answer("alice"));
    await assertFails(answer("alice", "Changed"));
    expect((await get(room("bob", "submitted"))).val()).toEqual({
      alice: "r1",
    });
    await assertFails(get(room("bob", "responses/alice")));
  });
  it("supports discussion, reveal, replay and reset with phase-gated reads", async () => {
    await start();
    for (const uid of ["host", "alice", "bob"]) await answer(uid);
    const discussion = {
      roundId: "r1",
      original: "Normal?",
      category: "party",
      answers: { alice: { nickname: "Alice", answer: "My answer" } },
    };
    await assertFails(set(room("alice", "meta/phase"), "discussion"));
    await assertSucceeds(
      update(room("host"), { "meta/phase": "discussion", discussion }),
    );
    await assertSucceeds(get(room("alice", "discussion")));
    await assertFails(get(room("alice", "reveal")));
    await assertSucceeds(
      update(room("host"), {
        "meta/phase": "reveal",
        reveal: {
          roundId: "r1",
          impostors: {
            bob: { nickname: "Bob", question: "Different?", variation: "I1" },
          },
        },
      }),
    );
    await assertSucceeds(get(room("alice", "reveal")));
    await assertSucceeds(
      update(room("host"), {
        "meta/phase": "answering",
        "meta/roundId": "r2",
        "meta/round": 2,
        assignments: { alice: { roundId: "r2", question: "Next?" } },
        responses: null,
        submitted: null,
        discussion: null,
        reveal: null,
      }),
    );
    await assertFails(get(room("alice", "discussion")));
    await assertSucceeds(
      update(room("host"), {
        "meta/phase": "lobby",
        assignments: null,
        responses: null,
        submitted: null,
        vault: null,
      }),
    );
  });
  it("preserves own reads across a fresh client context and revokes removed players", async () => {
    await start();
    await answer("alice");
    const fresh = env.authenticatedContext("alice").database();
    expect(
      (await get(ref(fresh, "rooms/ABC234/assignments/alice"))).val().roundId,
    ).toBe("r1");
    await assertSucceeds(
      update(room("host"), {
        "members/alice": null,
        "presence/alice": null,
        "seats/1": null,
      }),
    );
    await assertFails(get(room("alice", "assignments/alice")));
    await assertFails(answer("alice"));
  });
  it("allows host takeover only after grace; new host inherits the vault", async () => {
    await start();
    await set(room("host", "presence/host"), {
      online: false,
      lastSeen: Date.now(),
    });
    await assertFails(set(room("alice", "meta/hostId"), "alice"));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), "rooms/ABC234/presence/host"), {
        online: false,
        lastSeen: Date.now() - 31000,
      });
    });
    await assertSucceeds(set(room("alice", "meta/hostId"), "alice"));
    await assertSucceeds(get(room("alice", "vault")));
    await assertFails(get(room("host", "vault")));
    await assertFails(set(room("host", "meta/phase"), "discussion"));
  });
});
