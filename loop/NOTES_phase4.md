# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Row 1 BUILT. Rows 12 and 12b BUILT. Row 2 PARTIAL (2.3 and 2.4 done, 2.5 status unclear, re-check with grep, 2.2 remaining). Row 29 PARTIAL.
- Row 29 verify chain: tsc, lint --max-warnings 0, full Jest --ci, verify:go (race), verify:migrations (skips unless LUME_TEST_DATABASE_URL set), secrets:scan, check:manifest.
- Row 29 open: CI workflow never run on GitHub (local only). expo lint covers src, app, components only, not scripts/.
- Last checkpoint (round 177): tsc 0, Jest 259 suites, 1,524 tests. Full verify not yet run since row 12 work.
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Order
Round 181 (this round): full npm run verify, each step recorded in BASELINE_phase4.md. Then row 29 BUILT only if green with zero warnings. Then 2.5 (after grep), 2.2 remaining, 2b, 3 to 14b, 15 to 30, then 31.

## Rules
- Lint: npx expo lint <files> --max-warnings 0. Verify never passes with warnings.
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts or ios/. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale JSON: json.dumps(indent=2, ensure_ascii=False) plus newline, after round trip check. One full key per sentence. Plurals _one and _other only.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Jest --ci, one file per command, never -u.
- Energy: formatEnergy(value, unit) for sentences, kcalToDisplay for bare numbers.
- Max 5 steps per prompt. One screen or component per prompt. Grep before editing and before asking for work.
- Every prompt states the loop/phase4 branch rule first.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 181: prompt rewritten after loop rejection for missing branch rule. Branch rule now first. One task only.
- Round 181: row 29 BUILT only if full verify exits 0 with zero lint warnings.
- Round 180: parity test runs in full Jest, so no separate wiring into verify.
- Round 178: check:manifest reads app.json (ios/ is stale prebuild output, git ignored).
- Round 176: privacy manifest in app.json. Face ID and Motion prompts removed (not used). Camera is the only prompt.
- Round 174: CI workflow local only, throwaway local Postgres service, no repository secret.
- Round 172: migration check skips with exit 0 when variable unset.
- Round 168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept, unused, for voice logging.
- Round 158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed).
- Rounds 145 to 156: Save food, gramsShort, percentValue, macroPercentFootnote, week separator via dashboard.rangeSeparator, kcal/kJ setting, weekTarget merged into energyTarget.
- Round 130: summaryNoFabrication.test.ts checks source for t('summary.notTracked'). Accepted.
- Round 123: formatDuration rounds total minutes first.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one).
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label answers and account data declaration.
- Camera string choice: plugin text vs es/fr strings in src/lib/i18n/infoPlist.

## Parked
- Row 2.1 simulator check of Total tile (owner check).
- Shared billing-disabled toast helper. delete-account.tsx swallows errors.
- consent.ts:52, purchases.ts:63 and :173 use eslint-disable for require rule; move to scoped allow.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts hardcoded to en-AU; formatting.ts uses device locale.
- WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper defined three times.
- Several screens have react-hooks/exhaustive-deps disable comments (Row 22).
- Skeleton crashes under Reanimated test mock (Row 22).
- Weekday and month names on Hermes unchecked. Targets card height 360 not checked on device.
- Migration apply test runs twice in CI (verify:go and verify:migrations).
- Commented setup in TestPG files repeats shim SQL; point at supabase_shims.sql.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer (Row 22).

## Problems noticed, not fixed
- Local ios/ prebuild output is stale until npx expo prebuild. Do not edit ios/.
- Two camera strings with different wording; plugin text wins.
- scripts/ not covered by expo lint, so a lint error in scripts/checkPrivacyManifest.js would pass verify. Fix in Row 29 follow-up.
- fr privacy copy uses 'vos', matching existing fr copy.
- productName.test.ts failed once in Row 12a and passed after restore. Watch it.
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- Postgres is a brew service; database setup manual. Rows 17 and 26 should script it.
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round (Row 30).
- Phase 2 iOS notes say backend returns 401 without Clerk token. Check in Row 16.
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Nutrition scale '418g' has no space; kept for Phase 1 look.
- Secrets scan placeholder check is a heuristic.
- signed helper defined in ConfidenceBadge.tsx, week.tsx and energy.tsx.

## Next
- Round 181: full npm run verify, each step recorded in BASELINE_phase4.md. Row 29 BUILT only if green with zero warnings.
- Then 2.5 (grep first), 2.2 remaining, 2b, 3 to 14b, 15 to 30, then 31.