# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. The loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Row 2 PARTIAL. Rows 2c and 2d (commit e0c184d) DIFFERENT; verify later.
- Last full checkpoint: round 163 (tsc 0, Jest 257 suites, 1,507 tests, 4 snapshots, all pass).
- Round 165: week range separator was already done (week.tsx:155 uses dashboard.rangeSeparator, test week.rangeSeparator.render.test.tsx). Closed. Owner line in OWNER_CHECKS_phase4.md.
- Round 166 (current): 2.4 useGoals isLoading, error, refetch, plus goals screen states. Grep first.
- 2.2 left: feature_used allowlist, app_version vs build number, export as .json, one exportData, useWeeklyMacros refetch test, npm audit safe fix, 49 WHERE id::text queries.
- 2.3 strings: done for ConfidenceBadge, parity test, summaryCards, axis letters, energy, training, nutrition, week.
- 2.3 queue: notes backfill in PHASE4_ROWS.md; i18n header comments.
- Then 2.5 rest of Phase 3 leftovers (goals and unit prefs persisted via backend, missing _one plural, goals.saved).
- Then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.
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
- Max 5 steps per prompt. One screen or component per prompt. Grep before editing: last rounds asked for finished work.

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
- Round 149: meal row moved to nutrition.mealLine.
- Round 150: energy unit setting (kcal/kJ) via unitDeficit, unitSurplus, unitEaten, energyTarget.
- Round 152: week.tsx follows energy unit. Round 156: weekTarget merged into energyTarget.
- Round 158: ConfidenceBadge translated as scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed edits to tests pinning old English).
- Round 159: render test for badge 'Why?' panel in en, es, fr.
- Round 160: signed helper merged into one shared helper (formatting.ts). Still defined in 3 places, see Parked.
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept in all three languages, unused, parked for voice logging.
- Round 162: parity test stays Jest-only until Row 29 creates npm run verify.
- Round 162: summaryCards workoutsWeek uses weekdayLetter as a dedupe.
- Round 164: nutrition 'g' closed.

## Blocked on Isa (not blocking)
- E2E account needs 250+ gym dates.
- Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, energy kcal/kJ keys, energyTarget, percentValue, mealLine, noBreakdown, {{unit}} agreement, Save food, range separator ' – ' vs 'al'/'au').
- lastSessions_one in es and fr reads awkwardly.
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
- The energy screen always says kcal and ignores the unit setting.
- signed helper still defined in ConfidenceBadge.tsx, week.tsx, energy.tsx.
- Weekday and month names on Hermes not checked on the simulator.

## Problems noticed, not fixed
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives an undefined tile. Deploy backend with app (owner note).
- ssh tunnel on 127.0.0.1:55432: unknown target. Do not touch.
- Postgres is a brew service; database setup is manual. Rows 17 and 26 should script it.
- Phase 2 iOS notes say backend returns 401 without a Clerk token. Probably stale. Check in Row 16.
- Plain npx eslint at root reports about 11,000 errors in web/ and ds-bundle/. Add to ESLint ignores (Row 29).
- Prettier has no repo config. Decide in Row 29.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round.
- Nothing tests refetch in useWeeklyMacros.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Successful restore from not-entitled shows 'No purchases to restore.' toast: untested.
- Jest prints about 200 console blocks. Row 22.
- MacroTargetRows has no es or fr render test.
- nutrition.axisLetters and nutritionUnits still cast their mock meal.
- React act warnings from ScanReviewCard; devWarn from hooks.ts:72. Row 22.
- react-test-renderer is deprecated. Row 22.
- useBrainProfile unmount test cannot fail if its guard is removed. Row 22.
- src/lib/i18n/index.ts comment says French is 'intentionally partial'.
- Nutrition scale '418g' has no space; other screens use '120 g'. Kept for Phase 1 look.

## Next
- Round 166: 2.4 useGoals states (this prompt). Fix any failure in the next round.
- Then: 2.3 notes backfill, i18n header comments.
- Then 2.5 (Phase 3 leftovers), then Rows 2b, 2c, 2d, 3 to 14b, 15 to 30, then 31.
- Row 29 (npm run verify, wire localeParity) comes in its place in the order.
