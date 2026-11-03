import { useState } from "react";
import { ArrowRight, Eye, Settings2, Sparkles } from "lucide-react";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale, Result, RevealPlayer } from "../lib/types";
import { Button, Mask, Title } from "./ui";
import { Pager } from "./Pager";
const first = (name: string) => Array.from(name)[0]?.toUpperCase() || "?";
export function RoundDiscussion({
  locale,
  round,
  original,
  answers,
  onReveal,
  disabled = false,
}: {
  locale: Locale;
  round: number;
  original: string;
  answers: Record<string, Result>;
  onReveal?: () => void;
  disabled?: boolean;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const [page, setPage] = useState(0);
  const entries = Object.entries(answers);
  const pages = Math.ceil(entries.length / 4);
  const current = Math.min(page, pages - 1);
  return (
    <div className="narrow discussion-screen">
      <Title
        eyebrow={`${t("round")} ${round}`}
        title={t("discussionTitle")}
        sub={t("discussionSub")}
      />
      <div className="panel original-panel">
        <div className="eyebrow">{t("original")}</div>
        <h2 className="question">{original}</h2>
      </div>
      <div className="answer-list scroll-region" key={current}>
        {entries.slice(current * 4, current * 4 + 4).map(([uid, a], i) => (
          <div
            className="answer-card"
            key={uid}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <span className={`avatar avatar-${(current * 4 + i) % 5}`}>
              {first(a.nickname)}
            </span>
            <div>
              <span className="answer-name">{a.nickname}</span>
              <p>{a.answer}</p>
            </div>
          </div>
        ))}
      </div>
      <Pager
        page={current}
        total={pages}
        onChange={setPage}
        locale={locale}
        label={t("answers")}
      />
      <div className="action-dock">
        {onReveal ? (
          <Button disabled={disabled} onClick={onReveal}>
            <Eye size={18} />
            {t("revealButton")}
          </Button>
        ) : (
          <p className="field-hint center">{t("hostReveal")}</p>
        )}
      </div>
    </div>
  );
}
export function RoundReveal({
  locale,
  round,
  original,
  answers,
  impostors,
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
  onReplay?: () => void;
  onSetup?: () => void;
  disabled?: boolean;
  setupDisabled?: boolean;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const [page, setPage] = useState(0);
  const entries = Object.entries(impostors);
  const current = Math.min(page, entries.length - 1);
  const [uid, p] = entries[current];
  return (
    <div className="narrow reveal-screen">
      <div className="reveal-confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${7 + i * 7.5}%`,
              animationDelay: `${i * 28}ms`,
              rotate: `${i * 39}deg`,
            }}
          />
        ))}
      </div>
      <div className="reveal-heading">
        <Mask small />
        <Title
          eyebrow={`${t("round")} ${round} · ${t("revealLabel")}`}
          title={t("revealTitle")}
        />
      </div>
      <div className="impostor-stage scroll-region">
        <div className="panel impostor-card" key={uid}>
          <div className="reveal-person">
            <span className="reveal-avatar">{first(p.nickname)}</span>
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
            <Sparkles size={21} />
          </div>
          <div className="eyebrow">{t("theirQuestion")}</div>
          <p className="revealed-question">{p.question}</p>
          {answers[uid] && <p className="quote">“{answers[uid].answer}”</p>}
        </div>
      </div>
      <Pager
        page={current}
        total={entries.length}
        onChange={setPage}
        locale={locale}
        label={t("revealLabel")}
      />
      <div className="panel normal-card">
        <div className="eyebrow">{t("normalQuestion")}</div>
        <h2>{original}</h2>
      </div>
      <div className="action-dock replay-actions">
        {onReplay && onSetup ? (
          <>
            <Button disabled={disabled} onClick={onReplay}>
              {t("playAgain")}
              <ArrowRight size={17} />
            </Button>
            <Button
              secondary
              disabled={setupDisabled}
              onClick={onSetup}
              aria-label={t("changeSetup")}
            >
              <Settings2 size={18} />
              <span>{t("changeSetup")}</span>
            </Button>
          </>
        ) : (
          <p className="field-hint center">{t("waitReplay")}</p>
        )}
      </div>
    </div>
  );
}
