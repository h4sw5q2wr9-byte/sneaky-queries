# Sneaky Queries 1.0

**Same friends. Different questions.** A mobile-first party game for 3–10 players, with real-time online rooms and shared-phone Pass & Play. React + TypeScript + Vite, anonymous Firebase Authentication, Firebase Realtime Database, and GitHub Pages. No registration, voting, scores, or paid backend required.

This revival follows the supplied October 2025 mechanics and purple/pink design direction. Its 100 question sets are **newly written starter content**, not recovered originals. Each has an original and three variations, fully available in English and Dutch. The eight other planned languages are intentionally not offered until their UI and question translations are complete.

Play at **https://h4sw5q2wr9-byte.github.io/sneaky-queries/**. The configured production app passed a full round with three independent browser identities and live database access checks. Physical-phone acceptance testing is still listed separately.

## Choose how to play

- **Online party:** create or join a Firebase room, with each player using their own phone. Live room codes, readiness, private questions, synchronized results and host controls remain available.
- **Pass & Play:** tap the shared-phone option on the home screen (or open `?mode=local`). Choose 3–10 players, enter a different name for each, and pick impostors and categories. The single language control in the header sets both the interface and questions. Tap your own name card, explicitly reveal your question, submit once, then pass the phone. Completed cards become grey and disabled. Discussion stays locked until everyone answers. Reveal together, replay, or change the setup.

Both modes use the same original mechanics, 100 bilingual question sets, distinct impostor variations and no-repeat question history. You can try the whole Pass & Play flow alone by entering three names and taking each turn yourself.

Pass & Play uses this browser tab's session storage and requires no Firebase login or room. Once the page has loaded, a local round can finish without a network connection. Loading/reloading the website while offline is not guaranteed. Refresh restores the same assignments and submitted answers to a neutral name-card screen; private selection and drafts are not persisted. Backgrounding the page closes a private question. Closing the tab or clearing its storage can lose the party. Its data is readable to someone inspecting that shared browser's storage; the privacy cover is a turn-taking aid, not encryption or strong anti-cheat protection.

## Run locally

Use Node 22+ and npm. Java 21+ is needed only for emulator tests.

```sh
npm ci
npm run dev
# Optional: copy .env.example to .env.local to override the public defaults.
```

This checkout uses the owner-approved public Firebase web configuration in `src/data/firebase.web.json` by default. Local development connects to that real project unless emulator mode is selected. Environment values can override the five required identifiers for another deployment; blank variables fall back to the public file. The app never simulates multiplayer. To play entirely locally against the real Firebase emulators, set `VITE_USE_EMULATORS=true` in `.env.local`, run `npm run emulators` in one terminal, and `npm run dev` in another. The demo project needs no credentials or billing. Emulator connections use loopback and are for local browser testing, not friends' phones.

## Firebase configuration and setup for another project

**Only have an iPhone?** Use the [Safari-only setup guide](docs/IPHONE_SETUP.md). No PC or desktop plugin is required for the console route.

