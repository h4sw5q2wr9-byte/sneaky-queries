# Firebase setup progress

Updated 2026-11-03. The owner is setting up their Google-account resources in iPhone Safari; the assistant has no Firebase administrative credentials.

- Project display name: **Sneaky Queries**, as shown in the owner's screenshots.
- Anonymous sign-in: **Enabled**, confirmed from the Authentication screenshot.
- Realtime Database: created in **Belgium (europe-west1)**, confirmed from the database screenshot.
- Exact database URL from that screenshot: `https://sneaky-queries-default-rtdb.europe-west1.firebasedatabase.app`
- Unauthenticated root read returned **HTTP 401 / Permission denied**, verified from the execution environment. This confirms the database is currently protected; it does not establish that the game's specific rules are already published.
- Game security rules: tested locally and in CI. The owner reports that the full copied rules were published successfully through Firebase's Rules tab. The assistant has not independently read the deployed rules or verified live multiplayer yet.
- Public web configuration (`apiKey`, `authDomain`, `projectId`, `appId`): not provided yet. Do not infer these values from the project display name. A request to the possible Hosting public-init endpoint returned 404, so no web configuration was recovered automatically.
- Frontend: published on GitHub Pages; real Firebase multiplayer remains unconfigured and unverified.

Use the [phone-friendly rules copy page](https://h4sw5q2wr9-byte.github.io/sneaky-queries/firebase-setup.html), then the remaining [iPhone setup instructions](IPHONE_SETUP.md). The copy page is generated from the authoritative rules on each development start and production build.
