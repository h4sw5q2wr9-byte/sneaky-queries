import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, LogOut, Settings, WifiOff, X } from "lucide-react";
import { Mascot, Wordmark } from "./components/brand/Mascot";
import { HowToPlay } from "./components/game/HowToPlay";
import { AvatarDefs } from "./components/ui/Avatar";
import { Button, IconButton } from "./components/ui/Button";
import { LanguageToggle } from "./components/ui/LanguageToggle";
import { ConfirmSheet, Sheet } from "./components/ui/Sheet";
import { useRoom } from "./hooks/useRoom";
import { useKeyboardViewport } from "./hooks/useViewport";
import { configured, emulator } from "./lib/firebase";
import { defaultSettings } from "./lib/game";
import { localeDirection, translate } from "./lib/i18n";
import type { StringKey } from "./lib/i18n";
import type { LocalPhase } from "./lib/local";
import * as api from "./lib/rooms";
import { sound } from "./lib/sound";
import type { Locale, Settings as GameSettings } from "./lib/types";
import { Home, OnlineChoice } from "./screens/Home";
import { JoinParty } from "./screens/JoinParty";
import {
  Lobby,
  OnlineResults,
  OnlineRound,
  StatusScreen,
} from "./screens/OnlineParty";
import { PassPlay } from "./screens/PassPlay";
import { SetupFlow } from "./screens/SetupFlow";

type Screen = "home" | "create" | "join" | "config" | "local";
type SheetKind = "online" | "how" | "settings" | null;
const params = () => new URLSearchParams(location.search);
const savedLocale = (): Locale =>
  localStorage.getItem("sq-locale") === "nl" ? "nl" : "en";

