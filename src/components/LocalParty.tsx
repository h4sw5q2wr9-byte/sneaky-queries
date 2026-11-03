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
} from "lucide-react";
import { MAX_ANSWER } from "../lib/game";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import {
  allLocalAnswered,
  discussLocalRound,
  freshLocalGame,
  LOCAL_STORAGE_KEY,
  LocalGameError,
  localMembers,
  resetLocalSetup,
  restoreLocalGame,
  revealLocalRound,
  startLocalRound,
  submitLocalAnswer,
} from "../lib/local";
import type { LocalGame, LocalPhase } from "../lib/local";
import type { Locale } from "../lib/types";
import { Button, Mask, Title } from "./ui";
import { SetupWizard } from "./SetupWizard";
import { Pager } from "./Pager";
import { RoundDiscussion, RoundReveal } from "./RoundViews";
export function LocalParty({
  locale,
  onPhaseChange,
}: {
  locale: Locale;
  onPhaseChange?: (phase: LocalPhase, locale: Locale) => void;
}) {
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
  const [page, setPage] = useState(0);
  const members = localMembers(game);
  const players = Object.entries(members);
  const completed = Object.keys(game.answers).length;
  const allDone = allLocalAnswered(game);
  const player = selected ? members[selected] : null;
  const pages = Math.ceil(players.length / 4);
  const current = Math.min(page, pages - 1);
  useEffect(() => {
    onPhaseChange?.(game.phase, game.settings.locale);
  }, [game.phase, game.settings.locale, onPhaseChange]);
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
      setPage(0);
    } catch (e) {
      setError(e instanceof LocalGameError ? e.code : "error_unknown");
    }
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
  function backToCards() {
    if (
      players
        .slice(current * 4, current * 4 + 4)
        .every(([uid]) => Object.hasOwn(game.answers, uid))
    ) {
      const next = players.findIndex(
        ([uid]) => !Object.hasOwn(game.answers, uid),
      );
      setPage(next < 0 ? 0 : Math.floor(next / 4));
    }
    setHandoff(false);
  }
  const roundLabel = `${t("round")} ${game.round}`;
  const results = Object.fromEntries(
    players.map(([uid, m]) => [
      uid,
      { nickname: m.nickname, answer: game.answers[uid] },
    ]),
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
        <div className="action-dock">
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
      </div>
    );
  else if (game.phase === "setup")
    content = (
      <SetupWizard
        mode="local"
        settings={game.settings}
        onChange={(settings) => commit({ ...game, settings })}
        locale={locale}
        names={game.names}
        onName={(i, name) =>
          commit({
            ...game,
            names: game.names.map((n, j) => (i === j ? name : n)),
          })
        }
        onComplete={() =>
          apply(() =>
            startLocalRound({
              ...game,
              settings: { ...game.settings, locale },
            }),
          )
        }
        completeLabel="localStart"
        onFresh={
          game.names.some((n) => n.trim()) ? () => askReset("fresh") : undefined
        }
      />
    );
  else if (game.phase === "answering") {
    if (handoff)
      content = (
        <div className="handoff-screen">
          <div className="stamp-mark">
            <Check size={44} />
          </div>
          <Title
            title={t(allDone ? "localAllAnswered" : "localHandoffTitle")}
            sub={t(allDone ? "localAllAnsweredSub" : "localHandoffSub")}
          />
          <Hand className="passing-hand" size={30} />
          <div className="action-dock">
            <Button onClick={backToCards}>
              {t("localBackToCards")}
              <ArrowRight size={18} />
            </Button>
          </div>
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
          <div className="face-down-card">
            <span className="card-corner">SQ</span>
            <Mask />
            <span>{t("privateCard")}</span>
            <span className="card-corner bottom">SQ</span>
          </div>
          <div className="action-dock">
            <Button onClick={() => setRevealed(true)}>
              <Eye size={18} />
              {t("localRevealQuestion")}
            </Button>
            <button className="text-button" onClick={hidePrivate}>
              {t("localNotMe")}
            </button>
          </div>
        </>
      );
    else if (selected && player && revealed)
      content = (
        <>
          <Title
            eyebrow={`${roundLabel} · ${player.nickname}`}
            title={t("privateTitle")}
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
            <div className="question-display">
              <div className="eyebrow">
                <ShieldQuestion size={14} />
                {t("privateLabel")}
              </div>
              <h2 className="question scroll-region">
                {game.vault!.assignments[selected].question}
              </h2>
            </div>
            <div className="answer-field">
              <label htmlFor="local-answer">{t("answerLabel")}</label>
              <span>
                {draft.length}/{MAX_ANSWER}
              </span>
              <textarea
                id="local-answer"
                required
                maxLength={MAX_ANSWER}
                rows={2}
                value={draft}
                placeholder={t("answerPlaceholder")}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <p className="field-hint">{t("answerHint")}</p>
            <div className="action-dock question-actions">
              <button
                className="icon-button hide-question"
                type="button"
                aria-label={t("localHideQuestion")}
                onClick={() => setRevealed(false)}
              >
                <EyeOff size={20} />
              </button>
              <Button type="submit" disabled={!draft.trim()}>
                <Check size={18} />
                {t("lockAnswer")}
              </Button>
            </div>
          </form>
        </>
      );
    else
      content = (
        <>
          <div className="title-with-action">
            <Title
              eyebrow={roundLabel}
              title={t("localCardsTitle")}
              sub={t("localCardsSub")}
            />
            <button
              className="icon-button"
              aria-label={t("changeSetup")}
              onClick={() => askReset("setup")}
            >
              <Settings2 size={18} />
            </button>
          </div>
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
          <div className="name-card-grid" key={current}>
            {players
              .slice(current * 4, current * 4 + 4)
              .map(([uid, member], i) => {
                const locked = Object.hasOwn(game.answers, uid);
                return (
                  <button
                    key={uid}
                    className={`name-card ${locked ? "answered" : ""}`}
                    style={{ animationDelay: `${i * 45}ms` }}
                    disabled={locked}
                    aria-label={`${member.nickname}, ${t(locked ? "localLocked" : "localChooseName")}`}
                    onClick={() => choose(uid)}
                  >
                    <span className="player-card-number" aria-hidden="true">
                      {locked ? (
                        <Check size={14} />
                      ) : (
                        String(member.slot + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className={`avatar avatar-${member.slot % 5}`}>
                      {Array.from(member.nickname)[0]?.toUpperCase()}
                    </span>
                    <span className="name-card-copy">
                      <span className="name-card-title">{member.nickname}</span>
                      <span className="name-card-status">
                        {locked ? <Check size={12} /> : <Hand size={12} />}{" "}
                        {t(locked ? "localLocked" : "localTurnReady")}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
          <Pager
            page={current}
            total={pages}
            onChange={setPage}
            locale={locale}
            label={t("cardsPage")}
          />
          <div className="action-dock">
            <Button
              disabled={!allDone}
              onClick={() => apply(() => discussLocalRound(game))}
            >
              {t("localContinue")}
              <ArrowRight size={18} />
            </Button>
          </div>
        </>
      );
  } else if (game.phase === "discussion")
    content = (
      <RoundDiscussion
        locale={locale}
        round={game.round}
        original={game.vault!.original}
        answers={results}
        onReveal={() => apply(() => revealLocalRound(game))}
      />
    );
  else
    content = (
      <RoundReveal
        locale={locale}
        round={game.round}
        original={game.vault!.original}
        answers={results}
        impostors={game.vault!.impostors}
        onReplay={() =>
          apply(() =>
            startLocalRound({
              ...game,
              settings: { ...game.settings, locale },
            }),
          )
        }
        onSetup={() => apply(() => resetLocalSetup(game))}
      />
    );
  const stage = confirmation
    ? "confirm"
    : game.phase !== "answering"
      ? game.phase
      : handoff
        ? "handoff"
        : selected
          ? revealed
            ? "question"
            : "cover"
          : "cards";
  return (
    <div className="narrow local-party" data-stage={stage}>
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
      <div className="stage-screen screen-enter" key={`${game.round}-${stage}`}>
        {content}
      </div>
    </div>
  );
}
