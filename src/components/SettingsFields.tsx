import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { categories } from "../data/questions";
import { maxImpostors } from "../lib/game";
import { translate } from "../lib/i18n";
import type { StringKey } from "../lib/i18n";
import type { Locale, Settings } from "../lib/types";
export type SettingsChange = Settings | ((current: Settings) => Settings);
export function SettingsFields({
  settings,
  onChange,
  locale,
  minPlayers = 3,
  capacityLabel = "capacity",
  children,
}: {
  settings: Settings;
  onChange: (value: SettingsChange) => void;
  locale: Locale;
  minPlayers?: number;
  capacityLabel?: StringKey;
  children?: ReactNode;
}) {
  const t = (key: StringKey) => translate(locale, key);
  return (
    <>
      <div className="settings-grid">
        <label>
          {t(capacityLabel)}
          <select
            aria-label={t(capacityLabel)}
            value={settings.capacity}
            onChange={(e) =>
              onChange({
                ...settings,
                capacity: Number(e.target.value),
                impostors:
                  settings.impostors === "random"
                    ? "random"
                    : (Math.min(
                        settings.impostors,
                        maxImpostors(Number(e.target.value)),
                      ) as 1 | 2 | 3),
              })
            }
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
        <label>
          {t("impostors")}
          <select
            aria-label={t("impostors")}
            value={settings.impostors}
            onChange={(e) =>
              onChange({
                ...settings,
                impostors:
                  e.target.value === "random"
                    ? "random"
                    : (Number(e.target.value) as 1 | 2 | 3),
              })
            }
          >
            {[1, 2, 3]
              .filter((n) => n <= maxImpostors(settings.capacity))
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            <option value="random">{t("random")}</option>
          </select>
        </label>
      </div>
      <p className="field-hint">{t("impostorHelp")}</p>
      {children}
      <label className="field-label">
        {t("questionLanguage")}
        <select
          value={settings.locale}
          onChange={(e) =>
            onChange({ ...settings, locale: e.target.value as Locale })
          }
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
        </select>
      </label>
      <div className="section-label">
        <h2>{t("categories")}</h2>
        <span>{settings.categories.length}/10</span>
      </div>
      <p className="field-hint">{t("categoryHelp")}</p>
      <div className="category-grid">
        {categories.map((c) => (
          <button
            type="button"
            aria-pressed={settings.categories.includes(c.id)}
            className={`category ${settings.categories.includes(c.id) ? "selected" : ""}`}
            key={c.id}
            onClick={() =>
              onChange((s) => ({
                ...s,
                categories: s.categories.includes(c.id)
                  ? s.categories.length > 1
                    ? s.categories.filter((id) => id !== c.id)
                    : s.categories
                  : [...s.categories, c.id],
              }))
            }
          >
            <span>{c.emoji}</span>
            <span>{c[locale]}</span>
            {settings.categories.includes(c.id) && <Check size={13} />}
          </button>
        ))}
      </div>
    </>
  );
}
