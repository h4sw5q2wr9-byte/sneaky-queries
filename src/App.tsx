import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Eye,
  HelpCircle,
  Link,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Plus,
  Radio,
  Settings2,
  ShieldQuestion,
  Sparkles,
  Smartphone,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { Button, Mask, Title } from "./components/ui";
import { SettingsFields } from "./components/SettingsFields";
import { LocalParty } from "./components/LocalParty";
import { configured, emulator, identity } from "./lib/firebase";
import { defaultSettings, validSetup } from "./lib/game";
import { localeDirection, translate } from "./lib/i18n";
import type { StringKey } from "./lib/i18n";
import * as api from "./lib/rooms";
import type { Locale, RoomState, Settings } from "./lib/types";

type Screen = "home" | "how" | "create" | "join" | "config" | "local";
const savedLocale = (): Locale =>
  localStorage.getItem("sq-locale") === "nl" ? "nl" : "en";
export default function App() {
  const [locale, setLocale] = useState<Locale>(savedLocale);
  const t = useCallback((key: StringKey) => translate(locale, key), [locale]);
  const invite = new URLSearchParams(location.search).get("room") || "";
  const [screen, setScreen] = useState<Screen>(
    invite
      ? "join"
      : new URLSearchParams(location.search).get("mode") === "local"
        ? "local"
        : "home",
  );
  const [nickname, setNickname] = useState(
    localStorage.getItem("sq-nickname") || "",
  );
  const [codeInput, setCodeInput] = useState(invite.toUpperCase());
  const [roomCode, setRoomCode] = useState(() =>
    !invite && new URLSearchParams(location.search).get("mode") === "local"
      ? ""
      : sessionStorage.getItem("sq-room") || "",
  );
  const [uid, setUid] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    ...defaultSettings,
    locale,
  });
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const finishing = useRef(false);
  const [confirm, setConfirm] = useState<{
    text: string;
    run: () => Promise<void>;
  } | null>(null);
  const meta = room?.meta;
  const members = room?.members || {};
  const me = members[uid];
  const host = Boolean(uid && meta?.hostId === uid);
  const list = Object.entries(members);
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
  useEffect(() => {
    localStorage.setItem("sq-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
  }, [locale]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!roomCode) return;
    let stop = () => {};
    let off = () => {};
    let active = true;
    setRoom(null);
    setError("");
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
            if (active) setError(api.errorCode(e));
          },
        );
        off = api.presence(roomCode, id, setConnected);
      })
      .catch((e) => setError(api.errorCode(e)));
    return () => {
      active = false;
      stop();
      off();
    };
  }, [roomCode]);
  useEffect(() => {
    setAnswer("");
  }, [meta?.roundId]);
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
        .catch((e) => setError(api.errorCode(e)))
        .finally(() => {
          finishing.current = false;
        });
    }
  }, [host, meta?.phase, meta?.roundId, count, completed, connected, roomCode]);
  async function act(task: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (roomCode && !connected) throw new api.GameError("network");
      await task();
    } catch (e) {
      setError(api.errorCode(e));
    } finally {
      setPending(false);
    }
  }
  function enter(code: string) {
    localStorage.setItem("sq-nickname", nickname.trim());
    sessionStorage.setItem("sq-room", code);
    setRoomCode(code);
    setEditing(false);
  }
  function exit() {
    sessionStorage.removeItem("sq-room");
    setRoomCode("");
    setRoom(null);
    setConnected(false);
    setScreen("home");
    setError("");
    setEditing(false);
    const url = new URL(location.href);
    url.searchParams.delete("room");
    history.replaceState(null, "", url);
  }
  function go(screen: Screen) {
    const url = new URL(location.href);
    if (screen === "local") {
      url.searchParams.set("mode", "local");
      url.searchParams.delete("room");
    } else url.searchParams.delete("mode");
    history.replaceState(null, "", url);
    setError("");
    setScreen(screen);
    window.scrollTo(0, 0);
  }
  async function copyInvite() {
    const url = new URL(location.href);
    url.searchParams.set("room", roomCode);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCodeInput(url.href);
      setCopied(true);
    }
  }
  async function share() {
    const url = new URL(location.href);
    url.searchParams.set("room", roomCode);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sneaky Queries", url: url.href });
      } catch {
        /* Cancelled share sheet. */
      }
    } else await copyInvite();
  }
  const ask = (text: string, task: () => Promise<void>) =>
    setConfirm({ text, run: task });
  const playerList = (removable = false) => (
    <div className="player-list">
      {list.map(([id, m], index) => (
        <div className="player-row" key={id}>
          <span className={`avatar avatar-${index % 5}`}>
            {m.nickname.slice(0, 1).toUpperCase()}
          </span>
          <div className="player-name">
            {m.nickname} <small>{id === uid && `(${t("you")})`}</small>
            {id === meta?.hostId && (
              <span className="host-tag">{t("host")}</span>
            )}
            <span className="player-status">
              {!room?.presence[id]?.online
                ? t("offline")
                : meta?.phase === "lobby"
                  ? m.ready
                    ? t("ready")
                    : t("notReady")
                  : room?.submitted[id] === meta?.roundId
                    ? t("ready")
                    : t("notReady")}
            </span>
          </div>
          {m.ready && meta?.phase === "lobby" ? (
            <Check size={18} className="mint" />
          ) : (
            <span
              className={`presence-dot ${room?.presence[id]?.online ? "on" : ""}`}
            />
          )}{" "}
          {removable && host && id !== uid && (
            <button
              className="icon-button remove"
              aria-label={`${t("remove")} ${m.nickname}`}
              onClick={() =>
                ask(t("removeConfirm"), () => api.removePlayer(roomCode, id))
              }
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
  const setupFields = (inRoom = false) => (
    <SettingsFields
      settings={settings}
      onChange={setSettings}
      locale={locale}
      minPlayers={inRoom ? count : 3}
    />
  );
  const formNickname = (
    <label className="field-label">
      {t("nickname")}
      <input
        name="nickname"
        autoComplete="nickname"
        maxLength={20}
        required
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder={t("nicknamePlaceholder")}
      />
    </label>
  );
  const loading = (
    <div className="center-state">
      <LoaderCircle className="spin" size={32} />
      <p>{t("loading")}</p>
      {error && (
        <Button secondary onClick={exit}>
          {t("returnHome")}
        </Button>
      )}
    </div>
  );
  let content: ReactNode;
  if (roomCode) {
    if (!meta) content = loading;
    else if (meta.expiresAt < now)
      content = (
        <div className="panel">
          <Title title={t("expiredTitle")} sub={t("expiredBody")} />
          <Button onClick={exit}>{t("returnHome")}</Button>
        </div>
      );
    else if (!me)
      content = (
        <div className="panel">
          <Title title={t("removedTitle")} sub={t("removedBody")} />
          <Button onClick={exit}>{t("returnHome")}</Button>
        </div>
      );
    else if (editing && host)
      content = (
        <div className="narrow">
          <Title title={t("currentSetup")} />
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await api.saveSettings(roomCode, settings);
                setEditing(false);
              });
            }}
          >
            {setupFields(true)}
            <Button disabled={pending || !connected} type="submit">
              {t("save")}
              <Check size={18} />
            </Button>
            <Button secondary type="button" onClick={() => setEditing(false)}>
              {t("cancel")}
            </Button>
          </form>
        </div>
      );
    else if (meta.phase === "lobby")
      content = (
        <div className="narrow">
          <Title
            eyebrow={t("round") + " " + (meta.round + 1)}
            title={t("lobbyTitle")}
            sub={t("lobbySub")}
          />
          <div className="panel invite-panel">
            <span className="eyebrow">{t("invite")}</span>
            <div className="room-code" aria-label={t("roomCode")}>
              {roomCode}
            </div>
            <div className="invite-actions">
              <button className="text-button" onClick={() => void copyInvite()}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? t("copied") : t("copy")}
              </button>
              <button
                className="icon-button"
                onClick={() => void share()}
                aria-label={t("share")}
              >
                <Link size={18} />
              </button>
            </div>
            {copied && codeInput.startsWith("http") && (
              <input
                readOnly
                value={codeInput}
                aria-label={t("copy")}
                onFocus={(e) => e.target.select()}
              />
            )}
          </div>
          <div className="panel">
            <div className="section-label">
              <h2>
                <Users size={18} />{" "}
                {t("players").replace("3–10", String(count))}
              </h2>
              <span>
                {count}/{meta.settings.capacity}
              </span>
            </div>
            {playerList(true)}
            <Button
              secondary
              disabled={pending || !connected}
              onClick={() =>
                void act(() => api.ready(roomCode, uid, !me.ready))
              }
            >
              {me.ready ? <Check size={18} /> : <Plus size={18} />}{" "}
              {me.ready ? t("unready") : t("readyButton")}
            </Button>
            {host ? (
              <>
                <Button
                  disabled={
                    pending ||
                    !connected ||
                    !allReady ||
                    !validSetup(count, meta.settings.impostors)
                  }
                  onClick={() => void act(() => api.startRound(roomCode))}
                >
                  {t("start")}
                  <ArrowRight size={18} />
                </Button>
                <p className="field-hint center">
                  {count < 3
                    ? t("needPlayers")
                    : !validSetup(count, meta.settings.impostors)
                      ? t("error_setup")
                      : !allReady
                        ? t("waitReady")
                        : ""}
                </p>
                <button
                  className="text-button center-button"
                  onClick={() => {
                    setSettings(meta.settings);
                    setEditing(true);
                  }}
                >
                  <Settings2 size={15} /> {t("changeSetup")}
                </button>
              </>
            ) : (
              <p className="field-hint center">{t("waitHost")}</p>
            )}
          </div>
        </div>
      );
    else if (meta.phase === "answering") {
      const sent = room?.submitted[uid] === meta.roundId;
      content = (
        <div className="narrow">
          <Title
            eyebrow={`${t("round")} ${meta.round}`}
            title={t(sent ? "waitingTitle" : "privateTitle")}
            sub={t(sent ? "waitingSub" : "privateSub")}
          />
          {!sent ? (
            <form
              className="panel question-panel"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void act(() =>
                  api.submitAnswer(roomCode, uid, meta.roundId, answer),
                );
              }}
            >
              <div className="eyebrow">
                <ShieldQuestion size={15} />
                {t("privateLabel")}
              </div>
              {room?.assignment?.roundId === meta.roundId ? (
                <h2 className="question">{room.assignment.question}</h2>
              ) : (
                <LoaderCircle className="spin" />
              )}
              <label className="field-label">
                {t("answerLabel")}
                <textarea
                  maxLength={160}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t("answerPlaceholder")}
                  required
                  rows={3}
                />
              </label>
              <div className="answer-count">{answer.length}/160</div>
              <Button
                type="submit"
                disabled={
                  pending ||
                  !connected ||
                  !answer.trim() ||
                  room?.assignment?.roundId !== meta.roundId
                }
              >
                {pending ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Check size={18} />
                )}{" "}
                {t("lockAnswer")}
              </Button>
              <p className="field-hint center">{t("answerHint")}</p>
              <div className="round-progress" aria-live="polite">
                {completed}/{count} {t("submitted")}
              </div>
            </form>
          ) : (
            <div className="panel waiting-panel">
              <div className="success-orbit">
                <Check size={34} />
              </div>
              <div className="progress-numbers">
                {completed}
                <span> / {count}</span>
              </div>
              <p>{t("submitted")}</p>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={count}
                aria-valuenow={completed}
                aria-label={t("submitted")}
              >
                <div
                  style={{
                    width: `${(100 * completed) / Math.max(count, 1)}%`,
                  }}
                />
              </div>
              <p className="field-hint">
                {completed === count
                  ? t("allAnswered")
                  : t("waitingPlayers") +
                    " " +
                    list
                      .filter(([id]) => room?.submitted[id] !== meta.roundId)
                      .map(([, m]) => m.nickname)
                      .join(", ")}
              </p>
            </div>
          )}
          {host && (
            <details className="panel manage">
              <summary>
                {t("manage")}
                <ChevronDown size={16} />
              </summary>
              <p className="field-hint">{t("missingPlayers")}</p>
              {playerList(true)}
              {completed === count && (
                <button
                  className="text-button"
                  disabled={pending || !connected}
                  onClick={() => void act(() => api.finishAnswers(roomCode))}
                >
                  {t("tryAgain")}
                </button>
              )}
              <button
                className="text-button"
                onClick={() =>
                  ask(t("abortConfirm"), () => api.resetRoom(roomCode))
                }
              >
                {t("abort")}
              </button>
            </details>
          )}
        </div>
      );
    } else if (meta.phase === "discussion")
      content = (
        <div className="narrow">
          <Title
            eyebrow={`${t("round")} ${meta.round} · ${t("answers")}`}
            title={t("discussionTitle")}
            sub={t("discussionSub")}
          />
          {room?.discussion?.roundId === meta.roundId ? (
            <>
              <div className="panel original-panel">
                <div className="eyebrow">{t("original")}</div>
                <h2 className="question">{room.discussion.original}</h2>
              </div>
              <div className="answer-list">
                {Object.entries(room.discussion.answers).map(([id, a], i) => (
                  <div
                    key={id}
                    className="answer-card"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <div className={`avatar avatar-${i % 5}`}>
                      {a.nickname.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="answer-name">{a.nickname}</span>
                      <p>{a.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
              {host ? (
                <Button
                  disabled={pending || !connected}
                  onClick={() => void act(() => api.revealRound(roomCode))}
                >
                  <Eye size={20} />
                  {t("revealButton")}
                </Button>
              ) : (
                <p className="field-hint center">{t("hostReveal")}</p>
              )}
            </>
          ) : (
            loading
          )}
        </div>
      );
    else
      content = (
        <div className="narrow reveal-screen">
          <div className="reveal-emblem">
            <Mask />
          </div>
          <Title
            eyebrow={`${t("round")} ${meta.round} · ${t("revealLabel")}`}
            title={t("revealTitle")}
            sub={t("revealSub")}
          />
          {room?.reveal?.roundId === meta.roundId ? (
            <>
              <div className="reveal-list">
                {Object.entries(room.reveal.impostors).map(([id, p], i) => (
                  <div
                    className="panel impostor-card"
                    key={id}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="reveal-person">
                      <span className="reveal-avatar">
                        {p.nickname.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <h2>{p.nickname}</h2>
                        <span className="variation">
                          {t(
                            p.variation === "I1"
                              ? "opposite"
                              : p.variation === "I2"
                                ? "shifted"
                                : "different",
                          )}
                        </span>
                      </div>
                      <Sparkles size={24} />
                    </div>
                    <div className="eyebrow">{t("theirQuestion")}</div>
                    <p className="revealed-question">{p.question}</p>
                    {room.discussion?.answers[id] && (
                      <p className="quote">
                        “{room.discussion.answers[id].answer}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="panel normal-card">
                <div className="eyebrow">{t("normalQuestion")}</div>
                <h2>{room?.discussion?.original}</h2>
              </div>
              {host ? (
                <div className="replay-actions">
                  <Button
                    disabled={
                      pending ||
                      !connected ||
                      !allReady ||
                      !validSetup(count, meta.settings.impostors)
                    }
                    onClick={() => void act(() => api.startRound(roomCode))}
                  >
                    {t("playAgain")}
                    <ArrowRight size={18} />
                  </Button>
                  <Button
                    secondary
                    disabled={pending || !connected}
                    onClick={() => void act(() => api.resetRoom(roomCode))}
                  >
                    <Settings2 size={18} />
                    {t("changeSetup")}
                  </Button>
                  {!allReady && (
                    <p className="field-hint center">{t("waitReady")}</p>
                  )}
                </div>
              ) : (
                <p className="field-hint center">{t("waitReplay")}</p>
              )}
            </>
          ) : (
            <p className="center">{t("revealWait")}</p>
          )}
        </div>
      );
  } else if (screen === "local") content = <LocalParty locale={locale} />;
  else if (screen === "home")
    content = (
      <>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <span />
              {t("edition")}
            </span>
            <h1>
              {t("hero1")}
              <br />
              <span>{t("hero2")}</span>
            </h1>
            <p className="hero-description">{t("intro")}</p>
            <div className="hero-actions">
              <Button onClick={() => go("create")}>
                <Plus size={21} />
                {t("create")}
                <ArrowRight size={18} />
              </Button>
              <Button secondary onClick={() => go("join")}>
                <Users size={20} />
                {t("join")}
              </Button>
            </div>
            <button
              aria-label={t("passPlay")}
              className="pass-play-entry"
              onClick={() => go("local")}
            >
              <span className="pass-play-icon">
                <Smartphone size={23} />
              </span>
              <span>
                <strong>{t("passPlay")}</strong>
                <small>{t("passPlaySub")}</small>
              </span>
              <ArrowRight size={18} />
            </button>
            <div className="feature-row">
              <span>
                <Users size={15} />
                {t("players")}
              </span>
              <span>
                <Radio size={15} />
                {t("phones")}
              </span>
              <span className="free-tag">{t("free")}</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="art-orbit orbit-one" />
            <span className="art-orbit orbit-two" />
            <span className="art-star star-one">✦</span>
            <span className="art-star star-two">✧</span>
            <span className="art-dot" />
            <div className="floating-question question-back">
              <span>?</span>
              <i />
              <i />
            </div>
            <div className="floating-question question-front">
              <div className="card-mini-logo">
                <Mask small /> SQ
              </div>
              <Mask />
              <div className="secret-lines">
                <i />
                <i />
              </div>
              <span className="card-bottom">{t("cardTagline")}</span>
            </div>
            <div className="floating-bubble bubble-one">👀</div>
            <div className="floating-bubble bubble-two">🤔</div>
            <span className="art-scribble">{t("whoMe")}</span>
          </div>
        </section>
        <section className="home-bottom">
          <div className="section-label">
            <span className="eyebrow">{t("how")}</span>
            <button className="text-button" onClick={() => go("how")}>
              {t("navHow")}
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="teaser-grid">
            {[1, 2, 3].map((n) => (
              <div className="teaser" key={n}>
                <span className="step-number">0{n}</span>
                <div>
                  <h2>{t(`step${n}` as StringKey)}</h2>
                  <p>{t(`step${n}body` as StringKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  else if (screen === "how")
    content = (
      <div className="narrow">
        <Title title={t("how")} sub={t("howSub")} />
        <div className="panel how-panel">
          {[1, 2, 3, 4].map((n) => (
            <div className="how-step" key={n}>
              <span className="step-number">0{n}</span>
              <div>
                <h2>{t(`step${n}` as StringKey)}</h2>
                <p>{t(`step${n}body` as StringKey)}</p>
              </div>
            </div>
          ))}
          <div className="local-how-note">
            <Smartphone size={20} />
            <div>
              <h2>{t("localHowTitle")}</h2>
              <p>{t("localHowBody")}</p>
              <button className="text-button" onClick={() => go("local")}>
                {t("passPlay")}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <p className="how-note">
            <Sparkles size={18} />
            {t("howNote")}
          </p>
          <Button onClick={() => go("create")}>
            {t("create")}
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  else if (screen === "config")
    content = (
      <div className="narrow">
        <div className="panel config-panel">
          <Settings2 size={36} />
          <Title
            eyebrow={t("configLabel")}
            title={t("configTitle")}
            sub={t("configBody")}
          />
          <code>.env.local → npm run build</code>
          <Button onClick={() => go("home")}>{t("returnHome")}</Button>
        </div>
      </div>
    );
  else
    content = (
      <div className="narrow">
        <Title
          title={t(screen === "create" ? "setupTitle" : "joinTitle")}
          sub={t(screen === "create" ? "setupSub" : "joinSub")}
        />
        <form
          className="panel setup-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!configured) {
              go("config");
              return;
            }
            void act(async () => {
              const code =
                screen === "create"
                  ? await api.createRoom(nickname, settings)
                  : await api.joinRoom(codeInput, nickname);
              enter(code);
            });
          }}
        >
          {formNickname}
          {screen === "create" ? (
            setupFields()
          ) : (
            <label className="field-label">
              {t("roomCode")}
              <input
                name="roomCode"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="code-input"
                value={codeInput}
                maxLength={6}
                onChange={(e) =>
                  setCodeInput(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
                placeholder={t("codePlaceholder")}
                required
                minLength={6}
              />
            </label>
          )}
          <Button
            disabled={
              pending ||
              !nickname.trim() ||
              (screen === "join" && codeInput.length !== 6)
            }
            type="submit"
          >
            {pending ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {t(screen === "create" ? "createButton" : "joinButton")}
          </Button>
          {!configured && (
            <p className="field-hint center">{t("configLabel")}</p>
          )}
        </form>
      </div>
    );
  return (
    <>
      <div className="app-shell">
        <header>
          <button
            className="brand"
            onClick={() => {
              if (!roomCode) go("home");
            }}
            aria-label="Sneaky Queries"
          >
            <div className="brand-icon">
              <Mask small />
            </div>
            <span>
              SNEAKY<span>QUERIES</span>
            </span>
            <b>1.0</b>
          </button>
          <div className="header-actions">
            {!roomCode && (
              <button
                className="text-button how-link"
                onClick={() => go("how")}
              >
                <HelpCircle size={16} />
                {t("navHow")}
              </button>
            )}
            <label className="locale-switch">
              <span className="sr-only">{t("language")}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                <option value="en">EN</option>
                <option value="nl">NL</option>
              </select>
            </label>
          </div>
        </header>
        {emulator && <div className="emulator-banner">{t("emulator")}</div>}
        {roomCode && (
          <div className="room-toolbar">
            <span
              className={`connection-label ${connected ? "" : "disconnected"}`}
            >
              {connected ? <Radio size={13} /> : <WifiOff size={13} />}{" "}
              {connected ? t("connected") : t("offline")}
              <span className="toolbar-code">{roomCode}</span>
            </span>
            <button
              className="text-button"
              onClick={() =>
                ask(t("leaveConfirm"), async () => {
                  if (!host && connected) await api.removePlayer(roomCode, uid);
                  exit();
                })
              }
            >
              <LogOut size={14} />
              {t("leave")}
            </button>
          </div>
        )}
        {!roomCode && screen !== "home" && (
          <button
            className="text-button back-button"
            onClick={() => go("home")}
          >
            <ArrowLeft size={16} />
            {t("back")}
          </button>
        )}
        {roomCode && !connected && room && (
          <div className="notice" role="status">
            <WifiOff size={17} />
            {t("reconnecting")}
          </div>
        )}
        {hostAway && !host && me && (
          <div className="notice">
            <span>{t("hostAway")}</span>
            <button
              disabled={!canTakeOver || pending || !connected}
              className="text-button"
              onClick={() => void act(() => api.takeOver(roomCode, uid))}
            >
              {t("takeOver")}
            </button>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <span>
              {t(`error_${error}` as StringKey) || t("error_unknown")}
            </span>
            <button
              className="icon-button"
              aria-label={t("dismiss")}
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
            {roomCode && (
              <button className="text-button" onClick={exit}>
                {t("returnHome")}
              </button>
            )}
          </div>
        )}
        <main
          key={roomCode ? meta?.phase || "loading" : screen}
          className="screen-enter"
        >
          {content}
        </main>
        <footer>
          <span>{t("footer")}</span>
          <span>
            {screen === "home" && !roomCode ? t("smallPrint") : t("tagline")}
          </span>
          <MessageCircle size={14} />
        </footer>
      </div>
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div
            className="modal panel"
            role="alertdialog"
            aria-modal="true"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setConfirm(null);
              }
              if (event.key === "Tab") {
                const buttons = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ),
                );
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title">{confirm.text}</h2>
            <Button
              autoFocus
              disabled={pending}
              onClick={() => {
                const task = confirm.run;
                setConfirm(null);
                void act(task);
              }}
            >
              {t("confirm")}
            </Button>
            <Button secondary onClick={() => setConfirm(null)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
