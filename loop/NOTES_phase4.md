# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Round 101: docs fix for KNOWN_ISSUES.md:41 (stale getMorningBrief and getProfile error claim).
- Row 1 BUILT. Row 2 PARTIAL.
  - 2.1 gym days: code done, simulator check parked.
  - 2.2 open: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
  - 2.2 done: lint sweep, schedule_pg LIMIT fix, getMorningBrief and getProfile errors (round 99), hook isError tests (round 100).
  - 2.3 Row 13 and 14 items. 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint state
- Use `npx expo lint`. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG database: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- TestPG count is 24 (verified round 97). Historical lines 21 and 31 stay as recorded. A later handover saying 'never run, 21 to 22' is stale: do not act on it.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Free-plan 403 on morning brief sets isError true (round 100 decision, Isa's question decided here). Revisit with entitlement state in Rows 6 and 7.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps. Big visual ideas go to OWNER_CHECKS_phase4.md as post launch UI items.
- Rows 2c and 2d are extra rows, BUILT only after their tests pass.
- Prompts touch one screen, component or file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Shared router reset (setup.ts beforeEach) replaces per-test router mockClear.
- setup.ts must not import expo-router at the top (breaks 18 suites that mock it).
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1. Do not change api.ts listSessions defaults.
- A required require keeps one reasoned eslint-disable-next-line comment. No new eslint-disable comments in app code.
- analyticsSink.ts:29 keeps its lazy require (accepted 1 warning). Revisit in Row 29.
- i18n alias: `import { use as addPlugin }` is kept.
- Full suite on checkpoint rounds (105, 120, ...).
- 2.1 simulator check stays parked (E2E account needs 250 or more gym dates). No seed or insert without an approved path.
- String changes wait for a string round (2.3).
- Every round runs tsc and targeted Jest for changed files and reports results. Docs-only rounds run tsc and a grep.
- A round that changes nothing still runs the gates and reports the exact output.
- Row 2.2 closes only when every backend item is done. Do not close it on lint alone.
- zsh: quote glob patterns. Node 22 first on PATH. Count errors with grep.
- Jev risk 1.2 of 2: keep steps small, check gates each round.
- Loop repeats finished tasks: do not pick work already recorded as done.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Rounds 28-43, 88-95: lint fixes. Lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history.tsx gym session read limited (7-day window).
- Round 96: schedule_pg.go GetExerciseProgress keeps newest N, returns oldest first.
- Round 97: 24 of 24 TestPG pass on localhost lume_test_local, 0 skipped.
- Round 98: doc-only TestPG count fix (24).
- Round 99: getMorningBrief and getProfile no longer swallow errors (api.ts, aiBrain.ts isError, http_test.go TestBriefAndBrainReadErrors).
- Round 100: aiBrain.briefProfile.test.ts (7 tests, 3 suites pass).
- Checkpoints 44, 60, 75, 76, 90: tsc and Jest green (242 suites, 1,402 tests).

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates. Logged in OWNER_CHECKS_phase4.md.

## Parked
- Row 2.1 simulator check of the Total tile.

## Next
- Round 101: KNOWN_ISSUES.md:41 docs fix (docs only).
- Then 2.2: feature_used allowlist; app_version vs build number; export as .json file; one exportData; useWeeklyMacros refetch test; npm audit safe fix; 49 WHERE id::text queries.
- Then 2.3 (translations and Retry, i18n header comments, DailyMacroRing.tsx:96 'of' to nutrition.ringOf), 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c and 2d owner rows, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- React act warnings from ScanReviewCard and devWarn from src/lib/data/hooks.ts:72 in render logs. Look at them in Row 22.
- react-test-renderer is deprecated and warns in every hook test using the shared harness. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed (no side effect to watch). Revisit in Row 22.
- Plain npx eslint at repo root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- i18n index.ts header comments are out of date (Row 2.3).
- The history test hardcodes isoDaysAgo(6) because DAYS isn't exported.
- Prettier has no repo config. Not a gate. Decide in Row 29.
- 'Phase 4 (out of scope)' section header in KNOWN_ISSUES.md clashes with the file's Phase 4 header.
- If a render test adds jest.resetModules, the shared unmountAll misses trees created after the reset.
- Nothing tests refetch in useWeeklyMacros.
- DailyMacroRing.tsx:96 shows 'of' in English only; nutrition.ringOf exists.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint does not exist).