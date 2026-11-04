import type { ReactNode } from "react";

/**
 * Every game screen shares one skeleton: a body that fits the viewport and an
 * optional bottom-anchored dock holding the screen's primary action.
 */
export function Screen({
  name,
  children,
  dock,
  className = "",
}: {
  name: string;
  children: ReactNode;
  dock?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`screen screen-${name} ${className}`} data-view={name}>
      <div className="screen-body">{children}</div>
      {dock && <div className="action-dock">{dock}</div>}
    </section>
  );
}

export function Heading({
  kicker,
  title,
  sub,
  aside,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="heading">
      <div className="heading-copy">
        {kicker && <div className="kicker">{kicker}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {aside}
    </header>
  );
}
