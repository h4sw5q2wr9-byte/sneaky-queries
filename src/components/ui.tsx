import { useEffect } from "react";
import { translate } from "../lib/i18n";
import type { Locale } from "../lib/types";
import type { ButtonHTMLAttributes } from "react";
export function Mask({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "mask small" : "mask"}
      viewBox="0 0 140 100"
      aria-hidden="true"
    >
      <path
        className="mask-shape"
        d="M8 38Q23 23 44 31L70 39 96 31Q117 23 132 38L125 67Q111 89 85 71L70 61 55 71Q29 89 15 67Z"
      />
      <path
        d="M25 48q14-7 27 5-11 17-25 4ZM88 53q13-12 27-5l-2 9q-14 13-25-4Z"
        fill="#271442"
      />
      <path
        d="m4 18 6-9m115 7 8-7M64 12l4-10"
        stroke="#ffadd8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Button({
  children,
  secondary = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      className={`button ${secondary ? "secondary" : "primary"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Title({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="screen-title">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function ConfirmDialog({
  text,
  locale,
  onConfirm,
  onCancel,
  disabled = false,
}: {
  text: string;
  locale: Locale;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    const previous = document.activeElement;
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Tab") {
            const buttons = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            );
            const first = buttons[0],
              last = buttons[buttons.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <h2 id="confirm-title">{text}</h2>
        <div className="action-dock">
          <Button disabled={disabled} onClick={onConfirm}>
            {translate(locale, "confirm")}
          </Button>
          <Button secondary autoFocus onClick={onCancel}>
            {translate(locale, "cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
