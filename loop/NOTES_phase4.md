# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing) with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main. Never switch, push or merge.
- Repo root: /Users/mohammedisa/Development/projects-app/LumeAI.
- Row 1 BUILT. Row 2 PARTIAL.
- 2.1: code done. Simulator check parked in OWNER_CHECKS_phase4.md.
- 2.2: backend items done except: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries. TestPG 24 of 24.
- 2.3 string round, left in order: WeekEnergyCard letters (round 125, in progress); custom-food 'Save food'; ConfidenceBadge text; nutrition kcal label (snapshots regenerated); i18n header comments.
- 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint
- Use `npx expo lint`. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG database: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Morning brief free-plan refusal sets isError true (round 100). Revisit in Rows 6 and 7.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin for references, log in DESIGN_REFERENCES.md, never copy real apps.
- Prompts touch ONE main file each (locale JSON counts as data; one pinned test assertion may be a second file, recorded in the report). Max 5 numbered steps. Name every file by full path.
- Shared router reset (setup.ts beforeEach). setup.ts must not import expo-router at the top.
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts for 2.1. Do not change api.ts listSessions defaults.
- A required require keeps one reasoned eslint-disable-next-line comment. No new eslint-disable comments in app code.
- analyticsSink.ts:29 keeps its lazy require (accepted 1 warning). Revisit in Row 29.
- i18n alias: `import { use as addPlugin }` is kept.
- cameraMock(getTakePicture, getPermission?) is the shared camera stub. Factory mocks use jest.requireActual with no cast.
- Full suite on checkpoint rounds and after any change that can alter snapshots or strings.
- Locale files rewritten with json.dumps(indent=2, ensure_ascii=False) plus newline.
- A sentence gets one full i18n key. Plurals use _one and _other only.
- Code outside React uses import i18n from '@/lib/i18n'. Dates use dateLocale(i18n.language).
- Round 113: stale device-locale helper test deleted (pinned old behaviour).
- Round 115: 'Sept' (en-AU short month) kept. Isa to confirm in OWNER_CHECKS_phase4.md.
- Round 116: es and fr durations use locale style. Low priority style note in OWNER_CHECKS_phase4.md.
- Round 118: month summary keeps design shape '0h 45m' in English (pinned by gymMonth.test.ts).
- Round 120-122: es and fr month summary and weekly card use common.hoursMinutes native spacing ('1 h 45 min'). Chosen without asking.
- Round 119: 8 console.error lines in the Jest run are not failures. Tracked for Row 22.
- Round 123: formatDuration rounds total minutes first (119.6 gives '2h').
- Round 124: day letters in summaryCards use calendar.weekdayLetters (Monday first), not Intl. Hermes ignores weekday narrow.
- Round 125: WeekEnergyCard letters chosen next (translated key, Monday first mapping).

## Done (condensed)
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days, streakFromApi, stale mocks fixed.
- Rounds 28-43, 88-95: lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history gym session read limited (7-day window).
- Rounds 96-97: schedule_pg progress keeps newest N; 24 of 24 TestPG pass.
- Rounds 98-106: getMorningBrief and getProfile errors surfaced, subscription strings, DailyMacroRing 'of'.
- Rounds 107-124: i18n renders, monthTitle and dates use dateLocale, formatStreak, formatDuration, formatHoursMinutes, workoutsLine, summaryCards day letters.
- Checkpoints 44, 60, 75, 76, 90, 104, 118, 121, 122: tsc and Jest green. Round 123: tsc 0 errors, Jest 243 suites and 1,450 tests green.

## Blocked on Isa (not blocking the loop)
- E2E account needs 250+ gym dates. Logged in OWNER_CHECKS_phase4.md.
- Should the morning brief free-plan refusal count as an error?
- Confirm 'Sept' in English.
- Confirm es and fr hours and minutes spacing ('1 h 45 min' vs '1h 45m'). Raised in rounds 122 and 124 (same blocker twice): do not retry, work on other surfaces until Isa answers.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx restore and seePlans, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Subscription screen es and fr render test.
- Gym tab render test in es and fr for the translated month line.
- formatNumber hardcoded en-AU.
- formatting.ts:67 and :72 use device locale.
- monthTitle uses i18n.language instead of dateLocale (check in 2.3 or 2.5).

## Next
- Round 125: WeekEnergyCard day letters (src/components/domain/WeekEnergyCard.tsx), with es and fr test; full Jest.
- Then monthTitle dateLocale, custom-food 'Save food', ConfidenceBadge text, nutrition kcal label (snapshots regenerated), i18n header comments, one per round.
- Then 2.2 leftovers, then 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Row 2b, 2c, 2d, rows 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour' (correct French, differs from en).
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
- React act warnings from ScanReviewCard and devWarn from hooks.ts:72. Row 22.
- react-test-renderer is deprecated and warns in hook tests. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Row 22.
- Plain npx eslint at repo root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Decide in Row 29.
- KNOWN_ISSUES.md Backend section still has Phase 3 wording. Docs round.
- If a render test adds jest.resetModules, shared unmountAll misses trees created after the reset.
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint does not exist).
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- src/lib/i18n/index.ts comment still says French is 'intentionally partial'.
- The Xh Ym duration is built by hand in one more place (gymRange or summaryCards, check in 2.3).
- Jest prints about 206 console blocks. Row 22.
- formatNumber en-AU and MyScheduleCard weekday/month short names: check once on the simulator (Row 23).