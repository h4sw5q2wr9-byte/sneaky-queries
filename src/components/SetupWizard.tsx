import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Users,
  X,
} from "lucide-react";
import { categories } from "../data/questions";
import { maxImpostors, MAX_NICKNAME } from "../lib/game";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale, Settings } from "../lib/types";
import { Button, Title } from "./ui";
export function SetupWizard({
  mode,
  settings,
  onChange,
  locale,
  nickname = "",
  onNickname,
  names = [],
  onName,
  onComplete,
  completeLabel,
  pending = false,
  minPlayers = 3,
  onFresh,
  onCancel,
}: {
  mode: "online" | "local" | "edit";
  settings: Settings;
  onChange: (settings: Settings) => void;
  locale: Locale;
  nickname?: string;
  onNickname?: (name: string) => void;
  names?: string[];
  onName?: (index: number, name: string) => void;
  onComplete: () => void;
  completeLabel: StringKey;
  pending?: boolean;
  minPlayers?: number;
  onFresh?: () => void;
  onCancel?: () => void;
}) {
  const t = (key: StringKey) => translate(locale, key);
  const [step, setStep] = useState(0);
  const [namePage, setNamePage] = useState(0);
  const local = mode === "local";
  const pages = Math.ceil(settings.capacity / 4);
  const currentPage = Math.min(namePage, pages - 1);
  const activeNames = names.slice(0, settings.capacity).map((n) => n.trim());
  const filled = activeNames.filter(Boolean);
  const duplicate =
    new Set(filled.map((n) => n.toLocaleLowerCase())).size !== filled.length;
  const start = currentPage * 4;
  const currentNames = activeNames.slice(start, start + 4);
  const canAdvance = local
    ? currentNames.every(Boolean) && (currentPage < pages - 1 || !duplicate)
    : mode === "edit" || !!nickname.trim();
  function capacity(value: number) {
    onChange({
      ...settings,
      capacity: value,
      impostors:
        settings.impostors === "random"
          ? "random"
          : (Math.min(settings.impostors, maxImpostors(value)) as 1 | 2 | 3),
    });
    setNamePage(0);
  }
  const forward = () => {
    if (local && step === 0 && currentPage < pages - 1) {
      setNamePage(currentPage + 1);
      return;
    }
    setStep(1);
  };
  return (
    <form
      className="setup-wizard"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 0) {
          if (canAdvance) forward();
        } else onComplete();
      }}
    >
      <div className="wizard-steps" aria-label={t("setupProgress")}>
        <span className={step === 0 ? "active" : ""}>
          <i>1</i>
          {t(local ? "localNames" : "youAndParty")}
        </span>
        <b />
        <span className={step === 1 ? "active" : ""}>
          <i>2</i>
          {t("theRules")}
        </span>
      </div>
      <div className="wizard-page screen-enter" key={`${step}-${currentPage}`}>
        <div className="title-with-action">
          <Title
            eyebrow={
              mode === "edit" ? undefined : t(local ? "passPlay" : "onlineMode")
            }
            title={t(
              step === 0
                ? local
                  ? "localNames"
                  : mode === "edit"
                    ? "currentSetup"
                    : "setupTitle"
                : "setTheScene",
            )}
            sub={t(
              step === 0
                ? local
                  ? "namesShortHint"
                  : "setupSub"
                : "rulesShortHint",
            )}
          />
          {onCancel && (
            <button
              type="button"
              className="icon-button"
              aria-label={t("cancel")}
              onClick={onCancel}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="wizard-scroll scroll-region">
          {step === 0 && (
            <label className="field-label">
              {t(local ? "localPlayerCount" : "capacity")}
              <select
                aria-label={t(local ? "localPlayerCount" : "capacity")}
                value={settings.capacity}
                onChange={(e) => capacity(Number(e.target.value))}
              >
                {Array.from({ length: 8 }, (_, i) => i + 3)
                  .filter((n) => n >= minPlayers)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {step === 0 &&
            mode !== "edit" &&
            (local ? (
              <>
                <div className="roster-caption">
                  <Users size={14} />
                  <span>
                    {start + 1}–{Math.min(start + 4, settings.capacity)} /{" "}
                    {settings.capacity}
                  </span>
                </div>
                <div className="local-name-inputs">
                  {names
                    .slice(start, Math.min(start + 4, settings.capacity))
                    .map((name, i) => (
                      <label className="field-label" key={start + i}>
                        {t("localPlayerName").replace(
                          "{n}",
                          String(start + i + 1),
                        )}
                        <input
                          autoComplete="off"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          name={`player-${start + i + 1}`}
                          maxLength={MAX_NICKNAME}
                          value={name}
                          required
                          placeholder={t("nicknamePlaceholder")}
                          onChange={(e) => onName?.(start + i, e.target.value)}
                        />
                      </label>
                    ))}
                </div>
                {duplicate && (
                  <p className="local-validation" role="alert">
                    {t("localDuplicateNames")}
                  </p>
                )}
              </>
            ) : (
              <label className="field-label">
                {t("nickname")}
                <input
                  name="nickname"
                  autoComplete="nickname"
                  maxLength={MAX_NICKNAME}
                  value={nickname}
                  onChange={(e) => onNickname?.(e.target.value)}
                  placeholder={t("nicknamePlaceholder")}
                  required
                />
              </label>
            ))}
          {step === 1 && (
            <>
              <div className="section-label">
                <h2>{t("impostors")}</h2>
                <span>{t("normalMajority")}</span>
              </div>
              <div
                className="segmented"
                role="group"
                aria-label={t("impostors")}
              >
                {([1, 2, 3, "random"] as const)
                  .filter(
                    (n) =>
                      n === "random" || n <= maxImpostors(settings.capacity),
                  )
                  .map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-pressed={settings.impostors === n}
                      className={settings.impostors === n ? "active" : ""}
                      onClick={() => onChange({ ...settings, impostors: n })}
                    >
                      {n === "random" ? t("random") : n}
                    </button>
                  ))}
              </div>
              <div className="section-label category-label">
                <h2>{t("categories")}</h2>
                <span>{settings.categories.length}/10</span>
              </div>
              <div className="category-grid">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-pressed={settings.categories.includes(c.id)}
                    className={`category ${settings.categories.includes(c.id) ? "selected" : ""}`}
                    onClick={() =>
                      onChange({
                        ...settings,
                        categories: settings.categories.includes(c.id)
                          ? settings.categories.length > 1
                            ? settings.categories.filter((id) => id !== c.id)
                            : settings.categories
                          : [...settings.categories, c.id],
                      })
                    }
                  >
                    <span className="category-emoji">{c.emoji}</span>
                    <span>{c[locale]}</span>
                    {settings.categories.includes(c.id) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="action-dock wizard-actions">
        {(step === 1 || currentPage > 0) && (
          <Button
            secondary
            type="button"
            className="wizard-back"
            aria-label={t("previousStep")}
            onClick={() => {
              if (step === 1) setStep(0);
              else setNamePage(currentPage - 1);
            }}
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <Button type="submit" disabled={pending || (step === 0 && !canAdvance)}>
          {pending ? <LoaderCircle className="spin" size={18} /> : null}
          {t(
            step === 0
              ? local && currentPage < pages - 1
                ? "nextPlayers"
                : "nextStep"
              : completeLabel,
          )}
          <ArrowRight size={18} />
        </Button>
        {onFresh && step === 0 && (
          <button
            type="button"
            className="text-button fresh-link"
            onClick={onFresh}
          >
            {t("localFreshParty")}
          </button>
        )}
      </div>
    </form>
  );
}
