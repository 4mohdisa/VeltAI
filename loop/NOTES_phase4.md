# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple side features, then testing) with no input from Isa. Progress is counted from PHASE4_ROWS.md (36 rows).

## State
- Work only on branch loop/phase4. Never switch, push, merge, rebase or touch main. The loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL. Rows 2c and 2d (commit e0c184d) DIFFERENT; verify later.
- 2.1: only the simulator check of the Total tile is left (OWNER_CHECKS_phase4.md).
- 2.2 done except: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
- 2.3 (strings) in progress, one file per round. Done: custom-food, EnergyBalanceCard, GymSessionButton, MacroBars, energy, Summary, energyRange, axis letters (energy, training, nutrition, week), WeekEnergyCard, week range separator, nutrition.tsx unit and footnote (round 147).
- Round 148 (current): CHECKPOINT. tsc and full Jest, no edits. Report failures.
- Open 2.3 items, in order: ConfidenceBadge text; i18n header comments; summaryCards MTWTFSS fallback check; week.tsx ' – ' separator (handover says still untranslated, check); energy screen follows energy unit setting; nutrition.tsx:247 hardcoded ' · ' in meal row. Then add a PHASE4_ROWS.md note for 2.3 (missing: GymSessionButton, MacroBars, Summary, energyRange, nutrition, Week, WeekEnergyCard, range separator, custom-food, nutrition units).
- 2.4 useGoals (Row 15). 2.5 rest of Phase 3 leftovers.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Lint
- Use npx expo lint. Plain eslint at repo root is noisy (web/, ds-bundle/).

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature, no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. Fix flaws and flows. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Prompts touch one main file each. Max 5 numbered steps. Name every file by full path. Every prompt states the loop/phase4-only rule and forbids git commands.
- Shared router reset (setup.ts beforeEach). setup.ts must not import expo-router at the top.
- Animated values use useState(() => new Animated.Value(x)).
- Row 2.1 total gym days comes from the database (total_days), not the capped store.
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- One reasoned eslint-disable-next-line for a required require. No new eslint-disable comments in app code. analyticsSink.ts:29 keeps its lazy require (accepted warning); revisit in Row 29.
- i18n alias: import { use as addPlugin } is kept.
- cameraMock(getTakePicture, getPermission?) is the shared camera stub. Factory mocks use jest.requireActual with no cast.
- Full suite on checkpoint rounds and after any change that can alter snapshots or strings.
- Locale files rewritten with json.dumps(indent=2, ensure_ascii=False) plus newline. Check the round trip first.
- A sentence gets one full i18n key. Plurals use _one and _other only.
- Code outside React uses import i18n from '@/lib/i18n'. Dates use dateLocale(i18n.language).
- Rendering tests named *.render.test.tsx to get the jest-expo preset.
- Day letters come from calendar.weekdayLetters (Monday first). weekdayShort returns full name (VoiceOver label). weekdayLetter gives axis letters.
- Summary 'summary' is a new top-level locale section.
- Round 123: formatDuration rounds total minutes first.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 145: week separator uses dashboard.rangeSeparator (no week section). Jev agreed.
- Round 146: Save food pick. es 'Guardar alimento', fr 'Enregistrer l’aliment' pending Isa's wording review.
- Round 147: nutrition.gramsShort, percentValue, macroPercentFootnote added. es/fr '80 %' spacing pending Isa review.
- Round 148 checkpoint: no edits; decision on run only.

## Done (condensed)
- Rounds 1-9: row list, PHASE4_ROWS.md, Row 1.
- Rounds 10-26: hydrateGym limit 200, total_days, streakFromApi, stale mocks fixed.
- Rounds 28-43, 88-95: lint at 0 errors, 1 accepted warning.
- Rounds 38-39: gym session history read limited (7-day window).
- Rounds 96-97: schedule_pg progress keeps newest N; 24 of 24 TestPG pass.
- Rounds 98-106: morning brief and profile errors surfaced, subscription strings, DailyMacroRing 'of'.
- Rounds 107-147: i18n renders, dateLocale, formatStreak, formatDuration, formatHoursMinutes, workoutsLine, summaryCards, WeekEnergyCard, EnergyBalanceCard, GymSessionButton, MacroBars, Summary, weekdayShort, weekdayLetter, dayMonth, energy, training, nutrition, week, custom-food Save button, nutrition units.
- Last full run (round 134): 245 suites, 1,462 tests, 4 snapshots. Expect 248+ suites after rounds 143-147.

## Blocked on Isa (not blocking the loop)
- E2E account needs 250+ gym dates (OWNER_CHECKS_phase4.md).
- Should the morning brief free-plan refusal count as an error?
- Confirm 'Sept' in English.
- Confirm es and fr hours and minutes spacing ('1 h 45 min').
- Review es and fr wording of new keys: summary.*, gym.loggedTodayLabel, dashboard.energyBalance.*, dashboard.energyAverageBurned, customFood.saveButton, nutrition.* footnote and percentValue.
- Confirm weekdayShort stays a full name.
- Week range separator: keep ' – ' in es and fr, or use 'al' / 'au'.
- Do not retry these; work on other surfaces.

## Parked
- Row 2.1 simulator check of the Total tile.
- Shared billing-disabled toast helper (subscription.tsx, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Subscription, Gym tab and MacroTargetRows render tests in es and fr.
- formatNumber hardcoded en-AU; formatting.ts:67 and :72 use device locale.
- WeekEnergyCard reads i18n directly, not useTranslation.
- es and fr 'per day' wording differs between Summary card and week detail.
- Energy screen ignores the energy unit setting (always kcal).
- Weekday and month names on Hermes not checked on the simulator.

## Next
- Round 148: checkpoint (current). Read the result before the next edit.
- Then energy unit setting, ConfidenceBadge, i18n header comments, summaryCards fallback, week.tsx separator, nutrition.tsx:247, then the 2.3 note in PHASE4_ROWS.md.
- Then 2.2 leftovers, 2.4 (useGoals, Row 15), 2.5 (rest of Parked, goals and unit prefs persisted, missing _one plural, goals.saved).
- Then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour' (correct French, differs from en).
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service; database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- No app-wide en/es/fr key parity test yet (Row 29).
- src/lib/i18n/index.ts comment still says French is 'intentionally partial'.
- React act warnings from ScanReviewCard; devWarn from hooks.ts:72. Row 22.
- react-test-renderer is deprecated. Row 22.
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
- Other Summary cards may still have English literals (check in 2.3 sweep).
- MacroTargetRows has no es or fr render test.
- Energy screen always says kcal; formatNumber en-AU.
- nutrition.tsx:247 meal row builds 'time · energy' with hardcoded ' · '.
- Round 147 footnote repeats the four macro names from nutrition.protein/carbs/fat/fibre. Rename both places if one changes.