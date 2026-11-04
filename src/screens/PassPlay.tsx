import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, Lock, Settings2 } from "lucide-react";
import { format, translate } from "../lib/i18n";
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
import { sound } from "../lib/sound";
import { RoundDiscussion, RoundReveal } from "../components/game/RoundResults";
import { SecretCard } from "../components/game/SecretCard";
import { Avatar } from "../components/ui/Avatar";
import { Button, IconButton } from "../components/ui/Button";
import { Pager } from "../components/ui/Pager";
import { pageSlice } from "../lib/paging";
import { Heading, Screen } from "../components/ui/Screen";
import { ConfirmSheet } from "../components/ui/Sheet";
import { SetupFlow } from "./SetupFlow";

const CARDS_PER_PAGE = 4;

/**
 * Pass & Play: one shared phone, entirely local (no Firebase). Private
 * selection, reveal state and drafts live only in memory, so a refresh or
 * backgrounding always returns to the neutral name cards.
 */
export function PassPlay({
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
  const view = pageSlice(players, page, CARDS_PER_PAGE);
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
    sound.tap();
    hidePrivate();
    setSelected(uid);
  }
  function backToCards() {
    // Jump to the next page with someone still to answer.
    if (view.items.every(([uid]) => Object.hasOwn(game.answers, uid))) {
      const next = players.findIndex(
        ([uid]) => !Object.hasOwn(game.answers, uid),
      );
      setPage(next < 0 ? 0 : Math.floor(next / CARDS_PER_PAGE));
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
  const slots = Object.fromEntries(players.map(([uid, m]) => [uid, m.slot]));
  const replay = () =>
    apply(() =>
      startLocalRound({ ...game, settings: { ...game.settings, locale } }),
    );

  let content: ReactNode;
  if (game.phase === "setup")
    content = (
      <SetupFlow
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
        onComplete={replay}
        completeLabel="localStart"
        onFresh={
          game.names.some((n) => n.trim())
            ? () => {
                hidePrivate();
                setConfirmation("fresh");
              }
            : undefined
        }
      />
    );
  else if (game.phase === "answering") {
    if (handoff)
      content = (
        <Screen
          name="handoff"
          dock={
            <Button onClick={backToCards}>
              {t("localBackToCards")}
              <ArrowRight size={19} />
            </Button>
          }
        >
          <div className="handoff-stage">
            <div className="handoff-card" aria-hidden="true">
              <span className="sealed-pattern" />
              <span className="stamp locked-stamp">{t("lockedStamp")}</span>
            </div>
            <div className="handoff-pass" aria-hidden="true">
              <span className="hand left" />
              <span className="mini-phone travel">
                <span className="phone-q">?</span>
              </span>
              <span className="hand right" />
            </div>
            <h1>{t(allDone ? "localAllAnswered" : "localHandoffTitle")}</h1>
            <p>{t(allDone ? "localAllAnsweredSub" : "localHandoffSub")}</p>
          </div>
        </Screen>
      );
    else if (selected && player)
      content = (
        <SecretCard
          locale={locale}
          roundLabel={roundLabel}
          name={player.nickname}
          slot={player.slot}
          coverTitle={t("localCoverTitle").replace("{name}", player.nickname)}
          coverSub={t("localCoverSub")}
          question={
            revealed ? game.vault!.assignments[selected].question : null
          }
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onHide={() => setRevealed(false)}
          onNotMe={hidePrivate}
          draft={draft}
          onDraft={setDraft}
          inputId="local-answer"
          onSubmit={() => {
            try {
              commit(submitLocalAnswer(game, selected, draft));
              hidePrivate();
              setHandoff(true);
            } catch (cause) {
              setError(
                cause instanceof LocalGameError ? cause.code : "error_unknown",
              );
            }
          }}
        />
      );
    else
      content = (
        <Screen
          name="cards"
          dock={
            <Button
              disabled={!allDone}
              onClick={() => apply(() => discussLocalRound(game))}
            >
              {t("localContinue")}
              <ArrowRight size={19} />
            </Button>
          }
        >
          <Heading
            kicker={roundLabel}
            title={t("localCardsTitle")}
            sub={t("localCardsSub")}
            aside={
              <IconButton
                label={t("changeSetup")}
                onClick={() => {
                  hidePrivate();
                  setConfirmation("setup");
                }}
              >
                <Settings2 size={19} />
              </IconButton>
            }
          />
          <div className="turn-progress">
            <div
              className="pip-row"
              role="progressbar"
              aria-label={t("submitted")}
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={players.length}
            >
              {players.map(([uid, m]) => (
                <span
                  key={uid}
                  className={`pip ${Object.hasOwn(game.answers, uid) ? "done" : ""}`}
                >
                  <Avatar slot={m.slot} size={24} />
                </span>
              ))}
            </div>
            <span aria-live="polite">
              {format(locale, "progressLocked", {
                n: completed,
                total: players.length,
              })}
            </span>
          </div>
          <div className="name-card-grid" key={view.current}>
            {view.items.map(([uid, member], i) => {
              const locked = Object.hasOwn(game.answers, uid);
              return (
                <button
                  type="button"
                  key={uid}
                  className={`name-card ${locked ? "answered" : ""}`}
                  style={{
                    animationDelay: `${i * 55}ms`,
                    ["--tint" as string]: `var(--seat-${member.slot % 10})`,
                  }}
                  disabled={locked}
                  aria-label={`${member.nickname}, ${t(locked ? "localLocked" : "localChooseName")}`}
                  onClick={() => choose(uid)}
                >
                  <span className="name-card-num" aria-hidden="true">
                    {String(member.slot + 1).padStart(2, "0")}
                  </span>
                  <Avatar slot={member.slot} size={58} />
                  <span className="name-card-title">{member.nickname}</span>
                  <span className="name-card-status">
                    {locked ? (
                      <>
                        <Lock size={12} /> {t("doneShort")}
                      </>
                    ) : (
                      t("localTurnReady")
                    )}
                  </span>
                  {locked && (
                    <span className="card-check" aria-hidden="true">
                      <Check size={16} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Pager
            page={view.current}
            total={view.total}
            onChange={setPage}
            locale={locale}
            label={t("cardsPage")}
          />
        </Screen>
      );
  } else if (game.phase === "discussion")
    content = (
      <RoundDiscussion
        locale={locale}
        round={game.round}
        original={game.vault!.original}
        answers={results}
        slots={slots}
        onReveal={() => apply(() => revealLocalRound(game))}
      />
    );
  else
    content = (
      <RoundReveal
        key={game.vault!.roundId}
        locale={locale}
        round={game.round}
        original={game.vault!.original}
        answers={results}
        impostors={game.vault!.impostors}
        slots={slots}
        onReplay={replay}
        onSetup={() => apply(() => resetLocalSetup(game))}
      />
    );
  const stage =
    game.phase !== "answering"
      ? game.phase
      : handoff
        ? "handoff"
        : selected
          ? revealed
            ? "question"
            : "cover"
          : "cards";
  return (
    <div className="pass-play" data-stage={stage}>
      {saveError && (
        <div className="toast" role="status">
          {t("localSaveError")}
        </div>
      )}
      {error && (
        <div className="toast error" role="alert">
          {t(error)}
        </div>
      )}
      <div className="stage" key={`${game.round}-${stage}`}>
        {content}
      </div>
      {confirmation && (
        <ConfirmSheet
          text={t(
            confirmation === "fresh"
              ? "localFreshConfirm"
              : "localAbortConfirm",
          )}
          confirmLabel={t("confirm")}
          cancelLabel={t("cancel")}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const next =
              confirmation === "fresh"
                ? freshLocalGame(locale)
                : resetLocalSetup(game);
            setConfirmation(null);
            apply(() => next);
          }}
        />
      )}
    </div>
  );
}
