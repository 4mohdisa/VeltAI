# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Round 108 checkpoint passed (1,417 tests). Round 109 passed (243 suites, 1,419 tests, 4 of 4 snapshots). Next full suite: round 120.
- Row 1 BUILT. Row 2 PARTIAL.
  - 2.1: code done. Simulator check parked (E2E account needs 250+ gym dates, Isa to decide).
  - 2.2 open: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries, TestPG count to 22 after the schedule_pg test runs.
  - 2.3 string round, one file per round. Done: subscription.tsx, DailyMacroRing 'of', ring es and fr tests, gymRange (108), summaryCards workoutsLine (109). Round 110: dayReadout in summaryCards.ts. Then custom-food 'Save food', ConfidenceBadge text, nutrition kcal label, i18n header comments.
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
- String changes wait for the string round (2.3), done in parts.
- Every round runs tsc and targeted Jest for changed files and reports results. Docs-only rounds run tsc and a grep.
- Row 2.2 closes only when every backend item is done. Do not close it on lint alone.
- zsh: quote glob patterns. Node 22 first on PATH. Count errors with grep.
- Jev risk 1.0 of 2: keep steps small, one file per prompt, check gates each round.
- Loop repeats finished tasks: do not pick work already recorded as done.

## Done
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days on backend and app, streakFromApi takes only row, stale mocks fixed.
- Rounds 28-43, 88-95: lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history.tsx gym session read limited (7-day window).
- Round 96: schedule_pg.go GetExerciseProgress keeps newest N, returns oldest first.
- Round 97: 24 of 24 TestPG pass on localhost lume_test_local, 0 skipped.
- Rounds 98-103: doc fix, getMorningBrief and getProfile errors surfaced, briefProfile tests, KNOWN_ISSUES fixes, subscription manage toast and busy state, restore spinner, subscription render test.
- Round 105: subscription.tsx strings to t(); subscription.* keys in en, es, fr.
- Round 106: DailyMacroRing 'of' via nutrition.ringOf (en of, es de, fr sur).
- Round 107: dailyMacroRing.i18n.render.test.tsx covers es and fr.
- Round 108: gymRange month line and monthTitle use app language (gym.monthSessions, monthUntimed, monthFreezes).
- Round 109: summaryCards workoutsLine uses i18n (workoutsWeek.noSessions, untimed_one, untimed_other), es and fr tests.
- Checkpoints 44, 60, 75, 76, 90, 104: tsc and Jest green.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates. Logged in OWNER_CHECKS_phase4.md. Do not retry until Isa answers.
- New TestPG (schedule_pg progress, TestPG_ExerciseProgressLimitKeepsNewest) has never run: needs LUME_TEST_DATABASE_URL on localhost lume_test_local. Run it in the next round that can, then drop the progress bug from KNOWN_ISSUES.md.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx restore and seePlans, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Subscription screen es and fr render test.
- Gym tab render test in es and fr for the translated month line.
- Hours and minutes format (Xh Ym) hand built in gymRange.ts:200 and summaryCards.ts. One shared formatter.
- formatting.ts:67,72 date formatting uses device language. Fix with the app language.
- Day letters (MTWTFSS) hardcoded in summaryCards.ts:45.

## Next
- Round 110: dayReadout in summaryCards.ts (weekday locale, in, burned, net), es and fr.
- Then custom-food 'Save food', ConfidenceBadge text, nutrition kcal label (snapshots regenerated), one per round.
- Then 2.2 backend items and the rest of 2.2.
- Then 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c, 2d, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
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
- Restore fake store in the busy test: keep the typed fake for now.
- summaryCards.ts:35, formatting.ts:67,72 pass undefined locale to toLocaleDateString (see Parked).
- delete-account.tsx swallowed errors not checked yet.
- Tool note: the lint gate is npx expo lint. The Round 109 report says 0 problems on the two changed files.