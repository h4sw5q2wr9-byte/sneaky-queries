import type { ButtonHTMLAttributes, ReactNode } from "react";
import { sound } from "../../lib/sound";

type Variant = "primary" | "secondary" | "ghost" | "mint";
export function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={(e) => {
        sound.tap();
        onClick?.(e);
      }}
      {...props}
    >
      <span className="btn-face">{children}</span>
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label={label}
      title={label}
      onClick={(e) => {
        sound.tap();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
