import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  HelpCircle,
  Link,
  LoaderCircle,
  LogOut,
  Plus,
  Radio,
  Settings2,
  ShieldQuestion,
  Smartphone,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { Button, ConfirmDialog, Mask, Title } from "./components/ui";
import { SetupWizard } from "./components/SetupWizard";
import { LocalParty } from "./components/LocalParty";
import { HowToPlay } from "./components/HowToPlay";
import { PlayerRoster } from "./components/PlayerRoster";
import { RoundDiscussion, RoundReveal } from "./components/RoundViews";
import { configured, emulator, identity } from "./lib/firebase";
import { defaultSettings, validSetup } from "./lib/game";
import { localeDirection, translate } from "./lib/i18n";
import type { StringKey } from "./lib/i18n";
import type { LocalPhase } from "./lib/local";
import * as api from "./lib/rooms";
import type { Locale, RoomState, Settings } from "./lib/types";
type Screen =
  "home" | "how" | "online" | "create" | "join" | "config" | "local";
const savedLocale = (): Locale =>
  localStorage.getItem("sq-locale") === "nl" ? "nl" : "en";
export default function App() {
  const [locale, setLocale] = useState<Locale>(savedLocale);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const onLocalPhase = useCallback((phase: LocalPhase, roundLocale: Locale) => {
    setLocalPhase(phase);
    if (phase !== "setup") setLocale(roundLocale);
  }, []);
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
    setSettings((current) => ({ ...current, locale }));
  }, [locale]);
  useEffect(() => {
    if (meta?.settings.locale) setLocale(meta.settings.locale);
  }, [meta?.settings.locale]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => {
      const height =
        viewport?.scale === 1 ? viewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-height", height + "px");
      const editingField =
        document.activeElement instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
      setKeyboardVisible(!!editingField && height < window.innerHeight * 0.8);
      if (
        height < window.innerHeight * 0.8 &&
        document.activeElement instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      )
        requestAnimationFrame(() =>
          document.activeElement?.scrollIntoView({ block: "nearest" }),
        );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    document.addEventListener("focusin", resize);
    document.addEventListener("focusout", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      document.removeEventListener("focusin", resize);
      document.removeEventListener("focusout", resize);
    };
  }, []);
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
  const languageDisabled = roomCode
    ? !host || meta?.phase !== "lobby" || pending || !connected
    : screen === "local" && localPhase !== "setup";
  function changeLanguage(next: Locale) {
    if (languageDisabled) return;
    if (roomCode && meta) {
      void act(() =>
        api.saveSettings(roomCode, { ...meta.settings, locale: next }),
      );
    } else setLocale(next);
  }
  const roster = (removable = false) =>
    meta && room ? (
      <PlayerRoster
        members={members}
        presence={room.presence}
        submitted={room.submitted}
        uid={uid}
        hostId={meta.hostId}
        roundId={meta.roundId}
        phase={meta.phase}
        locale={locale}
        onRemove={
          removable && host
            ? (id) =>
                ask(t("removeConfirm"), () => api.removePlayer(roomCode, id))
            : undefined
        }
      />
    ) : null;
  const loading = (
    <div className="center-state">
      <LoaderCircle className="spin" size={30} />
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
        <div className="narrow center-state">
          <Title title={t("expiredTitle")} sub={t("expiredBody")} />
          <Button onClick={exit}>{t("returnHome")}</Button>
        </div>
      );
    else if (!me)
      content = (
        <div className="narrow center-state">
          <Title title={t("removedTitle")} sub={t("removedBody")} />
          <Button onClick={exit}>{t("returnHome")}</Button>
        </div>
      );
    else if (editing && host)
      content = (
        <div className="narrow">
          <SetupWizard
            mode="edit"
            onCancel={() => setEditing(false)}
            settings={settings}
            onChange={setSettings}
            locale={locale}
            minPlayers={Math.max(3, count)}
            pending={pending}
            completeLabel="save"
            onComplete={() =>
              void act(async () => {
                await api.saveSettings(roomCode, { ...settings, locale });
                setEditing(false);
              })
            }
          />
        </div>
      );
    else if (meta.phase === "lobby")
      content = (
        <div className="narrow lobby-screen">
          <Title title={t("lobbyTitle")} sub={t("lobbySub")} />
          <div className="panel invite-panel">
            <div>
              <span className="eyebrow">{t("roomCode")}</span>
              <div className="room-code" aria-label={t("roomCode")}>
                {roomCode}
              </div>
            </div>
            <div className="invite-actions">
              <button
                className="icon-button"
                aria-label={t("copy")}
                onClick={() => void copyInvite()}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
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
          <div className="lobby-roster">
            <div className="section-label">
              <h2>{t("players")}</h2>
              <span>
                {count}/{meta.settings.capacity}
              </span>
            </div>
            {roster(true)}
          </div>
          <div className="action-dock lobby-actions">
            <Button
              secondary
              disabled={pending || !connected}
              onClick={() =>
                void act(() => api.ready(roomCode, uid, !me.ready))
              }
            >
              {me.ready ? <Check size={17} /> : <Plus size={17} />}{" "}
              {t(me.ready ? "unready" : "readyButton")}
            </Button>
            {host && (
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
                <ArrowRight size={17} />
              </Button>
            )}
          </div>
          <div className="lobby-caption">
            <p className="field-hint">
              {count < 3
                ? t("needPlayers")
                : !validSetup(count, meta.settings.impostors)
                  ? t("error_setup")
                  : !allReady
                    ? t("waitReady")
                    : host
                      ? ""
                      : t("waitHost")}
            </p>
            {host && (
              <button
                className="icon-button"
                aria-label={t("changeSetup")}
                onClick={() => {
                  setSettings(meta.settings);
                  setEditing(true);
                }}
              >
                <Settings2 size={17} />
              </button>
            )}
          </div>
        </div>
      );
    else if (meta.phase === "answering") {
      const sent = room?.submitted[uid] === meta.roundId;
      content = (
        <div
          className={`narrow ${sent ? "waiting-screen" : "question-screen"}`}
        >
          <Title
            eyebrow={`${t("round")} ${meta.round}`}
            title={t(sent ? "waitingTitle" : "privateTitle")}
            sub={sent ? t("waitingSub") : undefined}
          />
          {!sent ? (
            <form
              className="panel question-panel"
              onSubmit={(e) => {
                e.preventDefault();
                void act(() =>
                  api.submitAnswer(roomCode, uid, meta.roundId, answer),
                );
              }}
            >
              <div className="eyebrow">
                <ShieldQuestion size={14} />
                {t("privateLabel")}
              </div>
              {room?.assignment?.roundId === meta.roundId ? (
                <h2 className="question scroll-region">
                  {room.assignment.question}
                </h2>
              ) : (
                <LoaderCircle className="spin" />
              )}
              <div className="answer-field">
                <label htmlFor="online-answer">{t("answerLabel")}</label>
                <span>{answer.length}/160</span>
                <textarea
                  id="online-answer"
                  maxLength={160}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t("answerPlaceholder")}
                  required
                  rows={2}
                />
              </div>
              <p className="field-hint">{t("answerHint")}</p>
              <div className="action-dock">
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
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Check size={17} />
                  )}{" "}
                  {t("lockAnswer")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="panel waiting-panel">
              <div className="stamp-mark">
                <Check size={40} />
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
              <p className="field-hint scroll-region">
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
              {roster(true)}
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
      content =
        room?.discussion?.roundId === meta.roundId ? (
          <RoundDiscussion
            locale={locale}
            round={meta.round}
            original={room.discussion.original}
            answers={room.discussion.answers}
            onReveal={
              host ? () => void act(() => api.revealRound(roomCode)) : undefined
            }
            disabled={pending || !connected}
          />
        ) : (
          loading
        );
    else
      content =
        room?.reveal?.roundId === meta.roundId && room.discussion ? (
          <RoundReveal
            locale={locale}
            round={meta.round}
            original={room.discussion.original}
            answers={room.discussion.answers}
            impostors={room.reveal.impostors}
            onReplay={
              host ? () => void act(() => api.startRound(roomCode)) : undefined
            }
            onSetup={
              host ? () => void act(() => api.resetRoom(roomCode)) : undefined
            }
            disabled={
              pending ||
              !connected ||
              !allReady ||
              !validSetup(count, meta.settings.impostors)
            }
            setupDisabled={pending || !connected}
          />
        ) : (
          loading
        );
  } else if (screen === "local")
    content = <LocalParty locale={locale} onPhaseChange={onLocalPhase} />;
  else if (screen === "home")
    content = (
      <section className="home-screen">
        <div className="home-deck" aria-hidden="true">
          <div className="deck-card back">?</div>
          <div className="deck-card front">
            <span>SQ</span>
            <Mask />
            <i>?</i>
          </div>
          <span className="deck-spark one">✦</span>
          <span className="deck-spark two">✧</span>
        </div>
        <div className="home-heading">
          <h1>
            {t("hero1")} <span>{t("hero2")}</span>
          </h1>
          <p>{t("intro")}</p>
        </div>
        <div className="mode-options">
          <button
            className="mode-card pass-play-entry"
            aria-label={t("passPlay")}
            onClick={() => go("local")}
          >
            <span className="mode-icon">
              <Smartphone size={22} />
            </span>
            <span>
              <strong>{t("passPlay")}</strong>
              <small>{t("passPlaySub")}</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <button
            className="mode-card online-entry"
            aria-label={t("onlineMode")}
            onClick={() => go("online")}
          >
            <span className="mode-icon">
              <Users size={22} />
            </span>
            <span>
              <strong>{t("onlineMode")}</strong>
              <small>{t("onlineSub")}</small>
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="home-facts">
          <span>{t("players")}</span>
          <i />
          <span>{t("free")}</span>
        </div>
      </section>
    );
  else if (screen === "online")
    content = (
      <section className="narrow online-choice">
        <div className="choice-symbol">
          <Users size={40} />
        </div>
        <Title title={t("onlineTitle")} sub={t("onlineHint")} />
        <div className="choice-actions">
          <Button onClick={() => go("create")}>
            <Plus size={18} />
            {t("create")}
            <ArrowRight size={18} />
          </Button>
          <Button secondary onClick={() => go("join")}>
            <Users size={18} />
            {t("join")}
          </Button>
        </div>
      </section>
    );
  else if (screen === "how")
    content = <HowToPlay locale={locale} onPlay={() => go("home")} />;
  else if (screen === "create")
    content = (
      <div className="narrow">
        <SetupWizard
          mode="online"
          settings={settings}
          onChange={setSettings}
          locale={locale}
          nickname={nickname}
          onNickname={setNickname}
          pending={pending}
          completeLabel="createButton"
          onComplete={() => {
            if (!configured) {
              go("config");
              return;
            }
            void act(async () =>
              enter(await api.createRoom(nickname, { ...settings, locale })),
            );
          }}
        />
      </div>
    );
  else if (screen === "join")
    content = (
      <section className="narrow join-screen">
        <Title title={t("joinTitle")} sub={t("joinSub")} />
        <form
          className="panel join-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!configured) {
              go("config");
              return;
            }
            void act(async () =>
              enter(await api.joinRoom(codeInput, nickname)),
            );
          }}
        >
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
          <div className="action-dock">
            <Button
              disabled={pending || !nickname.trim() || codeInput.length !== 6}
              type="submit"
            >
              {pending ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <ArrowRight size={17} />
              )}{" "}
              {t("joinButton")}
            </Button>
          </div>
        </form>
      </section>
    );
  else
    content = (
      <section className="narrow center-state">
        <Settings2 size={34} />
        <Title title={t("configTitle")} sub={t("configBody")} />
        <Button onClick={() => go("home")}>{t("returnHome")}</Button>
      </section>
    );
  return (
    <div
      className="app-shell"
      data-keyboard={keyboardVisible}
      data-screen={roomCode ? meta?.phase || "loading" : screen}
    >
      <header className="app-header">
        <div className="header-brand">
          {!roomCode && screen !== "home" && (
            <button
              className="icon-button header-back"
              aria-label={t("backHome")}
              onClick={() => go("home")}
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <button
            className="brand"
            onClick={() => {
              if (!roomCode) go("home");
            }}
            aria-label="Sneaky Queries"
          >
            <span className="brand-icon">
              <Mask small />
            </span>
            <span>
              SNEAKY<span>QUERIES</span>
            </span>
          </button>
        </div>
        <div className="header-actions">
          {!roomCode && (
            <button
              className="icon-button how-link"
              onClick={() => go("how")}
              aria-label={t("navHow")}
            >
              <HelpCircle size={19} />
            </button>
          )}
          <label
            className="locale-switch"
            title={
              languageDisabled
                ? t(
                    roomCode && !host
                      ? "hostChoosesLanguage"
                      : "languageLocked",
                  )
                : t("partyLanguage")
            }
          >
            <span className="sr-only">{t("language")}</span>
            <select
              aria-label={t("language")}
              value={locale}
              disabled={languageDisabled}
              onChange={(e) => changeLanguage(e.target.value as Locale)}
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
            {connected ? <Radio size={12} /> : <WifiOff size={12} />}{" "}
            {t(connected ? "connected" : "offline")}
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
            <LogOut size={13} />
            {t("leave")}
          </button>
        </div>
      )}
      {roomCode && !connected && room && (
        <div className="notice" role="status">
          <WifiOff size={15} />
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
          <span>{t(`error_${error}` as StringKey) || t("error_unknown")}</span>
          <button
            className="icon-button"
            aria-label={t("dismiss")}
            onClick={() => setError("")}
          >
            <X size={16} />
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
      {confirm && (
        <ConfirmDialog
          text={confirm.text}
          locale={locale}
          disabled={pending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const task = confirm.run;
            setConfirm(null);
            void act(task);
          }}
        />
      )}
    </div>
  );
}
