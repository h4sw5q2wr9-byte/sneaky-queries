# Validation and phone test plan

## Recorded checks (2026-11-03)

Local production compilation succeeded using Node 24, TypeScript and Vite. ESLint passed. Six gameplay/content tests and twelve Firebase Realtime Database security-rule tests passed. Two Playwright tests passed against real local Auth and Database emulators using **three isolated Chromium contexts with three distinct anonymous identities**, at 390 × 844 and 360 × 780 mobile viewports.

That browser test created a party, joined via invitation links, synchronized a three-person lobby, readied/started, refreshed a private assignment, submitted three answers, synchronized discussion and reveal, replayed, toggled a player's network offline/online, submitted after reconnecting, reset the lobby, and changed the question language to Dutch. It checked for page JavaScript errors and horizontal overflow. A second test disconnected the host, waited for the real presence grace period, took over as host, removed the offline host, completed the two-player remainder of the round, reset, admitted a fourth independent client into the freed seat, started another round, and verified that the removed host lost access on reconnect. Screenshots were inspected for the welcome and reveal layouts.

The initial pushed implementation also passed the [GitHub Actions multiplayer/security workflow](https://github.com/h4sw5q2wr9-byte/sneaky-queries/actions/runs/41657320436). Final local checks include the additional seat/start-race rules and host-recovery browser test. GitHub Pages deployment initially failed at Configure Pages because Pages was not enabled. An attempt to enable it through the GitHub integration returned HTTP 403; a repository owner must enable Pages with GitHub Actions as the source.

Rule tests cover unauthenticated/broad reads, concurrent seat capacity, host settings and nickname restrictions, active/expired room admission, own-assignment privacy, vault secrecy, hidden results, duplicate/forged/overlong/stale responses, progress integrity, phase changes, replay/reset, fresh-identity-context reads, removed-player access, and delayed host takeover/vault ownership, missing host presence, start/admission races, and atomic seat/membership removal. Expected `permission_denied` warnings are successful negative cases.

**Not verified by these checks:** physical phones, actual iOS Safari or Android Chrome, live Firebase quota/configuration, production security-rule deployment, or a successful GitHub Pages deployment. A local Chromium context is not a physical phone and the emulator is not the live Firebase service. Run the checklist below once configured.

## Reproduce

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:rules
npx playwright install --with-deps chromium
npm run test:e2e
```

Use Java 21+ for the Database emulator. Do not run both emulator test scripts simultaneously: they use the same ports. Stop a manually running emulator first. Rules tests have a loopback-only WebSocket shim because the Node Firebase SDK ignores `NO_PROXY`; all external proxy settings remain intact. `FIREBASE_EMULATORS_PATH` can point at a writable cache directory if the default cache is unavailable.

## Actual-phone acceptance checklist

Use at least three **different phones or isolated browser profiles**. Do not use three tabs sharing an anonymous identity. At minimum use an iPhone with Safari and an Android with Chrome. Open the deployed HTTPS Pages URL after adding its host to Firebase Authentication authorized domains.

1. **Create and invitation:** Host creates with a nickname and capacity 3; verify all ten categories start enabled. Copy/share invite to two phones. Join using link and manually typed lowercase code. Confirm named players appear everywhere. A fourth distinct client gets a full-room message; a wrong code gets an invalid-code message.
2. **Setup guards:** Try 3 players with 2 impostors: start must remain unavailable. Use 1 or Random. Try deselecting every category: one stays selected. Change question language to Dutch; only English/Dutch should be offered.
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
