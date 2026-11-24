# Lume Loop Notes: Phase 4

## Goal
Finish the app (Apple features, then tests) with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- BUILT: 1, 12, 12b, 29.
- Row 2 PARTIAL: 2.1 to 2.4 done. 2.5 parked (needs Isa to allow a change to goalsReset.toast.render.test.tsx line 44).
- Row 2b DIFFERENT (in progress): research and steps 1a to 1c done. Session expiry fixed (r191). Signup 401 fixed (r194). Launch gate 401 fixed (r195). Saved onboarding answers survive expired or revoked sessions (r196, simulator check parked).
- OWNER_CHECKS_phase4.md: append only, never overwrite or empty.

## Order
Round 197: full Jest checkpoint after r196 auth changes (prompt rewritten to 5 steps after loop rejection). Then clear rejected Clerk session on the three 401 routes. Then 2b 1d (goal and activity strings, own en/es/fr, flagged for review). Then 2c, 2d, 2.2 remaining, 3 to 14b, 15 to 30, then 31. Remove duplicate migration test run when convenient.

## Rules
- Lint: npx expo lint <files> --max-warnings 0. Verify never passes with warnings.
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts or ios/. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- Gym total days from the database (total_days), not the capped store.
- i18n: keep import { use as addPlugin }. Locale JSON: json.dumps(indent=2, ensure_ascii=False) plus newline, after round trip check. One full key per sentence. Plurals _one and _other only. Every new string in en, es and fr.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoint rounds.
- Energy: formatEnergy(value, unit) for sentences, kcalToDisplay for bare numbers.
- Max 5 steps per prompt. One screen or component per prompt. Grep before editing.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel. Never print the URL.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- Round 158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 changed (Isa allowed).
- Round 123: formatDuration rounds total minutes first.
- Round 161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept for voice logging.
- Round 166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- Round 168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- Round 172: migration check skips with exit 0 when variable unset.
- Round 174: CI workflow local only, throwaway local Postgres service, no repository secret.
- Round 176: privacy manifest in app.json. Face ID and Motion prompts removed. Camera is the only prompt.
- Round 178: check:manifest reads app.json (ios/ is stale prebuild output, git ignored).
- Round 180: parity test runs in full Jest, no separate verify wiring.
- Round 182: row 29 BUILT after full verify exit 0 with local TestPG.
- Round 184 and 186: migration apply test runs once, in verify:migrations.
- Round 194: 2b 1d no longer waits for Isa. Write own en/es/fr strings, flag for review, carry on.
- Round 195: launch gate 401 reuses classifyConnectivity and the Round 194 route.
- Round 196: saved onboarding answers kept on expired or revoked sessions. SESSION_ENDED and purgeExpiredSession added. Deliberate sign-out and account deletion still wipe everything. Trade-off: kept answers stay on the device for the next sign-in.
- Round 197: full Jest checkpoint chosen (Jev 92% run). Prompt rewritten to 5 steps after loop rejection. 401 session clearing moves to r198.

## Blocked on Isa (do not retry)
- es and fr wording review: Welcome, signup, onboarding.sessionExpired, summary.*, kJ keys, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one.
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label and account data declaration.
- Camera string choice: plugin text vs infoPlist es/fr.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Training-days question, gain-weight or maintain goal in onboarding.
- Simulator check: answers survive a real Clerk expiry or revocation (logged).

## Parked
- Row 2.1 simulator check of Total tile (owner check).
- Simulator check: signup and launch 401 routes.
- Shared billing-disabled toast helper. delete-account.tsx swallows errors.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts hardcoded to en-AU; formatting.ts uses device locale.
- WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper defined in three files.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx (Row 22 and 2b).
- consent.ts and purchases.ts use eslint-disable for the require rule (Row 2b or 3).
- Skeleton crashes under Reanimated test mock (Row 22). Every screen test mocks Skeleton.
- Weekday and month names on Hermes unchecked. Targets card height 360 not checked on device.
- Commented setup in TestPG files repeats shim SQL; point at supabase_shims.sql.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer (Row 22).
- Root config files and backend JavaScript not linted.
- preflight.mjs exits 1 on this machine; FAIL items not inspected.
- Onboarding: goal and activity hard-coded English (in progress, 1d). Two dead ends need device check. Paywall unavailable message is developer wording. Target weight has no validation. Overweight option uses a burger emoji. Static paywall step precedes RevenueCat paywall. Signup placeholders are literals. Unmapped Clerk error codes show Clerk's English text.
- Nothing sends SIGNED_IN, so the auth machine never leaves unknown or signedOut. Refresh and expired transitions are effectively unused.
- Completed users see 'Sign in again to finish setting up' when their session ends. Wrong copy for them.
- SIGN_OUT guard for a deleted account is mostly unreachable from the bridge.
- connectivityMessage returns hard-coded English; no screen uses it.
- Cuisine, dietary, preview, measurements, body type, targets, paywall and done are hard-coded English.

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
- Verify:go has no -count=1, so Go can reuse cached results (parked).
- Migration apply test runs twice per verify when the variable is set (fix in cleanup).
- On all three 401 routes (launch gate, signup status check, onboarding paywall), the rejected Clerk session should be cleared before sign-in to avoid an 'already signed in' loop. Not done (r198).