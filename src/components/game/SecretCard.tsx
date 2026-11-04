import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, Lock, LoaderCircle } from "lucide-react";
import { MAX_ANSWER } from "../../lib/game";
import { format, translate } from "../../lib/i18n";
import type { StringKey } from "../../lib/i18n";
import type { Locale } from "../../lib/types";
import { sound } from "../../lib/sound";
import { Mascot } from "../brand/Mascot";
import { Avatar } from "../ui/Avatar";
import { Button, IconButton } from "../ui/Button";
import { Screen } from "../ui/Screen";

/**
 * The private turn, identical for every player and role: a sealed card, an
 * explicit reveal, then the question and the answer note. The question text is
 * not rendered at all until the player chooses to reveal it.
 */
export function SecretCard({
  locale,
  roundLabel,
  name,
  slot,
  coverTitle,
  coverSub,
  question,
  revealed,
  onReveal,
  onHide,
  onNotMe,
  draft,
  onDraft,
  onSubmit,
  pending = false,
  disabled = false,
  inputId,
  manage,
}: {
  locale: Locale;
  roundLabel: string;
  name: string;
  slot: number;
  coverTitle: string;
  coverSub: string;
  question: string | null;
  revealed: boolean;
  onReveal: () => void;
  onHide?: () => void;
  onNotMe?: () => void;
  draft: string;
  onDraft: (value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  disabled?: boolean;
  inputId: string;
  manage?: ReactNode;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const field = useRef<HTMLTextAreaElement>(null);
  const left = MAX_ANSWER - draft.length;
  useEffect(() => {
    if (revealed) sound.reveal();
  }, [revealed]);

  if (!revealed)
    return (
      <Screen
        name="cover"
        dock={
          <>
            <Button onClick={onReveal} disabled={disabled && !question}>
              <Eye size={19} />
              {t("localRevealQuestion")}
            </Button>
            {onNotMe && (
              <button type="button" className="link-btn" onClick={onNotMe}>
                {t("localNotMe")}
              </button>
            )}
          </>
        }
      >
        <div className="cover-head">
          <Avatar slot={slot} name={name} size={52} className="pop-in" />
          <div>
            <div className="kicker">{roundLabel}</div>
            <h1>{coverTitle}</h1>
            <p>{coverSub}</p>
          </div>
        </div>
        <button
          type="button"
          className="sealed-card"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onReveal}
        >
          <span className="sealed-pattern" aria-hidden="true" />
          <span className="sealed-flap" aria-hidden="true" />
          <span className="sealed-mascot" aria-hidden="true">
            <Mascot size={118} />
          </span>
          <span className="seal" aria-hidden="true">
            <span>SQ</span>
          </span>
          <span className="sealed-label">{t("coverSeal")}</span>
          <span className="sealed-hint">{t("tapToReveal")}</span>
        </button>
        {manage}
      </Screen>
    );

  return (
    <Screen
      name="answer"
      dock={
        <>
          {onHide && (
            <IconButton
              label={t("localHideQuestion")}
              className="hide-btn"
              onClick={onHide}
            >
              <EyeOff size={20} />
            </IconButton>
          )}
          <Button
            type="submit"
            form="answer-form"
            disabled={pending || disabled || !draft.trim() || !question}
          >
            {pending ? (
              <LoaderCircle className="spin" size={19} />
            ) : (
              <Lock size={18} />
            )}
            {t("lockAnswer")}
          </Button>
        </>
      }
    >
      <form
        id="answer-form"
        className="answer-layout"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim() || pending || disabled) return;
          sound.lock();
          onSubmit();
        }}
      >
        <div className="question-card flip-in">
          <div className="question-card-top">
            <span className="question-badge">{t("privateLabel")}</span>
            <span className="question-who">
              <Avatar slot={slot} size={26} />
              {format(locale, "yourTurnName", { name })}
            </span>
          </div>
          {question ? (
            <h2 className="question scroll-region">{question}</h2>
          ) : (
            <LoaderCircle className="spin" size={28} />
          )}
          <span className="question-round">{roundLabel}</span>
        </div>
        <div className="answer-note">
          <div className="answer-note-head">
            <label htmlFor={inputId}>{t("answerLabel")}</label>
            <span
              className={`char-count ${left < 20 ? "low" : ""}`}
              aria-hidden="true"
            >
              {draft.length}/{MAX_ANSWER}
            </span>
          </div>
          <textarea
            ref={field}
            id={inputId}
            maxLength={MAX_ANSWER}
            required
            rows={2}
            value={draft}
            enterKeyHint="done"
            placeholder={t("answerPlaceholder")}
            onChange={(e) => onDraft(e.target.value)}
          />
          <p className="answer-hint">{t("answerHint")}</p>
        </div>
        {manage}
      </form>
    </Screen>
  );
}
