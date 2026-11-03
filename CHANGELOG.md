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
