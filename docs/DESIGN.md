# Sneaky Queries 2.0 design notes

## Concept: playful premium

A commercial-feeling party game, not a web form: deep plum night-time backdrop with soft drifting light, candy-pink and violet gradient objects that look physical (pressable edges, slight tilts, stickers, tickets, envelopes), and warm-white "paper" surfaces for the things you write on.

## Brand

- **Mascot "Sneaky"** (`src/components/brand/Mascot.tsx`): a pink speech bubble with half-lowered lids and eyes glancing sideways, hiding in front of a violet bubble holding the question mark. Two bubbles = same friends, different questions. Recognisable without the title; used as icon, cover art, waiting and reveal character.
- **Wordmark**: stacked, tilted Fredoka "Sneaky / Queries" with pink and violet drop edges.
- **Icon**: `public/favicon.svg` is the source; PNGs in `public/icons/` are rendered from it.

## Tokens (`src/styles/base.css`)

Plum `#140D27` / `#21143D`, purple `#34175F`, violet `#8657F4`, pink `#FF4FA3`, lavender `#C6ACFF`, warm white `#FAF7FF`, mint `#54E3CE` (success/ready), sun `#FFC94D` (host, invites). Seat colours `--seat-0…9`. Radii 12/18/24/32. Display font Fredoka, body Plus Jakarta Sans.

## Patterns

- `Screen` = body + bottom `action-dock` with one primary jelly button.
- `Sheet` for secondary tasks (online choice, how to play, settings, confirmations, player management).
- `Avatar`: colour + silhouette + glance from seat index only — never from role.
- Light "paper" (name tags, answer note, normal question bubble) vs. vivid gradient objects (mode cards, ticket, sealed card, question card, impostor bubble).

## Privacy rules for visuals

The cover, reveal animation, question card and answer note are identical for every player. Never add role-dependent colours, icons, sounds or animations before the reveal phase. The question text is not in the DOM until the player taps reveal.

## Motion

Opacity/transform keyframes only; entrances 0.3–0.6 s, the reveal drumroll 1.3 s and skippable by tap. `prefers-reduced-motion` disables every animation (`src/styles/adaptive.css`).

## Responsive

Designed at 390×844, verified at 320×568, 375×667, 390×844, 430×932 and 1440×900. Height breakpoints at 700 px and 600 px compress art and spacing; ≤600 px shows three answers per page. Keyboard-open state (`data-keyboard`) hides chrome so the answer and Lock button stay visible.
