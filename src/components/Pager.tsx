import { ChevronLeft, ChevronRight } from "lucide-react";
import { translate } from "../lib/i18n";
import type { Locale } from "../lib/types";
export function Pager({
  page,
  total,
  onChange,
  locale,
  label,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  locale: Locale;
  label?: string;
}) {
  if (total <= 1) return null;
  const t = (key: "previousPage" | "nextPage" | "pages") =>
    translate(locale, key);
  return (
    <nav className="pager" aria-label={label || t("pages")}>
      <button
        type="button"
        className="icon-button"
        aria-label={t("previousPage")}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span aria-live="polite">
        {page + 1}
        <span className="pager-slash"> / </span>
        {total}
      </span>
      <div className="pager-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i === page ? "active" : ""} />
        ))}
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={t("nextPage")}
        disabled={page >= total - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
