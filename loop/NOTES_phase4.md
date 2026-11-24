# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing), no input from Isa. Progress counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Round 115: formatRelativeDate and formatLongDate translated (prompt issued). Yesterday is a new key in en, es, fr.
- Next full suite: round 120.
- Row 1 BUILT. Row 2 PARTIAL.
  - 2.1: code done. Simulator check parked (E2E account needs 250+ gym dates, Isa to decide).
  - 2.2 open: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries. TestPG count is 24 (verified).
  - 2.3 string round, one file per round. Done: dateLocale, MyScheduleCard weekday (round 114). Left: formatRelativeDate and formatLongDate (round 115), day letters (summaryCards.ts:45), custom-food 'Save food', ConfidenceBadge text, nutrition kcal label (snapshots regenerated), i18n header comments, shared Xh Ym formatter.
  - 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint state
- Use `npx expo lint`. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG database: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Morning brief free-plan refusal sets isError true (round 100). Revisit in Rows 6 and 7.
- Subscription render test keeps the typed __setPurchasesModule fake (no jest.mock, reset in finally).
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps.
- Prompts touch ONE file each. Max 5 numbered steps. Name every file by full path.
- Every prompt must say: work only on loop/phase4, never switch, push or merge.
- Shared router reset (setup.ts beforeEach) replaces per-test router mockClear. setup.ts must not import expo-router at the top.
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/useApiHarness.ts for 2.1. Do not change api.ts listSessions defaults.
- A required require keeps one reasoned eslint-disable-next-line comment. No new eslint-disable comments in app code.
- analyticsSink.ts:29 keeps its lazy require (accepted 1 warning). Revisit in Row 29.
- i18n alias: `import { use as addPlugin }` is kept.
- cameraMock(getTakePicture, getPermission?) is the shared camera stub. Factory mocks use jest.requireActual with no cast.
- Full suite on checkpoint rounds (120, 135, ...) and after any change that can alter snapshots or strings.
- Locale files rewritten with json.dumps(indent=2, ensure_ascii=False) plus newline.
- A sentence gets one full i18n key. Plurals use _one and _other only.
- Code outside React uses import i18n from '@/lib/i18n'. Dates use dateLocale(i18n.language).
- Row 2.2 closes only when every backend item is done. Do not close it on lint alone.
- Jev risk 1.0 of 2: keep steps small, one file per prompt, check gates each round.
- Loop repeats finished tasks: do not pick work already recorded as done.
- Round 113: stale helpers.test.ts device-locale test deleted (pinned old behaviour).

## Done (condensed)
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days, streakFromApi, stale mocks fixed.
- Rounds 28-43, 88-95: lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history gym session read limited (7-day window).
- Rounds 96-97: schedule_pg progress keeps newest N; 24 of 24 TestPG pass.
- Rounds 98-106: getMorningBrief and getProfile errors surfaced, subscription strings, DailyMacroRing 'of'.
- Rounds 107-111: i18n renders (ring, gym month, workoutsLine, dayReadout), gymMonth monthTitle uses dateLocale.
- Round 112: formatWeekdayDate and formatMonthYear use dateLocale.
- Round 113: stale device-locale helper test deleted. tsc 0 errors.
- Round 114: MyScheduleCard weekday uses dateLocale, fr render test added.
- Checkpoints 44, 60, 75, 76, 90, 104: tsc and Jest green. Last full run: 243 suites, 1,421 tests green.

## Blocked on Isa
- Decide how the E2E account gets 250 or more gym dates. Logged in OWNER_CHECKS_phase4.md. Do not retry until Isa answers.
- Open for Isa (not blocking): should the morning brief free-plan refusal count as an error?

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx restore and seePlans, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Subscription screen es and fr render test.
- Gym tab render test in es and fr for the translated month line.
- Hours and minutes format (Xh Ym) hand built in gymRange.ts and summaryCards.ts.
- Day letters (MTWTFSS) hardcoded in summaryCards.ts:45.
- formatNumber hardcoded en-AU. formatStreak ('day'/'days') and formatDuration ('min') English only.

## Next
- Round 115: formatting.ts formatRelativeDate and formatLongDate, Yesterday key in en, es, fr, full Jest run.
- Then day letters, custom-food 'Save food', ConfidenceBadge text, nutrition kcal label (snapshots regenerated), one per round.
- Then 2.2 backend items and the rest of 2.2.
- Then 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c, 2d, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
- React act warnings from ScanReviewCard and devWarn from src/lib/data/hooks.ts:72. Look at them in Row 22.
- react-test-renderer is deprecated and warns in hook tests. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Revisit in Row 22.
- Plain npx eslint at repo root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Decide in Row 29.
- KNOWN_ISSUES.md 'Phase 4 (out of scope)' section clashes with the header. Backend section still has Phase 3 wording. Fix in the docs round.
- If a render test adds jest.resetModules, the shared unmountAll misses trees created after the reset.
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint does not exist).
- The history test hardcodes isoDaysAgo(6) because DAYS isn't exported.
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- Restore fake store in the busy test: keep the typed fake for now.
- formatting.ts:67 and :72 use device locale (check in round after 115).
- Tool note: the lint gate is npx expo lint.