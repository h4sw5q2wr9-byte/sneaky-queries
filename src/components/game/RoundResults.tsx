import { useEffect, useState } from "react";
import { ArrowRight, Eye, Settings2 } from "lucide-react";
import { format, translate } from "../../lib/i18n";
import type { StringKey } from "../../lib/i18n";
import type { Locale, Result, RevealPlayer } from "../../lib/types";
import { sound } from "../../lib/sound";
import { useCompactHeight, useReducedMotion } from "../../hooks/useViewport";
import { Mascot } from "../brand/Mascot";
import { Avatar } from "../ui/Avatar";
import { Burst } from "../ui/Burst";
import { Button } from "../ui/Button";
import { Pager } from "../ui/Pager";
import { pageSlice } from "../../lib/paging";
import { Heading, Screen } from "../ui/Screen";

const ANSWERS_PER_PAGE = 4;
const slotOf = (
  slots: Record<string, number> | undefined,
  uid: string,
  i: number,
) => slots?.[uid] ?? i;

export function RoundDiscussion({
  locale,
  round,
  original,
  answers,
  slots,
  onReveal,
  disabled = false,
}: {
  locale: Locale;
  round: number;
  original: string;
  answers: Record<string, Result>;
  slots?: Record<string, number>;
  onReveal?: () => void;
  disabled?: boolean;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const [page, setPage] = useState(0);
  const compact = useCompactHeight();
  const entries = Object.entries(answers).sort(
    ([a], [b]) => slotOf(slots, a, 0) - slotOf(slots, b, 0),
  );
  const view = pageSlice(entries, page, compact ? 3 : ANSWERS_PER_PAGE);
  return (
    <Screen
      name="discussion"
      dock={
        onReveal ? (
          <Button disabled={disabled} onClick={onReveal}>
            <Eye size={19} />
            {t("revealButton")}
          </Button>
        ) : (
          <p className="dock-wait">
            <span className="wait-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {t("hostReveal")}
          </p>
        )
      }
    >
      <Heading
        kicker={`${t("round")} ${round}`}
        title={t("discussionTitle")}
        sub={t("discussionSub")}
      />
      <div className="original-banner original-panel">
        <span className="banner-label">{t("original")}</span>
        <h2 className="question">{original}</h2>
        <span className="banner-mascot" aria-hidden="true">
          <Mascot size={56} />
        </span>
      </div>
      <div className="answer-thread scroll-region" key={view.current}>
        {view.items.map(([uid, a], i) => {
          const slot = slotOf(slots, uid, view.offset + i);
          return (
            <div
              className={`answer-card ${(view.offset + i) % 2 ? "right" : ""}`}
              key={uid}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Avatar slot={slot} size={40} />
              <div
                className="answer-bubble"
                style={{ ["--tint" as string]: `var(--seat-${slot % 10})` }}
              >
                <span className="answer-name">{a.nickname}</span>
                <p>{a.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
      <Pager
        page={view.current}
        total={view.total}
        onChange={setPage}
        locale={locale}
        label={t("answers")}
      />
    </Screen>
  );
}

export function RoundReveal({
  locale,
  round,
  original,
  answers,
  impostors,
  slots,
  onReplay,
  onSetup,
  disabled = false,
  setupDisabled = false,
}: {
  locale: Locale;
  round: number;
  original: string;
  answers: Record<string, Result>;
  impostors: Record<string, RevealPlayer>;
  slots?: Record<string, number>;
  onReplay?: () => void;
  onSetup?: () => void;
  disabled?: boolean;
  setupDisabled?: boolean;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const reduced = useReducedMotion();
  const [intro, setIntro] = useState(!reduced);
  const [page, setPage] = useState(0);
  const entries = Object.entries(impostors).sort(
    ([a], [b]) => slotOf(slots, a, 0) - slotOf(slots, b, 0),
  );
  const current = Math.min(page, entries.length - 1);
  const [uid, p] = entries[current];
  const slot = slotOf(slots, uid, current);
  useEffect(() => {
    if (!intro) return;
    const timer = setTimeout(() => setIntro(false), 1300);
    return () => clearTimeout(timer);
  }, [intro]);
  useEffect(() => {
    if (!intro) sound.fanfare();
  }, [intro]);

  if (intro)
    return (
      <Screen name="reveal-intro">
        <button
          type="button"
          className="drumroll"
          onClick={() => setIntro(false)}
          aria-label={t("skip")}
        >
          <span className="spotlight-sweep" aria-hidden="true" />
          <Mascot size={150} className="drumroll-mascot" />
          <span className="drumroll-text">
            {t(entries.length > 1 ? "revealIntroMany" : "revealIntro")}
          </span>
          <span className="drumroll-skip">{t("skip")} →</span>
        </button>
      </Screen>
    );

  const kind =
    p.variation === "I1"
      ? "opposite"
      : p.variation === "I2"
        ? "shifted"
        : "different";
  const lineup = Object.entries(answers).sort(
    ([a], [b]) => slotOf(slots, a, 0) - slotOf(slots, b, 0),
  );
  return (
    <Screen
      name="reveal"
      dock={
        onReplay && onSetup ? (
          <>
            <Button
              variant="secondary"
              disabled={setupDisabled}
              onClick={onSetup}
              aria-label={t("changeSetup")}
              className="setup-btn"
            >
              <Settings2 size={18} />
              <span className="setup-btn-text">{t("changeSetup")}</span>
            </Button>
            <Button disabled={disabled} onClick={onReplay}>
              {t("playAgain")}
              <ArrowRight size={19} />
            </Button>
          </>
        ) : (
          <p className="dock-wait">
            <span className="wait-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {t("waitReplay")}
          </p>
        )
      }
    >
      <div className="reveal-spotlight" aria-hidden="true" />
      <Heading
        kicker={`${t("round")} ${round} · ${t("revealLabel")}`}
        title={<span className="reveal-title">{t("revealTitle")}</span>}
      />
      <div className="normal-bubble normal-card">
        <span className="bubble-label">{t("normalQuestion")}</span>
        <p>{original}</p>
      </div>
      <div className="impostor-stage scroll-region">
        <article className="impostor-card" key={uid}>
          <Burst />
          <div className="impostor-head">
            <Avatar slot={slot} size={74} masked className="impostor-avatar" />
            <div>
              {entries.length > 1 && (
                <span className="impostor-count">
                  {format(locale, "sneakOf", {
                    n: current + 1,
                    total: entries.length,
                  })}
                </span>
              )}
              <h2>{p.nickname}</h2>
              <span className={`variation-badge v-${p.variation}`}>
                {t(kind)}
              </span>
            </div>
          </div>
          <div className="their-bubble">
            <span className="bubble-label">{t("theirQuestion")}</span>
            <p className="revealed-question">{p.question}</p>
          </div>
          <p className="variation-hint">{t(`${kind}Hint` as StringKey)}</p>
          {answers[uid] && (
            <p className="their-answer">
              <span>{t("theirAnswer")}</span>“{answers[uid].answer}”
            </p>
          )}
        </article>
      </div>
      <Pager
        page={current}
        total={entries.length}
        onChange={setPage}
        locale={locale}
        label={t("revealLabel")}
      />
      <div className="lineup" aria-label={t("lineup")}>
        {lineup.map(([id, a], i) => {
          const sneaky = Object.hasOwn(impostors, id);
          return (
            <button
              type="button"
              key={id}
              className={`lineup-face ${sneaky ? "sneaky" : ""} ${id === uid ? "current" : ""}`}
              disabled={!sneaky}
              aria-label={a.nickname}
              onClick={() => setPage(entries.findIndex(([e]) => e === id))}
            >
              <Avatar slot={slotOf(slots, id, i)} size={30} masked={sneaky} />
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
