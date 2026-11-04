import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  Copy,
  Crown,
  LoaderCircle,
  Settings2,
  Share2,
  Users,
  X,
} from "lucide-react";
import { validSetup } from "../lib/game";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale } from "../lib/types";
import * as api from "../lib/rooms";
import type { RoomView } from "../hooks/useRoom";
import { Mascot } from "../components/brand/Mascot";
import { RoundDiscussion, RoundReveal } from "../components/game/RoundResults";
import { SecretCard } from "../components/game/SecretCard";
import { summary } from "../lib/summary";
import { Avatar } from "../components/ui/Avatar";
import { Button, IconButton } from "../components/ui/Button";
import { Pager } from "../components/ui/Pager";
import { pageSlice } from "../lib/paging";
import { Heading, Screen } from "../components/ui/Screen";
import { Sheet } from "../components/ui/Sheet";

const SEATS_PER_PAGE = 6;
type Act = (task: () => Promise<void>) => void;
type Ask = (text: string, task: () => Promise<void>) => void;

function SeatGrid({
  view,
  locale,
  onRemove,
  showOpen = true,
}: {
  view: RoomView;
  locale: Locale;
  onRemove?: (uid: string, name: string) => void;
  showOpen?: boolean;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const [page, setPage] = useState(0);
  const { meta, room, list, uid } = view;
  if (!meta || !room) return null;
  const lobby = meta.phase === "lobby";
  const seats: (string | null)[] = list.map(([id]) => id);
  if (showOpen && lobby && list.length < meta.settings.capacity)
    seats.push(null);
  const pageView = pageSlice(seats, page, SEATS_PER_PAGE);
  return (
    <div className="seats">
      <div className="seat-grid" key={pageView.current}>
        {pageView.items.map((id) => {
          if (!id)
            return (
              <div className="seat open" key="open">
                <span className="seat-ghost" aria-hidden="true">
                  <Users size={20} />
                </span>
                <span className="seat-name">{t("seatOpen")}</span>
              </div>
            );
          const m = view.members[id];
          const online = room.presence[id]?.online;
          const done = lobby ? m.ready : room.submitted[id] === meta.roundId;
          return (
            <div
              className={`seat player-row ${done ? "is-ready" : ""} ${online ? "" : "is-offline"}`}
              key={id}
              style={{ ["--tint" as string]: `var(--seat-${m.slot % 10})` }}
            >
              <Avatar slot={m.slot} size={50} />
              <span className="seat-text">
                <span className="seat-name">{m.nickname}</span>
                <span className="seat-status">
                  {id === meta.hostId && (
                    <span className="host-tag" title={t("host")}>
                      <Crown size={12} />
                      <span className="sr-only">{t("host")}</span>
                    </span>
                  )}
                  {id === uid && <b className="you-tag">{t("you")}</b>}
                  {!online
                    ? t("offline")
                    : t(done ? "ready" : lobby ? "notReady" : "waitingShort")}
                </span>
              </span>
              <span
                className={`seat-badge ${done ? "on" : ""}`}
                aria-hidden="true"
              >
                {done ? <Check size={13} strokeWidth={3.5} /> : <i />}
              </span>
              {onRemove && id !== uid && (
                <button
                  type="button"
                  className="seat-remove"
                  aria-label={`${t("remove")} ${m.nickname}`}
                  onClick={() => onRemove(id, m.nickname)}
                >
                  <X size={13} strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Pager
        page={pageView.current}
        total={pageView.total}
        onChange={setPage}
        locale={locale}
        label={t("players")}
      />
    </div>
  );
}

export function Lobby({
  view,
  roomCode,
  locale,
  pending,
  act,
  ask,
  onEdit,
}: {
  view: RoomView;
  roomCode: string;
  locale: Locale;
  pending: boolean;
  act: Act;
  ask: Ask;
  onEdit: () => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const { meta, me, host, count, connected, allReady, uid } = view;
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState("");
  if (!meta || !me) return null;
  const link = () => {
    const url = new URL(location.href);
    url.searchParams.delete("mode");
    url.searchParams.set("room", roomCode);
    return url.href;
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setFallback("");
    } catch {
      setFallback(link());
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sneaky Queries", url: link() });
      } catch {
        /* Cancelled share sheet. */
      }
    } else await copy();
  }
  const valid = validSetup(count, meta.settings.impostors);
  const caption =
    count < 3
      ? t("needPlayers")
      : !valid
        ? t("error_setup")
        : !allReady
          ? t("waitReady")
          : host
            ? ""
            : t("waitHost");
  return (
    <Screen
      name="lobby"
      dock={
        <>
          <Button
            variant={me.ready ? "mint" : "secondary"}
            disabled={pending || !connected}
            onClick={() => act(() => api.ready(roomCode, uid, !me.ready))}
            className="ready-btn"
          >
            {me.ready && <Check size={18} strokeWidth={3} />}
            {t(me.ready ? "unready" : "readyButton")}
          </Button>
          {host && (
            <Button
              disabled={pending || !connected || !allReady || !valid}
              onClick={() => act(() => api.startRound(roomCode))}
            >
              {t("start")}
            </Button>
          )}
          {caption && (
            <p className="dock-caption" role="status">
              {caption}
            </p>
          )}
        </>
      }
    >
      <div className="ticket">
        <div className="ticket-main">
          <span className="ticket-label">{t("roomCode")}</span>
          <div className="room-code" aria-label={t("roomCode")}>
            {roomCode.split("").map((letter, i) => (
              <span key={i} style={{ animationDelay: `${i * 50}ms` }}>
                {letter}
              </span>
            ))}
          </div>
          <span className="ticket-hint">{t("shareHint")}</span>
        </div>
        <div className="ticket-stub">
          <IconButton label={t("copy")} onClick={() => void copy()}>
            {copied ? <Check size={19} /> : <Copy size={19} />}
          </IconButton>
          <IconButton label={t("share")} onClick={() => void share()}>
            <Share2 size={19} />
          </IconButton>
        </div>
        {copied && <span className="ticket-toast">{t("copied")}</span>}
      </div>
      {fallback && (
        <input
          className="link-fallback"
          readOnly
          value={fallback}
          aria-label={t("copy")}
          onFocus={(e) => e.target.select()}
        />
      )}
      <div className="lobby-row">
        <h2 className="section-title">
          {t("seats")}{" "}
          <span className="seat-count">
            {count}/{meta.settings.capacity}
          </span>
        </h2>
        {host ? (
          <button
            type="button"
            className="setup-chip"
            aria-label={t("changeSetup")}
            onClick={onEdit}
          >
            <Settings2 size={14} />
            {summary(meta.settings, locale).slice(1).join(" · ")}
          </button>
        ) : (
          <span className="setup-chip static">
            {summary(meta.settings, locale).slice(1).join(" · ")}
          </span>
        )}
      </div>
      <SeatGrid
        view={view}
        locale={locale}
        onRemove={
          host
            ? (id) =>
                ask(t("removeConfirm"), () => api.removePlayer(roomCode, id))
            : undefined
        }
      />
    </Screen>
  );
}

function ManageSheet({
  view,
  roomCode,
  locale,
  pending,
  act,
  ask,
  onClose,
}: {
  view: RoomView;
  roomCode: string;
  locale: Locale;
  pending: boolean;
  act: Act;
  ask: Ask;
  onClose: () => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  return (
    <Sheet title={t("manage")} onClose={onClose} closeLabel={t("close")}>
      <p className="sheet-sub">{t("missingPlayers")}</p>
      <SeatGrid
        view={view}
        locale={locale}
        showOpen={false}
        onRemove={(id) => {
          onClose();
          ask(t("removeConfirm"), () => api.removePlayer(roomCode, id));
        }}
      />
      <div className="sheet-actions">
        {view.completed === view.count && (
          <Button
            variant="secondary"
            disabled={pending || !view.connected}
            onClick={() => act(() => api.finishAnswers(roomCode))}
          >
            {t("tryAgain")}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
            ask(t("abortConfirm"), () => api.resetRoom(roomCode));
          }}
        >
          {t("abort")}
        </Button>
      </div>
    </Sheet>
  );
}

export function OnlineRound({
  view,
  roomCode,
  locale,
  pending,
  act,
  ask,
}: {
  view: RoomView;
  roomCode: string;
  locale: Locale;
  pending: boolean;
  act: Act;
  ask: Ask;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const { meta, room, me, uid, host, connected, completed, count, list } = view;
  const roundId = meta?.roundId;
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [managing, setManaging] = useState(false);
  useEffect(() => {
    setAnswer("");
    setRevealed(false);
  }, [roundId]);
  if (!meta || !room || !me) return null;
  const sent = room.submitted[uid] === meta.roundId;
  const assignment =
    room.assignment?.roundId === meta.roundId ? room.assignment.question : null;
  const roundLabel = `${t("round")} ${meta.round}`;
  const manage: ReactNode = host ? (
    <button
      type="button"
      className="manage-link"
      onClick={() => setManaging(true)}
    >
      <Users size={15} />
      {t("manage")}
    </button>
  ) : null;
  const sheet = managing && (
    <ManageSheet
      view={view}
      roomCode={roomCode}
      locale={locale}
      pending={pending}
      act={act}
      ask={ask}
      onClose={() => setManaging(false)}
    />
  );
  if (!sent)
    return (
      <>
        <SecretCard
          locale={locale}
          roundLabel={roundLabel}
          name={me.nickname}
          slot={me.slot}
          coverTitle={t("onlineCoverTitle")}
          coverSub={t("onlineCoverSub")}
          question={assignment}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          draft={answer}
          onDraft={setAnswer}
          pending={pending}
          disabled={!connected}
          inputId="online-answer"
          onSubmit={() =>
            act(() => api.submitAnswer(roomCode, uid, meta.roundId, answer))
          }
          manage={manage}
        />
        {sheet}
      </>
    );
  const waiting = list.filter(([id]) => room.submitted[id] !== meta.roundId);
  return (
    <>
      <Screen name="waiting" className="waiting-screen">
        <Heading
          kicker={roundLabel}
          title={t("waitingTitle")}
          sub={t("waitingSub")}
        />
        <div className="waiting-stage">
          <div
            className="progress-ring"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={count}
            aria-valuenow={completed}
            aria-label={t("submitted")}
            style={{ ["--p" as string]: completed / Math.max(count, 1) }}
          >
            <Mascot size={92} className="waiting-mascot" />
            <span className="stamp locked-stamp">{t("lockedStamp")}</span>
          </div>
          <p className="progress-big">
            {completed}
            <span>/{count}</span>
            <small>{t("submitted")}</small>
          </p>
          <div className="pip-row">
            {list.map(([id, m]) => (
              <span
                key={id}
                className={`pip ${room.submitted[id] === meta.roundId ? "done" : ""}`}
                title={m.nickname}
              >
                <Avatar slot={m.slot} size={30} />
              </span>
            ))}
          </div>
          <p className="waiting-names" aria-live="polite">
            {completed === count
              ? t("allAnswered")
              : `${t("waitingPlayers")} ${waiting.map(([, m]) => m.nickname).join(", ")}`}
          </p>
          {manage}
        </div>
      </Screen>
      {sheet}
    </>
  );
}

export function OnlineResults({
  view,
  roomCode,
  locale,
  pending,
  act,
  loading,
}: {
  view: RoomView;
  roomCode: string;
  locale: Locale;
  pending: boolean;
  act: Act;
  loading: ReactNode;
}) {
  const { meta, room, host, connected, allReady, count, members } = view;
  if (!meta || !room) return null;
  const slots = Object.fromEntries(
    Object.entries(members).map(([id, m]) => [id, m.slot]),
  );
  if (meta.phase === "discussion")
    return room.discussion?.roundId === meta.roundId ? (
      <RoundDiscussion
        locale={locale}
        round={meta.round}
        original={room.discussion.original}
        answers={room.discussion.answers}
        slots={slots}
        onReveal={host ? () => act(() => api.revealRound(roomCode)) : undefined}
        disabled={pending || !connected}
      />
    ) : (
      <>{loading}</>
    );
  return room.reveal?.roundId === meta.roundId && room.discussion ? (
    <RoundReveal
      key={meta.roundId}
      locale={locale}
      round={meta.round}
      original={room.discussion.original}
      answers={room.discussion.answers}
      impostors={room.reveal.impostors}
      slots={slots}
      onReplay={host ? () => act(() => api.startRound(roomCode)) : undefined}
      onSetup={host ? () => act(() => api.resetRoom(roomCode)) : undefined}
      disabled={
        pending ||
        !connected ||
        !allReady ||
        !validSetup(count, meta.settings.impostors)
      }
      setupDisabled={pending || !connected}
    />
  ) : (
    <>{loading}</>
  );
}

export function StatusScreen({
  title,
  body,
  action,
  spinner = false,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  spinner?: boolean;
}) {
  return (
    <Screen name="status" dock={action}>
      <div className="status-stage">
        <Mascot size={130} className={spinner ? "is-searching" : ""} />
        {spinner && <LoaderCircle className="spin status-spin" size={22} />}
        <h1>{title}</h1>
        {body && <p>{body}</p>}
      </div>
    </Screen>
  );
}
