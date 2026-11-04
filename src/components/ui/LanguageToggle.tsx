import { translate } from "../../lib/i18n";
import type { Locale } from "../../lib/types";

const LOCALES: Locale[] = ["en", "nl"];
/** The single party-language control. Sets both interface and questions. */
export function LanguageToggle({
  locale,
  disabled,
  hint,
  onChange,
}: {
  locale: Locale;
  disabled: boolean;
  hint: string;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div
      className="lang-toggle"
      role="radiogroup"
      aria-label={translate(locale, "language")}
      title={hint}
      data-disabled={disabled}
    >
      {LOCALES.map((code) => (
        <button
          type="button"
          key={code}
          role="radio"
          aria-checked={locale === code}
          aria-label={code === "en" ? "English" : "Nederlands"}
          disabled={disabled}
          onClick={() => onChange(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
      <i aria-hidden="true" data-pos={LOCALES.indexOf(locale)} />
    </div>
  );
}
