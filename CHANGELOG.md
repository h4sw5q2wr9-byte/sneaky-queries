# Changelog

## 1.0.0 — 2026-11-03

- Revived the supplied private-question party mechanic and purple/magenta visual direction.
- Added Firebase anonymous parties, unique room codes and links, seat-based concurrent admission, ready state and host controls.
- Added private assignments, locked answers, synchronized discussion/reveal, replay and setup reset.
- Added refresh recovery, presence, host takeover, player removal and 12-hour expiry.
- Authored 100 new complete question sets with full English and Dutch translations; no claim of recovered original questions.
- Added database security rules, emulator/game/browser tests, phone test plan and GitHub Pages workflows.

- Hardened atomic seat removal and start/admission races; verified host migration and freed-seat reuse in isolated browsers.
- Added opt-in production browser checks that preserve repository subpaths and optional Telegram deployment/test notifications with secrets kept out of source and logs.

- Moved completion notifications to the private shared sender so Telegram credentials stay in one repository; recorded the user's notification preference for future repository work.

- Added browser-only iPhone Firebase setup guidance and extended Telegram updates to questions requiring user input; documented that replies remain in ChatGPT.

- Added a phone-friendly copy page generated from the tested database security rules, with Safari selection fallback.

- Connected the owner-approved Firebase web app through public configuration defaults, kept optional environment overrides, and added five tests ensuring demo emulator isolation.

- Verified the published game against the live Firebase project with three independent browser identities and 28 live access checks; added a reusable opt-in permission smoke test.

- Added Pass & Play beside online multiplayer: shared-phone setup, named cards, private reveal covers, one-time answers, grey completed cards, deliberate discussion/reveal, replay and setup reset.
- Added safe local session recovery and background hiding, full English/Dutch UI, and shared setup controls; online room mechanics remain intact.

- Deferred Firebase Auth/Database initialization until online play so the shared-phone flow avoids background Firebase requests, including on mobile browser profiles.

- Verified all four live-site online/shared-phone checks after deployment, including no Firebase backend requests during Pass & Play.

## Compact mobile redesign — 2026-11-03

- Rebuilt the visual design around ink-purple playing cards, pink actions, a small app header and two clear play modes.
- Split setup into names/room and rules steps. Paginated ten-player names, cards, rosters and discussion answers; reveal one impostor at a time. Kept primary actions within the screen.
- Replaced separate interface/question language choices with one party language. Online guests follow their host; rounds keep their dealt language.
- Added card flips, dealt player cards, answer-lock stamps, animated handoff, staggered answers, short reveal confetti and reduced-motion support.
- Adapted the layout to the visual viewport when the software keyboard opens, with bounded scrolling for long text. Improved dialog focus handling.
- Added small-screen layout, ten-player paging, single-language and keyboard-viewport regression checks. Gameplay, Firebase privacy boundaries and both modes remain intact.
