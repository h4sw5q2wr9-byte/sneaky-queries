# Validation and phone test plan

## Latest release: native app direction

The [Pages deployment for `ff274f3`](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41724174467) and [GitHub CI](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41724174379) succeeded. CI passed lint, production compilation, 20 unit tests, 12 security-rule tests and eight combined browser tests.

All seven live-site browser checks passed in 58 seconds: three independent Firebase identities completing synchronized rounds/reconnect/replay/reset; private shared-phone/offline/recovery play with zero Firebase backend requests; Dutch with seven players and three distinct impostor variations; invitation routing; and ten-player layouts at 320 × 568, 375 × 667 and 390 × 844, including reduced motion and a simulated keyboard viewport. The live check also fetched the manifest and PNG icons, verifying standalone display metadata and that the launch URL stays within the repository subpath. These checks do not verify actual iPhone installation, Safari rendering or physical-device keyboard behavior.

## Previous release: compact mobile redesign

The [Pages deployment for `e193eb4`](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41709238414) succeeded. Its [GitHub Actions checks](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41709238528) passed lint, production compilation, 20 unit tests, 12 security-rule tests and all eight browser tests.

All **seven live-site browser checks passed** against that deployed version: a synchronized Firebase round with three distinct anonymous identities, refresh/reconnection/replay/reset and shared language; shared-phone private/offline/recovery play with zero Firebase backend requests; seven-player Dutch play with three unique impostor variations; invitation/local routing; and ten-player layouts at 320 × 568, 375 × 667 (Dutch), and 390 × 844. Compact-layout checks include reduced motion, primary-action visibility, document/horizontal overflow and a simulated open-keyboard viewport. Physical iPhone Safari and Android Chrome testing remains unverified.

## Recorded checks (2026-11-03)

Production compilation and ESLint passed. Eleven unit tests (six gameplay/content and five configuration/isolation tests), twelve database-rule tests, and two independent-browser emulator tests passed in the [GitHub Actions checks for the configured release](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41673313008).

The [production Pages deployment](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41673312906) for commit `5ad2547` succeeded. The published HTTPS app then passed the live round test against the owner's actual Firebase project using **three isolated Chromium contexts with three distinct anonymous identities**, at a 390 × 844 mobile viewport. The live run took 25.4 seconds and covered join links, lobby readiness, private questions, answer submission, synchronized discussion/reveal, refresh, reconnection, replay, setup reset and a switch to Dutch questions. It reported no page JavaScript errors or horizontal overflow.

A separate opt-in REST smoke test passed **28 live setup, authorization and phase checks** against a room it created. These included reading one's own assignment, rejecting peer assignment/vault reads, blocking early discussion/reveal reads, rejecting forged or duplicate answers and ordinary phase advances, publishing discussion/reveal only under host control, and hiding old discussion again after reset. The script did not touch another room and deleted only its three temporary test identities. It did not retrieve administrative credentials or print authentication tokens.

Two emulator browser tests additionally passed at 390 × 844 and 360 × 780 mobile viewports. That browser test created a party, joined via invitation links, synchronized a three-person lobby, readied/started, refreshed a private assignment, submitted three answers, synchronized discussion and reveal, replayed, toggled a player's network offline/online, submitted after reconnecting, reset the lobby, and changed the question language to Dutch. It checked for page JavaScript errors and horizontal overflow. A second test disconnected the host, waited for the real presence grace period, took over as host, removed the offline host, completed the two-player remainder of the round, reset, admitted a fourth independent client into the freed seat, started another round, and verified that the removed host lost access on reconnect. Screenshots were inspected for the welcome and reveal layouts.

The initial pushed implementation also passed the [GitHub Actions multiplayer/security workflow](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41657320436). Final local checks include the additional seat/start-race rules and host-recovery browser test. GitHub Pages deployment initially failed at Configure Pages because Pages was not enabled. An attempt to enable it through the GitHub integration returned HTTP 403; a repository owner must enable Pages with GitHub Actions as the source.

