# Firebase setup progress

Updated 2026-11-03. The owner is setting up their Google-account resources in iPhone Safari; the assistant has no Firebase administrative credentials.

- Project display name: **Sneaky Queries**, as shown in the owner's screenshots.
- Anonymous sign-in: **Enabled**, confirmed from the Authentication screenshot.
- Realtime Database: created in **Belgium (europe-west1)**, confirmed from the database screenshot.
- Exact database URL from that screenshot: `https://sneaky-queries-default-rtdb.europe-west1.firebasedatabase.app`
- Unauthenticated root read returned **HTTP 401 / Permission denied**, verified from the execution environment. This confirms the database is currently protected; it does not establish that the game's specific rules are already published.
- Game security rules: tested locally and in CI. The owner reports that the full copied rules were published successfully through Firebase's Rules tab. The assistant has not independently read the deployed rules or verified live multiplayer yet.
- Public web configuration: supplied by the owner on 2026-11-03 and stored in `src/data/firebase.web.json`. Its project ID is `sneaky-queries`; no administrative credentials are included. The app uses these defaults with optional environment overrides. Analytics is not initialized.
- Frontend: production configuration is implemented; deployment and the live three-identity multiplayer check are in progress. No live multiplayer success is claimed yet. Emulator mode is forced to a demo project and does not use this production configuration.

Use the [phone-friendly rules copy page](https://h4sw5q2wr9-byte.github.io/sneaky-queries/firebase-setup.html), then the remaining [iPhone setup instructions](IPHONE_SETUP.md). The copy page is generated from the authoritative rules on each development start and production build.