1. Create a Firebase project at https://console.firebase.google.com. The free **Spark** plan is sufficient for casual play; no Cloud Functions or billing account is required. Do not enable paid services just for this app.
2. In Project settings → General → Your apps, register a **Web app**. Firebase Hosting is not needed. Copy the web `firebaseConfig` values.
3. In Build → Authentication → Get started → Sign-in method, enable **Anonymous**. Under Authentication → Settings → Authorized domains, add `h4sw5q2wr9-byte.github.io`. Add `localhost` explicitly if needed for local development.
4. In Build → Realtime Database, create a database in **locked mode**. Copy its actual URL, including the region if present, for example `https://YOUR-PROJECT-default-rtdb.europe-west1.firebasedatabase.app`. Firestore is not used.
5. On a phone, use the [Copy all security rules page](https://h4sw5q2wr9-byte.github.io/sneaky-queries/firebase-setup.html). Deploy the entire contents of [database.rules.json](database.rules.json) in the Realtime Database → Rules editor and click **Publish**. Never select open/test-mode production rules. Alternatively, authenticate the Firebase CLI with your own account, then run:

   ```sh
   npx firebase login
   npx firebase deploy --only database --project YOUR_FIREBASE_PROJECT_ID
   ```

6. This repository already contains its approved public configuration. For another project, update `src/data/firebase.web.json`, or override all five values in `.env.local` (ignored by Git):

   ```dotenv
   VITE_FIREBASE_API_KEY=your_public_web_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-actual-database-url
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=your-public-web-app-id
   VITE_USE_EMULATORS=false
   VITE_BASE_PATH=/
   ```

7. Restart Vite after changing environment values. Production values are embedded at build time. Check the console's authorized domain and API key restrictions if authentication fails.

Firebase web configuration identifies a public web application; it is not an Admin SDK secret. **Never** add service-account keys, private keys, or Admin credentials to this frontend or repository. Database rules enforce access. Enable budget/quota alerts as appropriate; free service quotas still apply.

## GitHub Pages

Target repository: https://github.com/h4sw5q2wr9-byte/sneaky-queries

1. Push this project's `main` branch to that repository.
2. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The included `src/data/firebase.web.json` supplies this project's public web configuration. To target another project without editing that file, add all five `VITE_FIREBASE_*` values under Settings → Secrets and variables → Actions → **Variables**. Blank variables retain the included defaults.
4. Actions → **Deploy Sneaky Queries to Pages** → Run workflow, or push to `main`. If the first run failed at Configure Pages, enabling the source in step 2 and rerunning fixes that setup dependency.
5. The expected URL is `https://h4sw5q2wr9-byte.github.io/sneaky-queries/`. The actual Actions deployment result is the authority for whether it is live.

The workflow sets `VITE_BASE_PATH=/<repository-name>/` and disables emulators. Invitation links preserve this subpath and use `?room=ABC234`, so direct links and refreshes work without a SPA rewrite. For a user-site repository (`username.github.io`) or a custom domain at its root, change the workflow base to `/`. If both the public file and any overrides are incomplete, the app displays setup instructions. Adding/changing configuration requires a new workflow run. Emulator mode always forces a demo project and loopback endpoints, regardless of the production defaults.

Database rules deploy separately from Pages. Run the security tests before changing rules. `scripts/generate-rules.mjs` is the maintainable rule source; run `node scripts/generate-rules.mjs` after edits and commit both it and the generated JSON.

## Playing

The host chooses room capacity, impostor count (1, 2, 3, or random), and enabled categories in a two-step setup. One header control sets the party language for both the interface and questions. The host can change it in the lobby; all room members follow that choice. Pass & Play uses the same control before dealing or after returning to setup. Language stays fixed during a round. All categories start enabled; at least one stays selected. Impostors must be a minority: 3–4 players allow 1, 5–6 allow up to 2, and 7–10 allow up to 3. Everyone, including the host, joins with a nickname and presses Ready.

Every device receives a private question with exactly the same interface. Nobody is told whether they are an impostor. Normal players receive the original; impostors receive distinct, randomly selected I1/I2/I3 variations. Answers lock on submission. When all remaining players finish, the host client automatically publishes the original question and named answers. Discuss out loud; the host presses Reveal. Then see the impostors and their questions, play again with the same setup, or return to the lobby to change it.

Used question IDs persist in the room. Enabled questions do not repeat until that pool is exhausted, including across setup changes. Each enabled-pool cycle resets only those IDs; other categories retain their history.

## Multiplayer, recovery, and privacy

- Firebase is the source of truth. Ten unique seat claims enforce capacity, even when joins race. Six-character codes are claimed with a create-only write; collisions retry. Rooms expire after 12 hours and cannot be joined, read by members, or mutated after expiry (only public metadata and one's membership lookup remain readable for error handling).
- Firebase Auth uses **browser session persistence**. Refreshing the same tab keeps the identity and party. Separate devices or separate browser contexts have separate identities. Tabs opened by duplicating an authenticated tab can inherit session storage: use separate browser profiles/contexts for testing. Closing the session or clearing storage may lose the identity; the host can remove the old player.
- Each member reads their own assignment and response. Lobby progress contains only round IDs, not answers or roles. Host-only private round state lives under `vault`, outside public subscriptions. Shared discussion/reveal data becomes readable only in its corresponding phase. Broad room/root reads are denied, including to the host.
- Only a member can submit their own one-time answer for the current round. Atomic writes tie submitted status to a real response. Rules limit nickname/answer length and fields. React renders text safely, with no HTML injection. Whitespace is trimmed by the client; rules also reject space-only values.
- The host can remove players from the lobby or from the answer screen's connection panel. Their answers no longer block completion. The host can abort a round back to setup if there are too few players or someone is stuck. No new players join mid-round.
- Presence uses Firebase `onDisconnect` plus a 15-second heartbeat. A member can become host after the old host has been offline for 30 seconds, or its heartbeat is 90 seconds stale. A host that never established presence can be replaced after 90 seconds. The new host inherits coordination privileges and the private vault; the previous host loses controls automatically. A host leaving the party remains as an offline member until the new host removes them. During network loss, writes are disabled in the UI; the Firebase listener restores server state after reconnection. Responses already submitted survive refresh.
- **Casual trust model:** the coordinating host can inspect the private vault in developer tools and can publish manipulated results. Questions are shipped as translatable frontend content, so a determined player can inspect the question catalogue to infer which question is a variation. This is not strong anti-cheat protection. Ordinary clients cannot read another player's assignment or alter host-controlled phases/settings. Strong host-proof secrecy and authoritative randomization require a trusted backend and server-held question catalogue.
- Short codes are invitations, not passwords. An anonymous user who knows a code can join an open lobby. Nicknames need not be unique. Rate limiting, abuse prevention, App Check, and room cleanup services are future production hardening, not claimed V1 features. Expiry revokes gameplay access but does not physically delete records: periodically delete expired `/rooms` nodes with the Firebase console/Admin tooling. Anonymous accounts and room records otherwise remain subject to your Firebase retention policies and quotas.

## Source map

```text
src/App.tsx                 All game screens, live subscriptions and host coordinator
src/styles.css              Purple/pink responsive design, reveal and reduced motion
src/lib/game.ts             Shared assignment, randomness and question history logic
src/lib/local.ts            Pass & Play lifecycle and safe session restoration
src/components/LocalParty.tsx Shared-phone setup, name cards and private turns
src/components/SetupWizard.tsx Shared two-step setup and paged name entry
src/components/RoundViews.tsx Paged discussion answers and impostor reveal
src/components/PlayerRoster.tsx Paged online lobby and host management
src/components/Pager.tsx     Compact, labelled navigation controls
src/lib/rooms.ts             Firebase operations, admission, progress, presence and recovery
src/lib/firebase.ts          Anonymous session identity and Firebase SDK initialization
src/lib/config.ts            Public defaults, environment overrides and demo isolation
src/data/firebase.web.json   Owner-approved public web app configuration
src/lib/types.ts             Shared game and database types
src/lib/i18n.ts              Centralized English/Dutch UI strings and layout direction
src/data/questions.ts        100 sets × 4 questions × 2 complete locales
scripts/generate-rules.mjs   Database rule source
tests/                     Game, rules and independent-browser tests
.github/workflows/          Pages deployment and emulator/browser CI
```

## Adding content and languages

Add a four-part row (`original~I1~I2~I3`) to the appropriate category in **both** locale collections in `src/data/questions.ts`. IDs derive from category and row position, so append rows rather than reordering existing ones. The exported objects follow `{id, category, original, I1, I2, I3}`. I1 is opposite, I2 is shifted/balanced, I3 is different; aim for answers that remain plausibly suspicious. No gameplay changes are needed when adding hundreds of rows. Update the content-count tests when expanding the catalogue.

For a new language, extend `Locale`, add a complete typed UI dictionary and a matching full question catalogue, update the database locale validator and the single header language selector, and add content tests before offering it. `localeDirection()` already returns `rtl` for Arabic; enable it only when Arabic content is complete and test RTL spacing/layout. Currently **only English and Dutch are selectable**.

## Validation

```sh
npm test            # Pure gameplay and bilingual content checks
npm run lint
npm run build
npm run test:rules  # Real Realtime Database rules in the Firebase emulator
npm run test:e2e    # Online and local browser flows, with Firebase emulators
npm run test:passplay # Shared-phone browser flows, no backend or emulator required
```

For browser tests install Chromium with `npx playwright install --with-deps chromium`. On Linux, `/usr/bin/chromium` is used if present. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for a different installed browser. CI installs Playwright Chromium. Unit and emulator tests need no live Firebase credentials. See [docs/TESTING.md](docs/TESTING.md) for actual-phone tests and the recorded verification limits. Build and emulator success do not prove production credentials, Firebase deployment, Safari compatibility, or real cross-device operation.

## Accessibility and scope

Dark mode only, with an ink-purple card-game design, pink actions, card flips, dealt player cards, answer-lock stamps and brief reveal confetti. OS reduced-motion preferences disable movement.

The app uses the available mobile viewport, including software-keyboard resizing. Setup is split into two steps; names, player cards, online rosters and discussion answers use four items per page; impostors reveal one per page. Primary actions stay at the bottom of their screen. Long text, unusually short viewports and keyboard entry can scroll inside a bounded region, rather than creating a long webpage.

Large touch targets, labelled fields, keyboard focus rings, live errors, semantic progress, safe text rendering, and reduced-motion support. The app uses Google Fonts with local system fallbacks. The provided web configuration includes a measurement ID, but the app does not initialize Google Analytics or collect analytics events. No external illustration services. V1 intentionally has no mandatory voting, scores, or leaderboard.

## Telegram completion updates

The notification sender lives in the private repository `h4sw5q2wr9-byte/Telegram-Tijnv50`. Bot credentials stay in that repository's Actions secrets; they are not copied into this project. Authorized assistants can send a completion or blocked-status update with:

```sh
gh workflow run notify.yml --repo h4sw5q2wr9-byte/Telegram-Tijnv50 --ref main -f message='Sneaky Queries: work complete. Details: https://github.com/h4sw5q2wr9-byte/sneaky-queries'
```

Keep messages to a completion signal, one short sentence about the change, and a useful link. Detailed summaries belong in ChatGPT, not duplicated in Telegram. Inspect the sender's Actions run before claiming delivery. Its success means Telegram accepted the message. `AGENTS.md` records the user's preference for completion updates and questions that need their input when an agent works in this repository. Telegram replies are not forwarded into ChatGPT; answers still belong in this chat. This is an assistant-triggered notification, not a universal ChatGPT hook or a cross-repository automatic deployment event. No secret needs to be duplicated in the public game repository.

## Opt-in live multiplayer check

`npm run test:live` runs the online three-identity round test plus six Pass & Play, routing and compact-layout checks against the deployed site, without emulators. It creates real anonymous Firebase accounts and a real room that expires after 12 hours. Override `SQ_LIVE_URL` for another deployment, retaining its trailing slash. TLS verification stays enabled. The test uses the configured HTTPS proxy when present; managed test environments must trust their provided proxy CA in the browser.

`npm run test:live:rules` is an additional opt-in check against the configured production Firebase project. It creates three temporary anonymous identities and its own expiring room, verifies 28 setup/permission/phase checks, then deletes only those test identities. It does not read or mutate other parties. Its room records follow the same 12-hour access expiry and retention policy as normal game rooms. Python 3 is required for this optional standard-library script. Never run live tests against a project you are not authorized to test.