Rule tests cover unauthenticated/broad reads, concurrent seat capacity, host settings and nickname restrictions, active/expired room admission, own-assignment privacy, vault secrecy, hidden results, duplicate/forged/overlong/stale responses, progress integrity, phase changes, replay/reset, fresh-identity-context reads, removed-player access, and delayed host takeover/vault ownership, missing host presence, start/admission races, and atomic seat/membership removal. Expected `permission_denied` warnings are successful negative cases.

**Still unverified:** physical phones, actual iOS Safari/Android Chrome, and production load or free-quota limits beyond these small tests. Host takeover/removal was verified with emulator browsers; the live browser smoke covered the main three-player round and reconnect flow. Browser viewport emulation is not a physical-phone test. Run the checklist below for actual devices.

## Reproduce

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:rules
npx playwright install --with-deps chromium
npm run test:e2e
# Opt-in, real production data only in a test room:
npm run test:live
npm run test:live:rules
```

Use Java 21+ for the Database emulator. Do not run both emulator test scripts simultaneously: they use the same ports. Stop a manually running emulator first. Rules tests have a loopback-only WebSocket shim because the Node Firebase SDK ignores `NO_PROXY`; all external proxy settings remain intact. `FIREBASE_EMULATORS_PATH` can point at a writable cache directory if the default cache is unavailable.

## Actual-phone acceptance checklist

Use at least three **different phones or isolated browser profiles**. Do not use three tabs sharing an anonymous identity. At minimum use an iPhone with Safari and an Android with Chrome. Open the deployed HTTPS Pages URL after adding its host to Firebase Authentication authorized domains.

1. **Create and invitation:** Host creates with a nickname and capacity 3; verify all ten categories start enabled. Copy/share invite to two phones. Join using link and manually typed lowercase code. Confirm named players appear everywhere. A fourth distinct client gets a full-room message; a wrong code gets an invalid-code message.
2. **Setup guards:** Try 3 players with 2 impostors: start must remain unavailable. Use 1 or Random. Try deselecting every category: one stays selected. Use the single header language control to select Dutch; guests must follow the host, both UI and questions must change, and only English/Dutch should be offered. The control locks during a round.
3. **Ready and privileges:** Start waits for 3 ready, connected players. Non-hosts have no settings/start/reveal controls. Verify names with punctuation and emoji render as plain text. Duplicate nicknames must not merge identities.
4. **Private delivery:** Start. Inspect each phone privately: same layout, no role/variant indication. Compare only after the round; two questions should match and one should differ. Enter answers with emoji and punctuation. Check 160-character input limit and lock-on-submit. No player can see others' answers yet. Submitted counts synchronize.
5. **Refresh:** Refresh an unanswered phone: it must receive the same question. Submit, then refresh again: it must remain waiting and must not submit a second answer.
6. **Discussion/reveal:** Submit the last answer. Every phone moves to discussion, shows the same original question and all named answers. Discuss in person. Only the host can reveal. Every phone then shows the same impostor and their actual assigned question. No scoring or voting should intervene.
7. **Replay/setup:** Play Again: same room, players, settings, fresh question. Change Setup: all phones return to the lobby. Change category/language and play again. Exhaust a single category's ten questions and verify none repeats before all ten are used.
8. **Multiple impostors:** With five independent players, select 2; with seven select 3. Reveal must show different I1/I2/I3 variations for each impostor. The normal players share exactly one original question.
9. **Player network loss:** Toggle airplane mode on an unanswered phone. Other phones continue waiting with progress. Restore its connection: same identity/assignment, submit and finish. Repeat after submission. Host can remove a disconnected player under Players & connection; that player must stop blocking completion. Removed player's reads and submissions must fail.
10. **Host recovery:** Disconnect host for 30+ seconds. Another member takes over when the button enables. Verify the returning host loses controls, the new host can finish/reveal/reset, and the old host can still play. Test closing the host before its presence initializes (takeover after 90 seconds) and stale heartbeat takeover after 90 seconds.
11. **Leaving and low count:** Leave mid-answer as non-host. Remaining host either finishes when all remaining answers exist or returns to setup. Leave as host, let a new host take over, then remove the old host before replaying. Rejoin is allowed only in lobby.
12. **Expiry:** In a test Firebase project, use the console to move a room's expiry into the past. Existing clients get the expiry screen; fresh joins get an expired-room error. Never relax security rules to perform this check.
13. **Mobile/accessibility:** Test at 320 px and wide desktop widths, portrait/landscape, Safari safe areas, keyboard opening, long names/answers, browser zoom, keyboard navigation, focus visibility, screen-reader labels/errors/progress, and the OS reduced-motion preference. Reveal must not trap users behind animation.
14. **Subpath/deep links:** Open `/sneaky-queries/?room=CODE` directly on a fresh phone; refresh in each phase. Confirm assets load from `/sneaky-queries/`, not `/assets/`. Verify HTTPS clipboard/share fallback.

Record device/OS/browser versions, date, Firebase project, deployed commit, pass/fail, and any console errors before claiming cross-device production verification.

## Live deployment follow-up

GitHub Pages was enabled with GitHub Actions as the source. The [Pages deployment workflow](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41662203992) succeeded and the published `/sneaky-queries/` app loaded over HTTPS. The latest implementation also passed [the full GitHub Actions checks](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41658405940).

Earlier live attempts stopped at the explicit setup screen because Firebase configuration had not been supplied. The owner then completed project, anonymous-auth, database, rules and web-app setup from iPhone Safari and shared the public web configuration. The successful production checks recorded above supersede that initial setup blocker. The desktop Firebase plugin was not required.

The initial direct Telegram workflow was replaced with a sender in the user's private notification repository. Six sender tests passed with mocked network calls. The real [setup-message workflow](https://github.com/h4sw5q2wr9-byte/Telegram-Tijnv50/actions/runs/41666985782) completed successfully and Telegram confirmed message delivery on 2026-11-03. Credentials were not read back, copied, or printed.


## Pass & Play acceptance

The shared-phone mode reuses the same question/assignment logic and keeps online Firebase rooms separate. Seven additional unit tests cover valid/unique names, distinct three-impostor variations, one-time answers, phase gates, replay/reset history, canonical restoration after refresh, corrupted saved data, and complete Dutch questions.

Browser checks cover a three-person shared-phone round, explicit reveal covers, hiding questions and drafts after refresh/background events, grey disabled completed cards, saved-answer recovery, discussion/reveal, replay, cancel/reset, and completing a loaded round with the network disconnected. A seven-player case verifies three distinct impostor questions, Dutch UI/content, long names at 320 px and impostor clamping when reducing the player count. A routing case verifies that switching from an invitation to Pass & Play keeps the local route after refresh, even when an older online room is remembered. The first shared-phone test also verifies that no Firebase backend requests were made.

For actual phones, additionally check:

1. Enter 3–10 unique names, including long names, and select categories/impostors. At least one category stays enabled; impostors stay a minority.
2. Pass the phone in any order. Only tap your own card. The cover must show the name before a deliberate question reveal, with the same private layout for every player.
3. Lock an answer. No question or answer should remain on the handoff screen; the completed name card must be grey and disabled. Continue stays disabled until all have answered.
4. Background and reopen the phone during a private question. Repeat with refresh. The name-card screen should return, preserving completed answers and assignments; an unsubmitted draft is intentionally cleared.
5. Compare named answers, reveal all impostors and their actual questions, replay without immediate question repeats, and change setup while retaining names/history. New players can clear the local party with confirmation.
6. Once the page is loaded, disconnect the network and finish a round. Do not expect a brand-new page load or offline refresh to work without a cached website.
7. Return to the home screen and create/join an online party. Local state must not join a Firebase room or alter another online player.

Physical iPhone Safari / Android Chrome testing remains separate from Chromium viewport tests.

Pass & Play implementation checks: build and lint passed; all 20 unit tests passed. The combined browser suite passed all five tests (two online, three shared-phone/routing cases). The standalone shared-phone suite was rerun after the final route/ID validation changes. Live-site verification is recorded after deployment.

Two Firebase lifecycle unit tests now verify that importing the app does not initialize Auth or Database and that online play initializes each service once. This guards the background initialization found in the first production Pass & Play network check. The five-test browser suite passed again after deferring those services.


### Published Pass & Play verification — 2026-11-03

The [deployment for `f42b3a8`](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41680225117) completed successfully. All **four live-site browser checks passed** in 52 seconds against the published site: the existing three-identity Firebase round/reconnect/replay test, the shared-phone private-turn/offline/recovery lifecycle, the seven-player three-impostor/Dutch/narrow-screen case, and the invitation/remembered-room routing case. The shared-phone network assertion observed **zero Firebase backend requests**. The [release CI run](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41680225132) covers the 20 unit tests, 12 rules tests and five combined browser tests.

The first production-only network assertion caught eager Firebase initialization on the mobile profile; Auth/Database creation was deferred to online operations and guarded with two lifecycle unit tests. The production test then passed. No physical iPhone Safari or Android Chrome was operated by the assistant, and shared-phone data remains protected by the turn-taking UI and the shared browser's normal storage trust model.

Open shared-phone play directly at https://h4sw5q2wr9-byte.github.io/sneaky-queries/?mode=local . For a solo functional try-out, enter three names and take each private turn yourself.

## Compact mobile redesign acceptance — 2026-11-03

The redesign adds a single party-language control, two-step setup, paged large groups/results, short card/reveal animations and a layout that responds to the visual viewport. Normal-height screens aim to fit without page scrolling. Long answers, large accessibility text and software keyboards may need bounded internal scrolling; question and answer text remains readable inside bounded regions.

Additional actual-phone checks:

1. At 3 and 10 players, complete both setup steps. Check all names/categories remain reachable and the next/start button stays visible. Navigate all player-card pages.
2. Open and dismiss the iPhone/Android software keyboard on the last name and on a private answer. The current field and primary action must remain reachable. Check Safari with browser bars expanded/collapsed and on devices with home indicators.
3. Complete a ten-player round with maximum-length names/answers. Page through every named answer and all three impostors. Long text must be readable inside its region, with Reveal/Replay still reachable.
4. Use Dutch, then start a round. There must be one language selector. Online guests follow the host; a dealt round cannot switch language. Return to setup to change it.
5. Watch the card deal, private reveal, locked answer, handoff, discussion and final reveal. Animations must be brief and must not delay actions. Turn on Reduce Motion and repeat.
6. Open host controls, remove a disconnected player and reset a round on a short screen. Check dialog focus and controls with VoiceOver and an external keyboard.

Automated viewport checks include 320 × 568, 375 × 667 (Dutch), and 390 × 844 with ten players, full document/horizontal scroll assertions, no clipped primary actions, reduced motion and a simulated 340 px keyboard viewport. These are Chromium emulation checks, not actual iOS keyboard or physical-device verification.

Local redesign checks: ESLint, production build and all 20 unit tests passed. All eight combined emulator/browser tests passed, including host recovery, the shared-phone lifecycle, the single language choice and three compact ten-player layouts. The three-identity online test checks primary-action visibility and page overflow at 320 × 568, 375 × 667 and 390 × 844 through private questions, discussion and reveal. Finite card animations settle before layout measurements. The published redesign verification is recorded at the top of this document.

## Native app direction acceptance

The native-style UI rework preserves the same gameplay and Firebase rules. Check both play modes, all four lobby/player pages where applicable, long named answers and all impostor pages. Inspect compact bars and bottom actions at 320 × 568, 375 × 667 and 390 × 844; repeat with software keyboards and Reduce Motion enabled.

On an actual iPhone, use Safari → Share → Add to Home Screen. Confirm the custom icon and standalone launch, safe areas around the status bar/home indicator, and keyboard opening/dismissal on name and answer fields. Close and relaunch the web app online. Session storage behavior can differ across Safari tabs and standalone launches: do not assume an existing party transfers between them. No offline-launch support or physical iPhone verification is claimed.

Native-style implementation checks: build, lint and 20 unit tests passed; all eight combined emulator/browser tests passed. The final six shared-phone checks passed again after the compact-bar adjustments, including the manifest's subpath-safe start URL and successful PNG launcher/touch-icon loading. Production verification is recorded at the top of this document.