export default function App() {
  const [locale, setLocale] = useState<Locale>(savedLocale);
  const keyboardVisible = useKeyboardViewport();
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const onLocalPhase = useCallback((phase: LocalPhase, roundLocale: Locale) => {
    setLocalPhase(phase);
    if (phase !== "setup") setLocale(roundLocale);
  }, []);
  const t = useCallback((key: StringKey) => translate(locale, key), [locale]);
  const invite = params().get("room") || "";
  const [screen, setScreen] = useState<Screen>(
    invite ? "join" : params().get("mode") === "local" ? "local" : "home",
  );
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [nickname, setNickname] = useState(
    localStorage.getItem("sq-nickname") || "",
  );
  const [codeInput, setCodeInput] = useState(
    invite
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6),
  );
  const [roomCode, setRoomCode] = useState(() =>
    !invite && params().get("mode") === "local"
      ? ""
      : sessionStorage.getItem("sq-room") || "",
  );
  const [settings, setSettings] = useState<GameSettings>({
    ...defaultSettings,
    locale,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<{
    text: string;
    run: () => Promise<void>;
  } | null>(null);
  const view = useRoom(roomCode, setError);
  const { meta, me, host, connected, count } = view;

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
    if (roomCode) setError("");
  }, [roomCode]);

  async function run(task: () => Promise<void>) {
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
  const act = (task: () => Promise<void>) => void run(task);
  const ask = (text: string, task: () => Promise<void>) =>
    setConfirm({ text, run: task });
  function enter(code: string) {
    localStorage.setItem("sq-nickname", nickname.trim());
    sessionStorage.setItem("sq-room", code);
    setRoomCode(code);
    setEditing(false);
  }
  function exit() {
    sessionStorage.removeItem("sq-room");
    setRoomCode("");
    setScreen("home");
    setError("");
    setEditing(false);
    const url = new URL(location.href);
    url.searchParams.delete("room");
    history.replaceState(null, "", url);
  }
  function go(next: Screen) {
    const url = new URL(location.href);
    if (next === "local") {
      url.searchParams.set("mode", "local");
      url.searchParams.delete("room");
    } else url.searchParams.delete("mode");
    history.replaceState(null, "", url);
    setError("");
    setSheet(null);
    setScreen(next);
  }
  const languageDisabled = roomCode
    ? !host || meta?.phase !== "lobby" || pending || !connected
    : screen === "local" && localPhase !== "setup";
  function changeLanguage(next: Locale) {
    if (languageDisabled) return;
    if (roomCode && meta)
      act(() => api.saveSettings(roomCode, { ...meta.settings, locale: next }));
    else setLocale(next);
  }

  const loading = (
    <StatusScreen
      spinner
      title={t("loading")}
      action={
        error ? (
          <Button variant="secondary" onClick={exit}>
            {t("returnHome")}
          </Button>
        ) : undefined
      }
    />
  );
  let content: ReactNode;
  let viewKey: string = screen;
  if (roomCode) {
    viewKey = meta ? (editing ? "edit" : meta.phase) : "loading";
    if (!meta) content = loading;
    else if (meta.expiresAt < view.now)
      content = (
        <StatusScreen
          title={t("expiredTitle")}
          body={t("expiredBody")}
          action={<Button onClick={exit}>{t("returnHome")}</Button>}
        />
      );
    else if (!me)
      content = (
        <StatusScreen
          title={t("removedTitle")}
          body={t("removedBody")}
          action={<Button onClick={exit}>{t("returnHome")}</Button>}
        />
      );
    else if (editing && host)
      content = (
        <SetupFlow
          mode="edit"
          onCancel={() => setEditing(false)}
          settings={settings}
          onChange={setSettings}
          locale={locale}
          minPlayers={Math.max(3, count)}
          pending={pending}
          completeLabel="save"
          onComplete={() =>
            act(async () => {
              await api.saveSettings(roomCode, { ...settings, locale });
              setEditing(false);
            })
          }
        />
      );
    else if (meta.phase === "lobby")
      content = (
        <Lobby
          view={view}
          roomCode={roomCode}
          locale={locale}
          pending={pending}
          act={act}
          ask={ask}
          onEdit={() => {
            setSettings(meta.settings);
            setEditing(true);
          }}
        />
      );
    else if (meta.phase === "answering")
      content = (
        <OnlineRound
          view={view}
          roomCode={roomCode}
          locale={locale}
          pending={pending}
          act={act}
          ask={ask}
        />
      );
    else
      content = (
        <OnlineResults
          view={view}
          roomCode={roomCode}
          locale={locale}
          pending={pending}
          act={act}
          loading={loading}
        />
      );
  } else if (screen === "local")
    content = <PassPlay locale={locale} onPhaseChange={onLocalPhase} />;
  else if (screen === "home")
    content = (
      <Home
        locale={locale}
        onLocal={() => go("local")}
        onOnline={() => setSheet("online")}
        onHelp={() => setSheet("how")}
      />
    );
  else if (screen === "create")
    content = (
      <SetupFlow
        mode="online"
        settings={settings}
        onChange={setSettings}
        locale={locale}
        nickname={nickname}
        onNickname={setNickname}
        pending={pending}
        completeLabel="createButton"
        onComplete={() => {
          if (!configured) return go("config");
          act(async () =>
            enter(await api.createRoom(nickname, { ...settings, locale })),
          );
        }}
      />
    );
  else if (screen === "join")
    content = (
      <JoinParty
        locale={locale}
        invited={!!invite}
        nickname={nickname}
        onNickname={setNickname}
        code={codeInput}
        onCode={setCodeInput}
        pending={pending}
        onJoin={() => {
          if (!configured) return go("config");
          act(async () => enter(await api.joinRoom(codeInput, nickname)));
        }}
      />
    );
  else
    content = (
      <StatusScreen
        title={t("configTitle")}
        body={t("configBody")}
        action={<Button onClick={() => go("home")}>{t("returnHome")}</Button>}
      />
    );

  const home = !roomCode && screen === "home";
  return (
    <div className="app-frame">
      <div className="backdrop" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
        <span className="grain" />
      </div>
      <DesktopAside locale={locale} />
      <div
        className="app-shell"
        data-keyboard={keyboardVisible}
        data-screen={roomCode ? meta?.phase || "loading" : screen}
      >
        <AvatarDefs />
        <header className="top-bar">
          <div className="top-left">
            {home ? (
              <IconButton
                label={t("settings")}
                onClick={() => setSheet("settings")}
              >
                <Settings size={19} />
              </IconButton>
            ) : roomCode ? (
              <IconButton
                label={t("leave")}
                onClick={() =>
                  ask(t("leaveConfirm"), async () => {
                    if (!host && connected)
                      await api.removePlayer(roomCode, view.uid);
                    exit();
                  })
                }
              >
                <LogOut size={18} />
              </IconButton>
            ) : (
              <IconButton label={t("backHome")} onClick={() => go("home")}>
                <ArrowLeft size={19} />
              </IconButton>
            )}
          </div>
          <div className="top-center">
            {roomCode ? (
              <span className={`live-chip ${connected ? "on" : "off"}`}>
                {connected ? <i className="live-dot" /> : <WifiOff size={12} />}
                {t(connected ? "connected" : "offline")}
                <b className="toolbar-code">{roomCode}</b>
              </span>
            ) : (
              !home && (
                <button
                  type="button"
                  className="mini-brand"
                  aria-label="Sneaky Queries"
                  onClick={() => go("home")}
                >
                  <Mascot size={34} animated={false} />
                  <span>Sneaky Queries</span>
                </button>
              )
            )}
          </div>
          <div className="top-right">
            <LanguageToggle
              locale={locale}
              disabled={languageDisabled}
              hint={
                languageDisabled
                  ? t(
                      roomCode && !host
                        ? "hostChoosesLanguage"
                        : "languageLocked",
                    )
                  : t("partyLanguage")
              }
              onChange={changeLanguage}
            />
          </div>
        </header>
        {emulator && <div className="emulator-banner">{t("emulator")}</div>}
        <div className="toasts">
          {roomCode && !connected && meta && (
            <div className="toast" role="status">
              <WifiOff size={15} />
              {t("reconnecting")}
            </div>
          )}
          {view.hostAway && !host && me && (
            <div className="toast">
              <span>{t("hostAway")}</span>
              <button
                type="button"
                className="toast-action"
                disabled={!view.canTakeOver || pending || !connected}
                onClick={() => act(() => api.takeOver(roomCode, view.uid))}
              >
                {t("takeOver")}
              </button>
            </div>
          )}
          {error && (
            <div className="toast error" role="alert">
              <span>
                {t(`error_${error}` as StringKey) || t("error_unknown")}
              </span>
              {roomCode && !meta && (
                <button type="button" className="toast-action" onClick={exit}>
                  {t("returnHome")}
                </button>
              )}
              <IconButton label={t("dismiss")} onClick={() => setError("")}>
                <X size={15} />
              </IconButton>
            </div>
          )}
        </div>
        <main key={viewKey} className="view">
          {content}
        </main>
        {sheet === "online" && (
          <Sheet
            title={t("onlineSheetTitle")}
            onClose={() => setSheet(null)}
            closeLabel={t("close")}
          >
            <OnlineChoice
              locale={locale}
              onCreate={() => go("create")}
              onJoin={() => go("join")}
            />
          </Sheet>
        )}
        {sheet === "how" && (
          <Sheet
            title={t("navHow")}
            onClose={() => setSheet(null)}
            closeLabel={t("close")}
          >
            <HowToPlay locale={locale} onDone={() => setSheet(null)} />
          </Sheet>
        )}
        {sheet === "settings" && (
          <Sheet
            title={t("settings")}
            onClose={() => setSheet(null)}
            closeLabel={t("close")}
          >
            <div className="settings-list">
              <label className="setting-row">
                <span>
                  <strong>{t("sound")}</strong>
                  <small>{t("soundHint")}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={soundOn}
                  onChange={(e) => {
                    sound.set(e.target.checked);
                    setSoundOn(e.target.checked);
                    sound.tap();
                  }}
                />
              </label>
              <div className="setting-row static">
                <span>
                  <strong>{t("installTitle")}</strong>
                  <small>{t("installBody")}</small>
                </span>
              </div>
              <p className="sheet-sub">{t("motionNote")}</p>
              <p className="sheet-sub fine">
                {t("newQuestions")} · {t("free")}
              </p>
            </div>
          </Sheet>
        )}
        {confirm && (
          <ConfirmSheet
            text={confirm.text}
            confirmLabel={t("confirm")}
            cancelLabel={t("cancel")}
            disabled={pending}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              const task = confirm.run;
              setConfirm(null);
              act(task);
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Wide screens get a brand panel beside the phone-sized game. */
function DesktopAside({ locale }: { locale: Locale }) {
  const t = (key: StringKey) => translate(locale, key);
  return (
    <aside className="desktop-aside" aria-hidden="true">
      <Mascot size={180} />
      <Wordmark />
      <p className="aside-tag">
        {t("hero1")} <em>{t("hero2")}</em>
      </p>
      <ol className="aside-steps">
        {(["step2", "step3", "step4"] as const).map((key, i) => (
          <li key={key}>
            <b>{i + 1}</b>
            <span>
              <strong>{t(key)}</strong>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
