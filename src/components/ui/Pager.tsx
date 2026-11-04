import { ChevronLeft, ChevronRight } from "lucide-react";
import { translate } from "../../lib/i18n";
import type { Locale } from "../../lib/types";
import { IconButton } from "./Button";

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
  return (
    <nav className="pager" aria-label={label || translate(locale, "pages")}>
      <IconButton
        label={translate(locale, "previousPage")}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </IconButton>
      <span className="pager-dots">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i === page ? "on" : ""} />
        ))}
        <span className="sr-only" aria-live="polite">
          {page + 1} / {total}
        </span>
      </span>
      <IconButton
        label={translate(locale, "nextPage")}
        disabled={page >= total - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </IconButton>
    </nav>
  );
}
