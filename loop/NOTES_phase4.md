# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Loop script commits. Never switch, push, merge, rebase or touch main.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- BUILT: 1, 12, 12b, 29. Row 2 PARTIAL (2.5 parked). Row 2b DIFFERENT.
- R224 verified R223: tsc 0, lint 0, 15 render suites pass. R224 closed.
- Last full checkpoint R218 (269 suites, 1,595 tests). Next checkpoint R227 or later.
- OWNER_CHECKS_phase4.md: append only.

## Order
- R225 (now): validateOnboardingPayload to i18n, stale header in onboarding.ts.
- Then: onboarding.sessionExpired copy; CUISINE_LABEL cleanup; paywall 4xx English (paywall.tsx:99-102); preview check.
- Then 2c, 2d, 2.2 remaining, 3 to 14b, 15 to 30, 31.
- If a round shows failures: fix first, in a small round.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Lint: npx expo lint src scripts --max-warnings 0 (full folder).
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, or api.ts listSessions defaults.
- No new eslint-disable. Animated values: useState(() => new Animated.Value(x)).
- i18n: keep import { use as addPlugin }. One full key per sentence. Plurals _one and _other only. Every new string in en, es, fr. Outside React: import i18n from '@/lib/i18n'.
- Onboarding keys nested under onboarding.<screen>. Goal and activity keep flat keys.
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel. Never print the URL.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Never touch hosted services. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- R123: formatDuration rounds total minutes first.
- R158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 changed (Isa allowed).
- R161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept for voice logging.
- R166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- R168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- R172: migration check skips with exit 0 when variable unset.
- R174: CI workflow local only, throwaway local Postgres service, no repository secret.
- R176, R178: privacy manifest in app.json. Camera is the only prompt. check:manifest reads app.json (ios/ is stale).
- R180: parity test runs in full Jest.
- R182: row 29 BUILT after full verify exit 0 with local TestPG.
- R184, R186: migration apply test runs once, in verify:migrations.
- R194: 2b 1d does not wait for Isa. Own en/es/fr strings, flagged for review.
- R195: launch gate 401 reuses classifyConnectivity and the R194 route.
- R196: saved onboarding answers kept on expired or revoked sessions. Deliberate sign-out and account deletion wipe everything.
- R198, R205: 401 routes dispatch SESSION_ENDED. Session cleared, answers kept.
- R199: renderScreen wrapped in AppStateProvider (approved).
- R206: 1d split one screen per round. R208: OnbScaffold kept.
- R209 to R212: onboarding keys nested; cuisine and dietary options under options.<value>.
- R219: done screen translated. markCompleted() only sets completed; answers cleared on sign-out. Plan-ready screen NOT built: needs Isa's go-ahead.
- R221 rejected for covering more than one screen.
- R222: paywall strings done. es and fr are agent wording for review.
- R223: records only. R224 verified.
- R225: validateOnboardingPayload i18n chosen over sessionExpired copy (same file, smaller). Jev 97% run agreed.

## Blocked on Isa (do not retry)
- es and fr wording review: all onboarding screens, paywall, measurements, body type, cuisine, dietary, targets, summary, preview, done, kJ, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one, healthDisclaimer.text.
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label and account data declaration.
- Camera string choice: plugin text vs infoPlist es/fr.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Training-days question; gain-weight or maintain goal in onboarding.
- Plan-ready summary screen (needs go-ahead).
- Simulator checks (OWNER_CHECKS_phase4.md): answers survive a real Clerk expiry; signup, launch and paywall 401 routes; Total tile.

## Parked
- Shared billing-disabled toast helper. delete-account.tsx swallows errors.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber and units.ts hardcoded to en-AU. WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper in three files.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- consent.ts and purchases.ts use eslint-disable for the require rule (Row 2b or 3).
- Skeleton crashes under Reanimated test mock (Row 22).
- measurements.tsx: local t in useState initialiser shadows t(). Rename in a tidy round.
- Onboarding: two dead ends need device check. Paywall unavailable message is developer wording. Target weight has no validation. Overweight option uses a burger emoji. Unmapped Clerk error codes show Clerk's English.
- Trial note plural: '{{days}} días' wrong if TRIAL_DAYS were 1.
- Cuisine cap: 5+ show 3 cards, exactly 4 show all (existing logic).
- Nothing dispatches SIGNED_IN, so the auth machine stays unknown or signedOut.
- connectivityMessage returns hard-coded English; no screen uses it.
- Terms disclaimer paragraphs in src/app/legal/terms.tsx are hard-coded English.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer (Row 22).
- Root config and backend JavaScript not linted. preflight.mjs exits 1 on this machine.

## Problems noticed, not fixed
- Local ios/ prebuild output is stale. Do not edit ios/.
- Two camera strings with different wording; plugin text wins.
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Verify:go has no -count=1 (parked).
- Secrets scan placeholder check is a heuristic.
- Signup placeholders are literals.
- Preview: cuisine and halal lines are copy only; no data check.
- Stale header in onboarding.ts lines 3 and 4 (fixing in R225).
- CUISINE_LABEL in cuisines.ts is unused.
- onboarding.sessionExpired says finish setting up; wrong for users who already completed onboarding.
- validateOnboardingPayload toasts are English (fixing in R225).