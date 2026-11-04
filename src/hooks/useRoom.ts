import { useEffect, useRef, useState } from "react";
import { identity } from "../lib/firebase";
import * as api from "../lib/rooms";
import type { RoomState } from "../lib/types";

/**
 * Live Firebase room subscription, presence and derived host/round state.
 * Firebase stays the single source of truth; this hook only mirrors it.
 */
export function useRoom(roomCode: string, onError: (code: string) => void) {
  const [uid, setUid] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const finishing = useRef(false);
  const errorRef = useRef(onError);
  useEffect(() => {
    errorRef.current = onError;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setConnected(false);
      return;
    }
    let stop = () => {};
    let off = () => {};
    let active = true;
    setRoom(null);
    void identity()
      .then((id) => {
        if (!active) return;
        setUid(id);
        stop = api.subscribeRoom(
          roomCode,
          id,
          (state) => {
            if (active) setRoom(state);
          },
          (e) => {
            if (active) errorRef.current(api.errorCode(e));
          },
        );
        off = api.presence(roomCode, id, setConnected);
      })
      .catch((e) => errorRef.current(api.errorCode(e)));
    return () => {
      active = false;
      stop();
      off();
    };
  }, [roomCode]);

  const meta = room?.meta ?? null;
  const members = room?.members || {};
  const me = members[uid];
  const host = Boolean(uid && meta?.hostId === uid);
  const list = Object.entries(members).sort(
    ([, a], [, b]) => a.slot - b.slot || a.joinedAt - b.joinedAt,
  );
  const count = list.length;
  const hostPresence = room?.presence[meta?.hostId || ""];
  const hostAway = Boolean(
    meta &&
    (hostPresence
      ? !hostPresence.online || hostPresence.lastSeen < now - 90000
      : meta.createdAt < now - 90000),
  );
  const canTakeOver =
    hostAway &&
    (!hostPresence ||
      (!hostPresence.online
        ? hostPresence.lastSeen < now - 30000
        : hostPresence.lastSeen < now - 90000));
  const completed = list.filter(
    ([id]) => room?.submitted[id] === meta?.roundId,
  ).length;
  const allReady =
    count >= 3 &&
    list.every(([id, m]) => m.ready && room?.presence[id]?.online);

  // The coordinating host publishes results as soon as everyone has answered.
  useEffect(() => {
    if (
      host &&
      meta?.phase === "answering" &&
      count > 0 &&
      completed === count &&
      !finishing.current &&
      connected
    ) {
      finishing.current = true;
      void api
        .finishAnswers(roomCode)
        .catch((e) => errorRef.current(api.errorCode(e)))
        .finally(() => {
          finishing.current = false;
        });
    }
  }, [host, meta?.phase, meta?.roundId, count, completed, connected, roomCode]);

  return {
    uid,
    room,
    meta,
    members,
    list,
    me,
    host,
    count,
    completed,
    allReady,
    hostAway,
    canTakeOver,
    connected,
    now,
  };
}
export type RoomView = ReturnType<typeof useRoom>;
