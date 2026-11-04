import { Check, Dices } from "lucide-react";
import { categories } from "../../data/questions";
import { maxImpostors, MAX_NICKNAME } from "../../lib/game";
import { translate } from "../../lib/i18n";
import { summary } from "../../lib/summary";
import type { StringKey } from "../../lib/i18n";
import type {
  Category,
  ImpostorSetting,
  Locale,
  Settings,
} from "../../lib/types";
import { sound } from "../../lib/sound";
import { Avatar } from "../ui/Avatar";

/** A tappable rail of player counts, 3–10. */
export function CountRail({
  value,
  min = 3,
  label,
  onChange,
}: {
  value: number;
  min?: number;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="count-rail" role="radiogroup" aria-label={label}>
      {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
        <button
          type="button"
          role="radio"
          key={n}
          aria-checked={value === n}
          aria-label={String(n)}
          disabled={n < min}
          onClick={() => {
            sound.tap();
            onChange(n);
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Impostor count as a line-up of disguised critters. */
export function ImpostorPicker({
  settings,
  locale,
  onChange,
}: {
  settings: Settings;
  locale: Locale;
  onChange: (value: ImpostorSetting) => void;
}) {
  const t = (k: StringKey) => translate(locale, k);
  const max = maxImpostors(settings.capacity);
  return (
    <div className="impostor-picker" role="group" aria-label={t("impostors")}>
      {([1, 2, 3, "random"] as const).map((n) => {
        const unavailable = n !== "random" && n > max;
        const active = settings.impostors === n;
        return (
          <button
            type="button"
            key={n}
            aria-pressed={active}
            aria-label={n === "random" ? t("random") : String(n)}
            disabled={unavailable}
            title={unavailable ? t("needsMorePlayers") : undefined}
            onClick={() => {
              sound.tap();
              onChange(n);
            }}
          >
            <span className="impostor-faces" aria-hidden="true">
              {n === "random" ? (
                <Dices size={26} />
              ) : (
                Array.from({ length: n }, (_, i) => (
                  <span key={i} className="mini-mask" />
                ))
              )}
            </span>
            <span className="impostor-label">
              {n === "random" ? t("random") : n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CategoryGrid({
  selected,
  locale,
  onChange,
}: {
  selected: Category[];
  locale: Locale;
  onChange: (value: Category[]) => void;
}) {
  return (
    <div className="category-grid">
      {categories.map((c, i) => {
        const on = selected.includes(c.id);
        return (
          <button
            type="button"
            key={c.id}
            aria-pressed={on}
            className={`category-chip cat-${i}`}
            onClick={() => {
              sound.tap();
              onChange(
                on
                  ? selected.length > 1
                    ? selected.filter((id) => id !== c.id)
                    : selected
                  : [...selected, c.id],
              );
            }}
          >
            <span className="category-emoji" aria-hidden="true">
              {c.emoji}
            </span>
            <span className="category-name">{c[locale]}</span>
            <span className="category-check" aria-hidden="true">
              <Check size={12} strokeWidth={3.5} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SetupSummary({
  settings,
  locale,
}: {
  settings: Settings;
  locale: Locale;
}) {
  return (
    <span className="setup-summary">
      {summary(settings, locale).map((part) => (
        <span key={part}>{part}</span>
      ))}
    </span>
  );
}

/** A "HELLO my name is" sticker. A real, labelled text input underneath. */
export function NameTag({
  id,
  label,
  value,
  slot,
  hello,
  placeholder,
  onChange,
  autoFocus,
  enterKeyHint = "next",
  autoComplete = "off",
}: {
  id: string;
  label: string;
  value: string;
  slot: number;
  hello?: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  enterKeyHint?: "next" | "done" | "go";
  autoComplete?: string;
}) {
  return (
    <div className={`name-tag ${hello ? "big" : ""}`}>
      {hello && <span className="name-tag-hello">{hello}</span>}
      <div className="name-tag-row">
        <Avatar slot={slot} size={hello ? 44 : 36} />
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          name={id}
          value={value}
          maxLength={MAX_NICKNAME}
          required
          autoComplete={autoComplete}
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
        {!hello && <span className="name-tag-num">{slot + 1}</span>}
      </div>
    </div>
  );
}
