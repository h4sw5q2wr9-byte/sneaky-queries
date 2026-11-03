# Firebase setup progress

Updated 2026-11-03. The owner is setting up their Google-account resources in iPhone Safari; the assistant has no Firebase administrative credentials.

- Project display name: **Sneaky Queries**, as shown in the owner's screenshots.
- Anonymous sign-in: **Enabled**, confirmed from the Authentication screenshot.
- Realtime Database: created in **Belgium (europe-west1)**, confirmed from the database screenshot.
- Exact database URL from that screenshot: `https://sneaky-queries-default-rtdb.europe-west1.firebasedatabase.app`
- Unauthenticated root read returned **HTTP 401 / Permission denied**, verified from the execution environment. This confirms the database is currently protected; it does not establish that the game's specific rules are already published.
- Game security rules: tested locally and in CI. The owner reports that the full copied rules were published successfully through Firebase's Rules tab. The assistant cannot read the deployed rule source without administrative credentials; 28 live checks verified the expected access boundaries and phase-gated behavior.
- Public web configuration: supplied by the owner on 2026-11-03 and stored in `src/data/firebase.web.json`. Its project ID is `sneaky-queries`; no administrative credentials are included. The app uses these defaults with optional environment overrides. Analytics is not initialized.
- Frontend: [production deployment](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41673312906) succeeded for commit `5ad2547`. The published site passed a complete live round test using three isolated Chromium contexts and distinct anonymous Firebase identities, including refresh, reconnect, discussion, reveal, replay, reset and Dutch question setup. Emulator mode is forced to a demo project. Physical phones have not been tested by the assistant.

Use the [phone-friendly rules copy page](https://h4sw5q2wr9-byte.github.io/sneaky-queries/firebase-setup.html), then the remaining [iPhone setup instructions](IPHONE_SETUP.md). The copy page is generated from the authoritative rules on each development start and production build.

The configured public site is https://h4sw5q2wr9-byte.github.io/sneaky-queries/ . No further setup action is currently required from the owner for the tested multiplayer flow. The assistant did not initialize Analytics.
