/**
 * Tiny optional sound effects synthesized with Web Audio. No files, no library.
 * Sounds only ever play in response to a tap, never autoplay, and failures are
 * silently ignored so audio can never block gameplay.
 */
const KEY = "sq-sound";
let context: AudioContext | null = null;
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();

function tone(
  notes: { f: number; at: number; len: number; type?: OscillatorType }[],
  volume = 0.05,
) {
  if (!enabled) return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    context ??= new Ctor();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    for (const n of notes) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = n.type || "sine";
      osc.frequency.setValueAtTime(n.f, now + n.at);
      gain.gain.setValueAtTime(0.0001, now + n.at);
      gain.gain.exponentialRampToValueAtTime(volume, now + n.at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.len);
      osc.connect(gain).connect(context.destination);
      osc.start(now + n.at);
      osc.stop(now + n.at + n.len + 0.02);
    }
  } catch {
    /* Audio is decoration only. */
  }
}

export const sound = {
  get enabled() {
    return enabled;
  },
  set(value: boolean) {
    enabled = value;
    try {
      localStorage.setItem(KEY, value ? "on" : "off");
    } catch {
      /* Preference is optional. */
    }
  },
  tap: () => tone([{ f: 660, at: 0, len: 0.06, type: "triangle" }], 0.025),
  reveal: () =>
    tone([
      { f: 523, at: 0, len: 0.12, type: "triangle" },
      { f: 784, at: 0.08, len: 0.18, type: "triangle" },
    ]),
  lock: () =>
    tone(
      [
        { f: 196, at: 0, len: 0.09, type: "square" },
        { f: 392, at: 0.06, len: 0.12, type: "triangle" },
      ],
      0.035,
    ),
  fanfare: () =>
    tone([
      { f: 392, at: 0, len: 0.14, type: "triangle" },
      { f: 523, at: 0.11, len: 0.14, type: "triangle" },
      { f: 659, at: 0.22, len: 0.14, type: "triangle" },
      { f: 784, at: 0.33, len: 0.32, type: "triangle" },
    ]),
};
