import { useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, X } from "lucide-react";
import { categories } from "../data/questions";
import { maxImpostors } from "../lib/game";
import { format, translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale, Settings } from "../lib/types";
import {
  CategoryGrid,
  CountRail,
  ImpostorPicker,
  NameTag,
  SetupSummary,
} from "../components/game/SetupControls";
import { Button, IconButton } from "../components/ui/Button";
import { Heading } from "../components/ui/Screen";

const NAMES_PER_PAGE = 4;

/**
 * Party setup in a couple of focused steps.
 * online: host name + seats → rules. local: player names → rules. edit: rules.
 */
export function SetupFlow({
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
  const local = mode === "local";
  const totalSteps = mode === "edit" ? 1 : 2;
  const [step, setStep] = useState(mode === "edit" ? 1 : 0);
  const [namePage, setNamePage] = useState(0);
  const pages = Math.ceil(settings.capacity / NAMES_PER_PAGE);
  const currentPage = Math.min(namePage, pages - 1);
  const activeNames = names.slice(0, settings.capacity).map((n) => n.trim());
  const filled = activeNames.filter(Boolean);
  const duplicate =
    new Set(filled.map((n) => n.toLocaleLowerCase())).size !== filled.length;
  const start = currentPage * NAMES_PER_PAGE;
  const pageNames = activeNames.slice(start, start + NAMES_PER_PAGE);
  const canAdvance = local
    ? pageNames.every(Boolean) && (currentPage < pages - 1 || !duplicate)
    : !!nickname.trim();
  const capacityLabel = t(local ? "localPlayerCount" : "capacity");
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
  function forward() {
    if (local && step === 0 && currentPage < pages - 1) {
      setNamePage(currentPage + 1);
      return;
    }
    setStep(1);
  }
  const stepNumber = mode === "edit" ? 1 : step + 1;
  const allOn = settings.categories.length === categories.length;
  return (
    <form
      className={`screen screen-setup setup-${mode}`}
      data-view={`setup-${step}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 0) {
          if (canAdvance) forward();
        } else onComplete();
      }}
    >
      <div className="screen-body">
        <div className="setup-progress" aria-label={t("setupProgress")}>
          {totalSteps > 1 && (
            <>
              <span className="step-dots" aria-hidden="true">
                <i className={step >= 0 ? "on" : ""} />
                <i className={step >= 1 ? "on" : ""} />
              </span>
              <span>
                {format(locale, "stepOf", { n: stepNumber, total: totalSteps })}
              </span>
            </>
          )}
          {onCancel && (
            <IconButton label={t("cancel")} onClick={onCancel}>
              <X size={18} />
            </IconButton>
          )}
        </div>
        <div className="setup-page" key={`${step}-${currentPage}`}>
          {step === 0 ? (
            <Heading
              kicker={t(local ? "passPlay" : "onlineMode")}
              title={t(local ? "localNames" : "hostStepTitle")}
              sub={t(local ? "namesShortHint" : "hostStepSub")}
            />
          ) : (
            <Heading
              kicker={
                mode === "edit"
                  ? t("currentSetup")
                  : t(local ? "passPlay" : "onlineMode")
              }
              title={t("rulesTitle")}
              sub={<SetupSummary settings={settings} locale={locale} />}
            />
          )}
          <div className="setup-scroll scroll-region">
            {step === 0 && !local && (
              <NameTag
                id="nickname"
                label={t("nickname")}
                hello={t("nameTagHello")}
                value={nickname}
                slot={0}
                placeholder={t("nicknamePlaceholder")}
                autoComplete="nickname"
                enterKeyHint="go"
                onChange={(v) => onNickname?.(v)}
              />
            )}
            {(step === 0 || mode === "edit") && (
              <div className="field-group">
                <div className="field-title">
                  <span>{capacityLabel}</span>
                  <b>{settings.capacity}</b>
                </div>
                <CountRail
                  value={settings.capacity}
                  min={minPlayers}
                  label={capacityLabel}
                  onChange={capacity}
                />
              </div>
            )}
            {step === 0 && local && (
              <div className="field-group">
                <div className="field-title">
                  <span>
                    {start + 1}–
                    {Math.min(start + NAMES_PER_PAGE, settings.capacity)} /{" "}
                    {settings.capacity}
                  </span>
                  {pages > 1 && (
                    <span className="step-dots small" aria-hidden="true">
                      {Array.from({ length: pages }, (_, i) => (
                        <i key={i} className={i === currentPage ? "on" : ""} />
                      ))}
                    </span>
                  )}
                </div>
                <div className="name-list">
                  {names
                    .slice(
                      start,
                      Math.min(start + NAMES_PER_PAGE, settings.capacity),
                    )
                    .map((name, i) => (
                      <NameTag
                        key={start + i}
                        id={`player-${start + i + 1}`}
                        label={t("localPlayerName").replace(
                          "{n}",
                          String(start + i + 1),
                        )}
                        value={name}
                        slot={start + i}
                        placeholder={t("localPlayerName").replace(
                          "{n}",
                          String(start + i + 1),
                        )}
                        onChange={(v) => onName?.(start + i, v)}
                      />
                    ))}
                </div>
                {duplicate && (
                  <p className="inline-error" role="alert">
                    {t("localDuplicateNames")}
                  </p>
                )}
              </div>
            )}
            {step === 1 && (
              <>
                <div className="field-group">
                  <div className="field-title">
                    <span>{t("impostors")}</span>
                    <small>{t("normalMajority")}</small>
                  </div>
                  <ImpostorPicker
                    settings={settings}
                    locale={locale}
                    onChange={(impostors) =>
                      onChange({ ...settings, impostors })
                    }
                  />
                </div>
                <div className="field-group">
                  <div className="field-title">
                    <span>{t("categories")}</span>
                    <button
                      type="button"
                      className="link-btn small"
                      disabled={allOn}
                      onClick={() =>
                        onChange({
                          ...settings,
                          categories: categories.map((c) => c.id),
                        })
                      }
                    >
                      {t("selectAll")}
                    </button>
                  </div>
                  <CategoryGrid
                    selected={settings.categories}
                    locale={locale}
                    onChange={(selected) =>
                      onChange({ ...settings, categories: selected })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="action-dock">
        {(step === 1 && mode !== "edit") || currentPage > 0 ? (
          <IconButton
            label={t("previousStep")}
            className="back-btn"
            onClick={() => {
              if (step === 1) setStep(0);
              else setNamePage(currentPage - 1);
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
        ) : null}
        <Button type="submit" disabled={pending || (step === 0 && !canAdvance)}>
          {pending && <LoaderCircle className="spin" size={18} />}
          {t(
            step === 0
              ? local && currentPage < pages - 1
                ? "nextPlayers"
                : "nextStep"
              : completeLabel,
          )}
          <ArrowRight size={19} />
        </Button>
        {onFresh && step === 0 && (
          <button
            type="button"
            className="link-btn dock-link"
            onClick={onFresh}
          >
            {t("localFreshParty")}
          </button>
        )}
      </div>
    </form>
  );
}
