import { format, translate } from "./i18n";
import type { StringKey } from "./i18n";
import type { Locale, Settings } from "./types";

/** Human summary chips for a party setup, e.g. "6 players · 1 impostor". */
export function summary(settings: Settings, locale: Locale) {
  const t = (k: StringKey) => translate(locale, k);
  const n = settings.categories.length;
  return [
    format(locale, "summaryPlayers", { n: settings.capacity }),
    settings.impostors === "random"
      ? t("summaryRandom")
      : settings.impostors === 1
        ? t("summaryImpostor")
        : format(locale, "summaryImpostors", { n: settings.impostors }),
    n === 1 ? t("summaryCategory") : format(locale, "summaryCategories", { n }),
  ];
}
