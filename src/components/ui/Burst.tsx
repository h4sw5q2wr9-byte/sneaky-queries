/** A one-shot confetti burst. Pure CSS transforms; hidden for reduced motion. */
const COLORS = [
  "#FF4FA3",
  "#8657F4",
  "#54E3CE",
  "#FFC94D",
  "#C6ACFF",
  "#FAF7FF",
];
export function Burst({ pieces = 22 }: { pieces?: number }) {
  return (
    <div className="burst" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (360 / pieces) * i + (i % 3) * 7;
        const distance = 90 + ((i * 37) % 70);
        return (
          <i
            key={i}
            style={{
              ["--a" as string]: `${angle}deg`,
              ["--d" as string]: `${distance}px`,
              ["--r" as string]: `${(i * 53) % 360}deg`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 5) * 18}ms`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}
