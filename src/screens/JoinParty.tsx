import { useRef, useState } from "react";
import { ArrowRight, LoaderCircle, PartyPopper } from "lucide-react";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale } from "../lib/types";
import { NameTag } from "../components/game/SetupControls";
import { Button } from "../components/ui/Button";
import { Heading } from "../components/ui/Screen";

/** Six letter tiles over one real input: tap anywhere to type the code. */
function CodeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  return (
    <div className="code-input" onClick={() => input.current?.focus()}>
      <label className="sr-only" htmlFor="room-code">
        {label}
      </label>
      <input
        ref={input}
        id="room-code"
        name="roomCode"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        value={value}
        maxLength={6}
        minLength={6}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) =>
          onChange(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 6),
          )
        }
      />
      <div className="code-tiles" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={`${value[i] ? "filled" : ""} ${
              focused && i === Math.min(value.length, 5) ? "caret" : ""
            }`}
          >
            {value[i] || ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function JoinParty({
  locale,
  invited,
  nickname,
  onNickname,
  code,
  onCode,
  pending,
  onJoin,
}: {
  locale: Locale;
  invited: boolean;
  nickname: string;
  onNickname: (value: string) => void;
  code: string;
  onCode: (value: string) => void;
  pending: boolean;
  onJoin: () => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  return (
    <form
      className="screen screen-join"
      data-view="join"
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending && nickname.trim() && code.length === 6) onJoin();
      }}
    >
      <div className="screen-body">
        <Heading
          kicker={
            invited ? (
              <span className="invite-flag">
                <PartyPopper size={14} /> {t("invitedTo")}
              </span>
            ) : (
              t("onlineMode")
            )
          }
          title={t("joinTitle")}
          sub={t("joinSub")}
        />
        <div className="join-scroll scroll-region">
          <div className="field-group">
            <div className="field-title">
              <span>{t("roomCode")}</span>
              <small>{t("codeHint")}</small>
            </div>
            <CodeInput value={code} onChange={onCode} label={t("roomCode")} />
          </div>
          <NameTag
            id="nickname"
            label={t("nickname")}
            hello={t("nameTagHello")}
            value={nickname}
            slot={4}
            placeholder={t("nicknamePlaceholder")}
            autoComplete="nickname"
            enterKeyHint="go"
            onChange={onNickname}
          />
        </div>
      </div>
      <div className="action-dock">
        <Button
          type="submit"
          disabled={pending || !nickname.trim() || code.length !== 6}
        >
          {pending ? <LoaderCircle size={18} className="spin" /> : null}
          {t("joinButton")}
          <ArrowRight size={19} />
        </Button>
      </div>
    </form>
  );
}
