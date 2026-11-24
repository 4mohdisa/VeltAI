# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH="$HOME/.nvm/versions/node/v22.23.5/bin:$PATH" first.
- Rows 1, 12, 12b, 29 BUILT. Verify exit 0 in round 183.
- Round 186: duplicate migration apply run removed from verify:go. Runs once, in verify:migrations. Done.
- Row 2 PARTIAL: 2.1 to 2.4 done. 2.5 parked (needs Isa to allow a change to goalsReset.toast.render.test.tsx line 44). 2.2 remaining.
- 2b step 1 research DONE (round 185): DESIGN_REFERENCES.md (16 Mobbin patterns, audit of 13 onboarding and auth screens).
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Order
Round 187: 2b step 1a, Welcome sign-in link (en, es, fr, welcome.render.test.tsx). Round 188: 2b step 1b, signup title follows mode and Resend code. Then remaining 2b steps (Maestro flow at end of 2b), 2c, 2d, 2.2 remaining, 3 to 14b, 15 to 30, then 31.

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
- Max 5 steps per prompt. One screen or component per prompt. Grep before editing.
- Every prompt states the loop/phase4 branch rule first.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel on 127.0.0.1:55432. Never print the URL.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 187: 2b step 1 split into 1a (Welcome link) and 1b (signup title, Resend code), one screen per prompt.
- Round 186: duplicate migration apply run removed from verify:go; the test runs only in verify:migrations.
- Round 184: migration apply test runs once, in verify:migrations. verify:go excludes that package.
- Round 183: lint scope covers scripts/ before 2.5.
- Round 182: verify with local TestPG recorded. Row 29 BUILT.
- Round 181: row 29 BUILT only if full verify exits 0 with zero lint warnings.
- Round 180: parity test runs in full Jest, so no separate wiring into verify.
- Round 178: check:manifest reads app.json (ios/ is stale prebuild output, git ignored).
- Round 176: privacy manifest in app.json. Face ID and Motion prompts removed. Camera is the only prompt.
- Round 174: CI workflow local only, throwaway local Postgres service, no repository secret.
- Round 172: migration check skips with exit 0 when variable unset.
- Round 168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept, unused, for voice logging.
- Round 158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 assertion changed (Isa allowed).
- Round 123: formatDuration rounds total minutes first.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- es and fr wording of new keys (summary.*, kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one).
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label answers and account data declaration.
- Camera string choice: plugin text vs es/fr strings in src/lib/i18n/infoPlist.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Design question: add a training-days question, and a gain-weight or maintain goal to onboarding?

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
- Skeleton crashes under Reanimated test mock (Row 22). Every screen test mocks Skeleton.
- Weekday and month names on Hermes unchecked. Targets card height 360 not checked on device.
- Commented setup in TestPG files repeats shim SQL; point at supabase_shims.sql.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer (Row 22).
- Root config files (app.config.js, eslint.config.js) and backend JavaScript not linted.
- preflight.mjs exits 1 on this machine; FAIL items not inspected.
- Onboarding: no i18n (all English). Two dead ends need device check (Back after resume, Back to signup while signed in). Session expiry shows misleading connection error. Paywall unavailable message is developer wording. Target weight has no validation. Overweight option uses a burger emoji. Static paywall step precedes RevenueCat paywall.

## Problems noticed, not fixed
- Local ios/ prebuild output is stale until npx expo prebuild. Do not edit ios/.
- Two camera strings with different wording; plugin text wins.
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
- signed helper defined in ConfidenceBadge.tsx, week.tsx and energy.tsx. Not fixed.
- Verify:go has no -count=1, so Go can reuse cached results (parked for later).

## Next
- Round 187: 2b step 1a, Welcome sign-in link.
- Round 188: 2b step 1b, signup title follows mode, Resend code button.