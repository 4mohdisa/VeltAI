# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. The loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL (2.3 strings done, 2.4 useGoals states done, 2.5 goals and unit prefs persistence not started).
- Last full checkpoint: round 163 (tsc 0, Jest 257 suites, 1,507 tests, all pass). Next full checkpoint: round 170.
- Round 168 (current): docs round. Backfill PHASE4_ROWS.md notes for rows 1 and 2, fix stale i18n header comments, park goals.saved removal.
- 2.2 left: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
- 2.5 left: goals and unit prefs persisted via backend (smallest change).
- After the docs round: Row 29 (npm run verify, wire localeParity) comes next in place of its order slot, then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Rules
- Lint: npx expo lint (plain eslint at root is noisy).
- Do not edit src/lib/mock/data.ts or src/__tests__/helpers/useApiHarness.ts. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days come from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale files: json.dumps(indent=2, ensure_ascii=False) plus newline; round trip check first. One full key per sentence. Plurals: _one and _other only.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Run jest with --ci, one file per command, never -u.
- If a render test calls jest.resetModules, unmountAll misses trees created after the reset.
- Day letters: calendar.weekdayLetters (Monday first). weekdayShort = full name. weekdayLetter = axis letters.
- Energy: formatEnergy(value, unit) for sentences, kcalToDisplay for bare numbers.
- Full suite on checkpoint rounds and after changes that can alter snapshots or strings.
- Max 5 steps per prompt. One screen or component per prompt. Grep before editing.
- Grep before asking for work: the last two rounds repeated finished work.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print LUME_TEST_DATABASE_URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 123: formatDuration rounds total minutes first.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 145: week separator uses dashboard.rangeSeparator.
- Round 146: Save food. es 'Guardar alimento', fr 'Enregistrer l'aliment' pending Isa review.
- Round 147: nutrition.gramsShort, percentValue, macroPercentFootnote added. es/fr '80 %' spacing pending review.
- Round 150: energy unit setting (kcal/kJ) via unitDeficit, unitSurplus, unitEaten, energyTarget.
- Round 152: week.tsx follows energy unit. Round 156: weekTarget merged into energyTarget.
- Round 158: ConfidenceBadge translated as scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed edits to tests pinning old English).
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept in en and fr, unused, parked for voice logging.
- Round 162: parity test stays Jest-only until Row 29 creates npm run verify.
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added. Real Skeleton needs a Reanimated mock in goals render tests.
- Round 168: goals.saved is kept. Removing it needs goalsReset.toast.render.test.tsx:44 and comments on lines 3 and 26 changed, which is not the allowed old-English-text edit. Parked until Isa allows it.

## Blocked on Isa (not blocking)
- E2E account needs 250+ gym dates.
- Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, energy kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, {{unit}} agreement, Save food, range separator, '80 %' spacing).
- lastSessions_one in es and fr reads awkwardly.
- goals.saved removal (see round 168).
- Do not retry these.

## Parked
- Row 2.1 simulator check of the Total tile (owner check).
- Shared billing-disabled toast helper (subscription.tsx, profile/index.tsx).
- delete-account.tsx swallowed-errors review.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts group hardcoded to en-AU; formatting.ts:67 and :72 use device locale.
- WeekEnergyCard reads i18n directly, not useTranslation.
- nutrition.tsx:231 meal row label builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading now they show kJ too.
- ConfidenceBadge hide button reuses gymSession.hide.
- signed helper still defined in ConfidenceBadge.tsx, week.tsx, energy.tsx.
- Weekday and month names on Hermes not checked on the simulator.
- Real Skeleton crashes under Reanimated test mock; add useReducedMotion to the jest setup (Row 22).
- Targets card placeholder height 360 not checked on a device.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service; database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- Plain npx eslint at root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Decide in Row 29.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round (Row 30).
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- Jest prints about 200 console blocks. Row 22.
- MacroTargetRows has no es or fr render test.
- nutrition.axisLetters and nutritionUnits still cast their mock meal.
- React act warnings from ScanReviewCard; devWarn from hooks.ts:72. Row 22.
- react-test-renderer is deprecated. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Row 22.
- Nutrition scale '418g' has no space; other screens use '120 g'. Kept for Phase 1 look.

## Next
- Round 168: docs round (row notes backfill, i18n header comments).
- Then: Row 29 (npm run verify, wire localeParity, ESLint ignores for web/ and ds-bundle/).
- Then 2.5 goals and unit prefs persisted via backend (smallest change), 2.2 remaining items, Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.