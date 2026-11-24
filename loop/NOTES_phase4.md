# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Round 104 checkpoint passed: tsc 0 errors, Jest 243 suites and 1,413 tests green.
- Row 1 BUILT. Row 2 PARTIAL.
  - 2.1 gym days: code done, simulator check parked.
  - 2.2 open: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
  - 2.3 string round, one screen or component per round. Part 1 (round 105) subscription.tsx: DONE. Part 2 (round 106): DailyMacroRing.tsx 'of' via nutrition.ringOf, in progress. Later: Row 13 and 14 items, i18n header comments.
  - 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint state
- Use `npx expo lint`. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG database: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- TestPG count is 24 (verified round 97). A handover saying 21 or 22 is stale.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Morning brief free-plan refusal sets isError true (decided round 100, keep). Revisit in Rows 6 and 7.
- Subscription render test keeps the typed __setPurchasesModule fake (no jest.mock, reset in finally).
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps.
- Prompts touch ONE screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Shared router reset (setup.ts beforeEach) replaces per-test router mockClear.
- setup.ts must not import expo-router at the top (breaks 18 suites that mock it).
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1. Do not change api.ts listSessions defaults.
- A required require keeps one reasoned eslint-disable-next-line comment. No new eslint-disable comments in app code.
- analyticsSink.ts:29 keeps its lazy require (accepted 1 warning). Revisit in Row 29.
- i18n alias: `import { use as addPlugin }` is kept.
- cameraMock(getTakePicture, getPermission?) is the shared camera stub. Factory mocks use jest.requireActual with no cast.
- Full suite on checkpoint rounds (120, 135, ...).
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). No seed or insert without an approved path.
- String changes wait for the string round (2.3), done in parts.
- Every round runs tsc and targeted Jest for changed files and reports results. Docs-only rounds run tsc and a grep.
- Row 2.2 closes only when every backend item is done. Do not close it on lint alone.
- zsh: quote glob patterns. Node 22 first on PATH. Count errors with grep.
- Jev risk 1.0 of 2: keep steps small, one file per prompt, check gates each round.
- Loop repeats finished tasks: do not pick work already recorded as done.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Rounds 28-43, 88-95: lint fixes. Lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history.tsx gym session read limited (7-day window).
- Round 96: schedule_pg.go GetExerciseProgress keeps newest N, returns oldest first.
- Round 97: 24 of 24 TestPG pass on localhost lume_test_local, 0 skipped.
- Round 98: doc-only TestPG count fix (24).
- Round 99: getMorningBrief and getProfile no longer swallow errors.
- Round 100: aiBrain.briefProfile.test.ts (7 tests).
- Round 101: KNOWN_ISSUES.md docs fixed.
- Round 102: subscription manage failure toast and busy state.
- Round 103: restore busy spinner passed to Button; subscription render test (6 tests).
- Round 104: checkpoint, tsc 0, Jest 243 suites and 1,413 tests.
- Round 105: subscription.tsx 22 strings to t(); subscription.* group (13 keys) in en, es, fr. tsc 0, Jest green.
- Checkpoints 44, 60, 75, 76, 90: tsc and Jest green.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates. Logged in OWNER_CHECKS_phase4.md. Do not retry until Isa answers.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx restore and seePlans, profile/index.tsx).
- delete-account.tsx swallowed-errors review.

## Next
- Round 106: 2.3 string part 2 (DailyMacroRing.tsx 'of' via nutrition.ringOf; prompt sent, result pending).
- Then Row 13 and 14 strings one screen per round (gymRange, summaryCards workoutsLine, custom-food 'Save food', ConfidenceBadge text, nutrition kcal label), with snapshots regenerated.
- Then 2.2: feature_used allowlist; app_version vs build number; export as .json file; one exportData; useWeeklyMacros refetch test; npm audit safe fix; 49 WHERE id::text queries.
- Then 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- React act warnings from ScanReviewCard and devWarn from src/lib/data/hooks.ts:72 in render logs. src/lib/data is off limits for now. Look at them in Row 22.
- react-test-renderer is deprecated and warns in hook tests. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Revisit in Row 22.
- Plain npx eslint at repo root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Not a gate. Decide in Row 29.
- KNOWN_ISSUES.md 'Phase 4 (out of scope)' section clashes with the header. Fix in the docs round.
- If a render test adds jest.resetModules, the shared unmountAll misses trees created after the reset.
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint does not exist).
- The history test hardcodes isoDaysAgo(6) because DAYS isn't exported.
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- No app-wide en/es/fr key parity test yet (Row 29). No test renders the subscription screen in es or fr.
- Restore fake store in the busy test: keep the typed fake for now.