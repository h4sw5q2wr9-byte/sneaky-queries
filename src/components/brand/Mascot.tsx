import { useId } from "react";

/**
 * "Sneaky" — the brand mascot: a candy-pink speech bubble with half-lidded,
 * sideways-glancing eyes, hiding in front of a second violet bubble that holds
 * the question mark. Two bubbles = same friends, different questions.
 */
export function Mascot({
  size = 120,
  className = "",
  animated = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`mascot ${animated ? "is-animated" : ""} ${className}`}
      width={size}
      height={size * (100 / 120)}
      viewBox="0 0 120 100"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-pink`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#FF7CC0" />
          <stop offset="1" stopColor="#F2368F" />
        </linearGradient>
        <linearGradient id={`${id}-violet`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A47DFF" />
          <stop offset="1" stopColor="#6E3EE6" />
        </linearGradient>
      </defs>
      <g className="mascot-back">
        <path
          d="M78 4h18a20 20 0 0 1 20 20v6a20 20 0 0 1-20 20h-2l6 10-15-10h-7a20 20 0 0 1-20-20v-6A20 20 0 0 1 78 4Z"
          fill={`url(#${id}-violet)`}
        />
        <path
          d="M80.5 20.5q0-7 7-7t7 6.5q0 4.5-5 6.5-2 1-2 4"
          fill="none"
          stroke="#FAF7FF"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="87.5" cy="37.5" r="2.6" fill="#FAF7FF" />
      </g>
      <g className="mascot-front">
        <path
          d="M34 24h22a30 30 0 0 1 30 30v2a30 30 0 0 1-30 30H34l-20 11 6-15A30 30 0 0 1 4 56v-2a30 30 0 0 1 30-30Z"
          fill={`url(#${id}-pink)`}
        />
        <path
          d="M20 40q8-11 24-12"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity=".35"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <g className="mascot-eyes">
          <ellipse cx="32" cy="57" rx="11.5" ry="12" fill="#FAF7FF" />
          <ellipse cx="60" cy="57" rx="11.5" ry="12" fill="#FAF7FF" />
          <g className="mascot-pupils">
            <circle cx="37" cy="60" r="5.8" fill="#1B0F35" />
            <circle cx="65" cy="60" r="5.8" fill="#1B0F35" />
            <circle cx="39" cy="58" r="1.7" fill="#FFF" />
            <circle cx="67" cy="58" r="1.7" fill="#FFF" />
          </g>
          {/* Half-lowered lids: the suspicious squint. */}
          <path d="M19.5 54a12.5 12.5 0 0 1 25 0Z" fill="#D92A7E" />
          <path d="M47.5 54a12.5 12.5 0 0 1 25 0Z" fill="#D92A7E" />
        </g>
        <path
          className="mascot-brow"
          d="M49 37.5q10-5 21 1"
          fill="none"
          stroke="#1B0F35"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M40 75q6 3 12 0"
          fill="none"
          stroke="#1B0F35"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark ${compact ? "compact" : ""}`}>
      <span className="wordmark-top">Sneaky</span>
      <span className="wordmark-bottom">Queries</span>
    </span>
  );
}
