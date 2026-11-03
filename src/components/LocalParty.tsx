import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Hand,
  Settings2,
  ShieldQuestion,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { MAX_ANSWER, MAX_NICKNAME } from "../lib/game";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import {
  allLocalAnswered,
  discussLocalRound,
  freshLocalGame,
  LOCAL_STORAGE_KEY,
  LocalGameError,
  localMembers,
  localSetupError,
  resetLocalSetup,
  restoreLocalGame,
  revealLocalRound,
  startLocalRound,
  submitLocalAnswer,
} from "../lib/local";
import type { LocalGame } from "../lib/local";
import type { Locale } from "../lib/types";
import { Button, Mask, Title } from "./ui";
import { SettingsFields } from "./SettingsFields";
import type { SettingsChange } from "./SettingsFields";

export function LocalParty({ locale }: { locale: Locale }) {
  const t = (key: StringKey) => translate(locale, key);
  const [game, setGame] = useState<LocalGame>(() => {
    try {
      return (
        restoreLocalGame(sessionStorage.getItem(LOCAL_STORAGE_KEY)) ||
        freshLocalGame(locale)
      );
    } catch {
      return freshLocalGame(locale);
    }
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [handoff, setHandoff] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [confirmation, setConfirmation] = useState<"setup" | "fresh" | null>(
    null,
  );
  const members = localMembers(game);
  const players = Object.entries(members);
  const completed = Object.keys(game.answers).length;
  const allDone = allLocalAnswered(game);
  const player = selected ? members[selected] : null;
  const setupError = localSetupError(game);
  useEffect(() => {
    const hide = () => {
      setSelected(null);
      setRevealed(false);
      setDraft("");
      setHandoff(false);
    };
    const visibility = () => {
      if (document.hidden) hide();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", hide);
    };
  }, []);
  function hidePrivate() {
    setSelected(null);
    setRevealed(false);
    setDraft("");
    setHandoff(false);
    setError(null);
  }
  function commit(next: LocalGame) {
    // Save synchronously before changing the screen, including the final answer.
    try {
      sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
    setGame(next);
  }
  function apply(action: () => LocalGame) {
    try {
      commit(action());
      hidePrivate();
    } catch (e) {
      setError(e instanceof LocalGameError ? e.code : "error_unknown");
    }
  }
  function updateSettings(change: SettingsChange) {
    commit({
      ...game,
      settings: typeof change === "function" ? change(game.settings) : change,
    });
  }
  function choose(uid: string) {
    if (Object.hasOwn(game.answers, uid)) return;
    hidePrivate();
    setSelected(uid);
  }
  function askReset(kind: "setup" | "fresh") {
    hidePrivate();
    setConfirmation(kind);
  }
  const roundLabel = `${t("round")} ${game.round}`;
  const names = (
    <div className="local-names">
      <div className="section-label">
        <h2>{t("localNames")}</h2>
        <Users size={17} />
      </div>
      <p className="field-hint">{t("localNameHint")}</p>
      <div className="local-name-inputs">
        {game.names.slice(0, game.settings.capacity).map((name, i) => (
          <label className="field-label" key={i}>
            {t("localPlayerName").replace("{n}", String(i + 1))}
            <input
              name={`player-${i + 1}`}
              autoComplete="off"
              autoCapitalize="words"
              maxLength={MAX_NICKNAME}
              required
              value={name}
              placeholder={t("nicknamePlaceholder")}
              onChange={(e) =>
                commit({
                  ...game,
                  names: game.names.map((value, index) =>
                    index === i ? e.target.value : value,
                  ),
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
  let content: ReactNode;
  if (confirmation)
    content = (
      <div
        className="panel local-confirm"
        role="alertdialog"
        aria-labelledby="local-confirm-title"
      >
        <h1 id="local-confirm-title">
          {t(
            confirmation === "fresh"
              ? "localFreshConfirm"
              : "localAbortConfirm",
          )}
        </h1>
        <Button
          onClick={() => {
            const next =
              confirmation === "fresh"
                ? freshLocalGame(locale)
                : resetLocalSetup(game);
            setConfirmation(null);
            apply(() => next);
          }}
        >
          {t("confirm")}
        </Button>
        <Button secondary autoFocus onClick={() => setConfirmation(null)}>
          {t("cancel")}
        </Button>
      </div>
    );
  else if (game.phase === "setup")
    content = (
      <>
        <Title title={t("localSetupTitle")} sub={t("localSetupSub")} />
        <form
          className="panel setup-form"
          onSubmit={(e) => {
            e.preventDefault();
            apply(() => startLocalRound(game));
          }}
        >
          <SettingsFields
            settings={game.settings}
            onChange={updateSettings}
            locale={locale}
            capacityLabel="localPlayerCount"
          >
            {names}
          </SettingsFields>
          {setupError === "localDuplicateNames" && (
            <p className="local-validation" role="alert">
              {t(setupError)}
            </p>
          )}
          <Button type="submit" disabled={!!setupError}>
            {t("localStart")}
            <ArrowRight size={18} />
          </Button>
          {game.names.some((n) => n.trim()) && (
            <button
              className="text-button center-button"
              type="button"
              onClick={() => askReset("fresh")}
            >
              {t("localFreshParty")}
            </button>
          )}
        </form>
      </>
    );
  else if (game.phase === "answering") {
    if (handoff)
      content = (
        <div className="panel local-handoff">
          <div className="success-orbit">
            <Check size={34} />
          </div>
          <Title
            title={t(allDone ? "localAllAnswered" : "localHandoffTitle")}
            sub={t(allDone ? "localAllAnsweredSub" : "localHandoffSub")}
          />
          <Button onClick={() => setHandoff(false)}>
            <Hand size={20} />
            {t("localBackToCards")}
          </Button>
        </div>
      );
    else if (selected && player && !revealed)
      content = (
        <>
          <Title
            eyebrow={roundLabel}
            title={t("localCoverTitle").replace("{name}", player.nickname)}
            sub={t("localCoverSub")}
          />
          <div className="panel local-cover">
            <div className="local-cover-seal">
              <ShieldQuestion size={44} />
            </div>
            <div className={`avatar avatar-${player.slot % 5}`}>
              {player.nickname.slice(0, 1).toUpperCase()}
            </div>
            <h2>{player.nickname}</h2>
            <Button onClick={() => setRevealed(true)}>
              <Eye size={20} />
              {t("localRevealQuestion")}
            </Button>
            <Button secondary onClick={hidePrivate}>
              {t("localNotMe")}
            </Button>
          </div>
        </>
      );
    else if (selected && player && revealed)
      content = (
        <>
          <Title
            eyebrow={roundLabel}
            title={t("privateTitle")}
            sub={t("privateSub")}
          />
          <form
            className="panel question-panel"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                commit(submitLocalAnswer(game, selected, draft));
                hidePrivate();
                setHandoff(true);
              } catch (cause) {
                setError(
                  cause instanceof LocalGameError
                    ? cause.code
                    : "error_unknown",
                );
              }
            }}
          >
            <div className="eyebrow">
              <ShieldQuestion size={15} />
              {t("privateLabel")}
            </div>
            <div className="local-private-name">{player.nickname}</div>
            <h2 className="question">
              {game.vault!.assignments[selected].question}
            </h2>
            <label className="field-label">
              {t("answerLabel")}
              <textarea
                autoFocus
                required
                maxLength={MAX_ANSWER}
                rows={3}
                value={draft}
                placeholder={t("answerPlaceholder")}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <div className="answer-count">
              {draft.length}/{MAX_ANSWER}
            </div>
            <Button type="submit" disabled={!draft.trim()}>
              <Check size={18} />
              {t("lockAnswer")}
            </Button>
            <p className="field-hint center">{t("answerHint")}</p>
            <button
              className="text-button center-button"
              type="button"
              onClick={() => setRevealed(false)}
            >
              <EyeOff size={16} />
              {t("localHideQuestion")}
            </button>
          </form>
        </>
      );
    else
      content = (
        <>
          <Title
            eyebrow={roundLabel}
            title={t("localCardsTitle")}
            sub={t("localCardsSub")}
          />
          <div className="local-progress">
            <span aria-live="polite">
              {completed}/{players.length} {t("submitted")}
            </span>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={t("submitted")}
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={players.length}
            >
              <div
                style={{ width: `${(completed / players.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="name-card-grid">
            {players.map(([uid, member]) => {
              const locked = Object.hasOwn(game.answers, uid);
              return (
                <button
                  key={uid}
                  className={`name-card ${locked ? "answered" : ""}`}
                  disabled={locked}
                  aria-label={`${member.nickname}, ${t(locked ? "localLocked" : "localChooseName")}`}
                  onClick={() => choose(uid)}
                >
                  <span className={`avatar avatar-${member.slot % 5}`}>
                    {member.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="name-card-title">{member.nickname}</span>
                  <span className="name-card-status">
                    {locked ? <Check size={14} /> : <Hand size={14} />}{" "}
                    {t(locked ? "localLocked" : "localTurnReady")}
                  </span>
                </button>
              );
            })}
          </div>
          <Button
            disabled={!allDone}
            onClick={() => apply(() => discussLocalRound(game))}
          >
            {t("localContinue")}
            <ArrowRight size={18} />
          </Button>
          <p className="field-hint center">
            {t(allDone ? "localAllAnsweredSub" : "localFinishFirst")}
          </p>
          <button
            className="text-button center-button"
            onClick={() => askReset("setup")}
          >
            <Settings2 size={15} />
            {t("changeSetup")}
          </button>
        </>
      );
  } else if (game.phase === "discussion")
    content = (
      <>
        <Title
          eyebrow={`${roundLabel} · ${t("answers")}`}
          title={t("discussionTitle")}
          sub={t("localDiscussSub")}
        />
        <div className="panel original-panel">
          <div className="eyebrow">{t("original")}</div>
          <h2 className="question">{game.vault!.original}</h2>
        </div>
        <div className="answer-list">
          {players.map(([uid, member], i) => (
            <div
              className="answer-card"
              key={uid}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className={`avatar avatar-${i % 5}`}>
                {member.nickname.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <span className="answer-name">{member.nickname}</span>
                <p>{game.answers[uid]}</p>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => apply(() => revealLocalRound(game))}>
          <Eye size={20} />
          {t("revealButton")}
        </Button>
      </>
    );
  else
    content = (
      <div className="reveal-screen">
        <div className="reveal-emblem">
          <Mask />
        </div>
        <Title
          eyebrow={`${roundLabel} · ${t("revealLabel")}`}
          title={t("revealTitle")}
          sub={t("revealSub")}
        />
        <div className="reveal-list">
          {Object.entries(game.vault!.impostors).map(([uid, p], i) => (
            <div
              className="panel impostor-card"
              key={uid}
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
              <p className="quote">“{game.answers[uid]}”</p>
            </div>
          ))}
        </div>
        <div className="panel normal-card">
          <div className="eyebrow">{t("normalQuestion")}</div>
          <h2>{game.vault!.original}</h2>
        </div>
        <div className="replay-actions">
          <Button onClick={() => apply(() => startLocalRound(game))}>
            {t("playAgain")}
            <ArrowRight size={18} />
          </Button>
          <Button secondary onClick={() => apply(() => resetLocalSetup(game))}>
            <Settings2 size={18} />
            {t("changeSetup")}
          </Button>
        </div>
      </div>
    );
  const stage =
    confirmation || game.phase !== "answering"
      ? game.phase
      : handoff
        ? "handoff"
        : selected
          ? revealed
            ? "question"
            : "cover"
          : "cards";
  return (
    <div className="narrow local-party">
      <div className="local-mode-label">
        <Smartphone size={14} />
        {t("localModeHint")}
      </div>
      {saveError && (
        <div className="notice" role="status">
          {t("localSaveError")}
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {t(error)}
        </div>
      )}
      <div className="screen-enter" key={`${game.round}-${stage}`}>
        {content}
      </div>
    </div>
  );
}
