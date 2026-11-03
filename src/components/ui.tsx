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
