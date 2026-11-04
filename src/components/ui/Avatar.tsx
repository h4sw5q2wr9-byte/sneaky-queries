/**
 * Sneaky critters: every seat gets a stable colour, silhouette and glance.
 * Avatars depend only on seat order, never on a player's secret role.
 */
const COLORS = [
  "#FF4FA3",
  "#8657F4",
  "#54E3CE",
  "#FFC94D",
  "#FF7A6B",
  "#5AB8FF",
  "#C6ACFF",
  "#A6E35A",
  "#FF9F43",
  "#E05CFF",
];
const SHAPES = [
  // blob
  "M32 6c15 0 26 10 26 26S47 60 32 60 6 48 6 32 17 6 32 6Z",
  // speech bubble
  "M18 8h28a12 12 0 0 1 12 12v20a12 12 0 0 1-12 12H28l-12 8 2-8a12 12 0 0 1-12-12V20A12 12 0 0 1 18 8Z",
  // ghost
  "M32 5c14 0 24 11 24 25v28l-6-5-6 5-6-5-6 5-6-5-6 5-6-5-6 5V30C8 16 18 5 32 5Z",
  // squircle
  "M32 6c22 0 26 4 26 26s-4 26-26 26S6 54 6 32 10 6 32 6Z",
  // cat
  "M10 8l12 9a26 26 0 0 1 20 0l12-9 2 18a24 24 0 0 1-24 33A24 24 0 0 1 8 26Z",
  // cloud
  "M20 22a13 13 0 0 1 24-4 11 11 0 0 1 12 11 11 11 0 0 1-1 22H14a12 12 0 0 1-2-24 9 9 0 0 1 8-5Z",
  // drop
  "M32 4c9 12 24 24 24 36a24 24 0 0 1-48 0C8 28 23 16 32 4Z",
  // hexagon
  "M32 5l22 12.5v25L32 58 10 42.5v-25Z",
  // bean
  "M18 10c10-6 22 2 30 4s14 12 8 26-20 18-32 16S4 44 6 30s4-16 12-20Z",
  // star-ish flower
  "M32 6l7 9 11-2-1 11 9 7-9 7 1 11-11-2-7 9-7-9-11 2 1-11-9-7 9-7-1-11 11 2Z",
];
const EYE_Y = [33, 30, 28, 32, 34, 35, 40, 32, 31, 32];

export function Avatar({
  slot,
  name,
  size = 48,
  masked = false,
  className = "",
}: {
  slot: number;
  name?: string;
  size?: number;
  masked?: boolean;
  className?: string;
}) {
  const i = ((slot % 10) + 10) % 10;
  const look = i % 2 ? -3 : 3;
  const y = EYE_Y[i];
  const initial = name ? Array.from(name.trim())[0]?.toUpperCase() : "";
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, ["--tint" as string]: COLORS[i] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <path d={SHAPES[i]} fill={COLORS[i]} />
        <path
          d={SHAPES[i]}
          fill="url(#avatar-shine)"
          style={{ mixBlendMode: "soft-light" }}
        />
        <g className="avatar-eyes">
          <ellipse cx="24" cy={y} rx="6.5" ry="7" fill="#FAF7FF" />
          <ellipse cx="40" cy={y} rx="6.5" ry="7" fill="#FAF7FF" />
          <g
            className="avatar-pupils"
            style={{ transform: `translateX(${look}px)` }}
          >
            <circle cx="24" cy={y + 1} r="3.4" fill="#1B0F35" />
            <circle cx="40" cy={y + 1} r="3.4" fill="#1B0F35" />
          </g>
        </g>
        {masked && (
          <path
            className="avatar-mask"
            d={`M10 ${y - 8}q22-6 44 0l-2 12q-6 6-14 1l-6-3-6 3q-8 5-14-1Z`}
            fill="#1B0F35"
          />
        )}
        {masked && (
          <g fill="#FAF7FF">
            <circle cx="24" cy={y} r="2.6" />
            <circle cx="40" cy={y} r="2.6" />
          </g>
        )}
      </svg>
      {initial && <span className="avatar-initial">{initial}</span>}
    </span>
  );
}

/** Shared gradient used by every avatar's soft highlight. Render once. */
export function AvatarDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="avatar-shine" cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </radialGradient>
      </defs>
    </svg>
  );
}
