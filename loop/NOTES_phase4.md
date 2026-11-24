# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing) with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Branch loop/phase4 from loop/phase3. Never work on main. Never switch, push or merge.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL.
- 2.1: simulator check of the Total tile left (parked in OWNER_CHECKS_phase4.md).
- 2.2: done except feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
- 2.3 strings in progress. Open, one file per round: energy.tsx:258 (round 137, in progress), dashboard/training.tsx:212, dashboard/week.tsx:265, dashboard/nutrition.tsx:170 use weekdayLetter; WeekEnergyCard dayLetter imports weekdayLetter; week.tsx:150 hardcoded dash; custom-food 'Save food'; ConfidenceBadge text; i18n header comments; summaryCards MTWTFSS fallback check. Add a PHASE4_ROWS.md note when 2.3 closes.
- 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- Rows 2c and 2d (commit e0c184d) are DIFFERENT. Verify and set status later.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint
- Use `npx expo lint`. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa this week. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Morning brief free-plan refusal sets isError true (round 100). Revisit in Rows 6 and 7.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Prompts touch ONE main file each (locale JSON counts as data). Max 5 numbered steps. Name every file by full path.
- Shared router reset (setup.ts beforeEach). setup.ts must not import expo-router at the top.
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- A required require keeps one reasoned eslint-disable-next-line comment. No new eslint-disable comments in app code.
- analyticsSink.ts:29 keeps its lazy require (accepted 1 warning). Revisit in Row 29.
- i18n alias: `import { use as addPlugin }` is kept.
- cameraMock(getTakePicture, getPermission?) is the shared camera stub. Factory mocks use jest.requireActual with no cast.
- Full suite on checkpoint rounds and after any change that can alter snapshots or strings.
- Locale files rewritten with json.dumps(indent=2, ensure_ascii=False) plus newline. Check the round trip first.
- A sentence gets one full i18n key. Plurals use _one and _other only.
- Code outside React uses import i18n from '@/lib/i18n'. Dates use dateLocale(i18n.language).
- Rendering tests named *.render.test.tsx to get the jest-expo preset.
- Summary 'summary' is a new top-level locale section (round 130). Isa to review.
- Round 115: 'Sept' (en-AU short month) kept. Isa to confirm.
- Round 118: month summary keeps '0h 45m' in English (pinned by gymMonth.test.ts).
- Round 120-122: es and fr month summary and weekly card use common.hoursMinutes ('1 h 45 min'). Isa to confirm.
- Round 123: formatDuration rounds total minutes first.
- Round 124-125: day letters from calendar.weekdayLetters (Monday first). Hermes ignores weekday narrow.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 136: weekdayShort returns full name (VoiceOver label in week.tsx). weekdayLetter gives axis letters. Deviates from step 2 of the round 136 prompt. Isa to review.
- Round 135: energy.tsx sentence uses dashboard.energyAverageBurned (es 'quemadas', fr 'brûlées'). Isa to review.
- Round 134: checkpoint green: tsc 0 errors, Jest 245 suites, 1,462 tests, 4 snapshots.
- Jev (rounds 128-137): continuing without Isa risk 1.2 of 2. Keep tasks small and parked items visible.

## Done (condensed)
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days, streakFromApi, stale mocks fixed.
- Rounds 28-43, 88-95: lint at 0 errors, 1 accepted warning.
- Rounds 38-39: history gym session read limited (7-day window).
- Rounds 96-97: schedule_pg progress keeps newest N; 24 of 24 TestPG pass.
- Rounds 98-106: getMorningBrief and getProfile errors surfaced, subscription strings, DailyMacroRing 'of'.
- Rounds 107-136: i18n renders, dateLocale, formatStreak, formatDuration, formatHoursMinutes, workoutsLine, summaryCards day letters, WeekEnergyCard, EnergyBalanceCard, GymSessionButton, MacroBars, Summary screen, energy sentence, weekdayShort, weekdayLetter, dayMonth.
- Checkpoints 44, 60, 75, 76, 90, 104, 118, 121-123, 125, 126, 134: tsc and Jest green.

## Blocked on Isa (not blocking the loop)
- E2E account needs 250+ gym dates. Logged in OWNER_CHECKS_phase4.md.
- Should the morning brief free-plan refusal count as an error?
- Confirm 'Sept' in English.
- Confirm es and fr hours and minutes spacing ('1 h 45 min' vs '1h 45m').
- Review es and fr wording: week card keys, six energy balance keys, gym logged label, summary.notTracked, summary target and a11y keys, energyAverageBurned.
- Confirm weekdayShort stays a full name (round 136 deviation).
- Do not retry these questions; work on other surfaces.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx restore and seePlans, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Subscription screen es and fr render test.
- Gym tab render test in es and fr for the translated month line.
- MacroTargetRows render test in es and fr.
- formatNumber hardcoded en-AU (energy screen shows 1,683 in es too).
- formatting.ts:67 and :72 use device locale.
- WeekEnergyCard reads i18n directly, not useTranslation.
- es and fr 'per day' wording differs between Summary card and week detail.
- Energy screen ignores the user's energy unit setting (always kcal).
- week.tsx:150 hardcoded dash in the week range.

## Next
- Round 137: energy.tsx:258 to weekdayLetter (in progress).
- Then dashboard/training.tsx:212, dashboard/week.tsx:265, dashboard/nutrition.tsx:170, WeekEnergyCard dayLetter. One file per round.
- Then week.tsx dash, custom-food 'Save food', ConfidenceBadge, i18n header comments, summaryCards fallback. Then the 2.3 note in PHASE4_ROWS.md.
- Then 2.2 leftovers, 2.4 (useGoals, Row 15), 2.5 (rest of Parked list, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour' (correct French, differs from en).
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note in OWNER_CHECKS_phase4.md).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service. Database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
- src/lib/i18n/index.ts comment still says French is 'intentionally partial'.
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
- Jest prints about 200 console blocks. Row 22.
- formatNumber en-AU and MyScheduleCard short names: check once on the simulator (Row 23).
- Weekday and month names on Hermes not checked on the simulator.