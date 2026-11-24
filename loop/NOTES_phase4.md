# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Never switch, push, merge, rebase or touch main. Loop script commits.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- BUILT: 1, 12, 12b, 29.
- Row 2 PARTIAL: 2.1 to 2.4 done. 2.5 parked (goalsReset.toast.render.test.tsx line 44).
- Row 2b DIFFERENT: steps 1a to 1d done, including done screen strings (R219). Plan-ready screen not built (decision below).
- Last full checkpoint R218: tsc 0, lint 0, 269 suites, 1,595 tests.
- Next checkpoint R227 or later.
- OWNER_CHECKS_phase4.md: append only.

## Order
R220: reconcile row 2b record with code (no new strings). Then paywall strings in en, es, fr, replacing CUISINE_LABEL (closes 1d). Then 2c, 2d, 2.2 remaining, 3 to 14b, 15 to 30, then 31.
If a round shows failures: fix them first, in a small round, before new strings.
Round flagged by loop check (R219 partly done): fixed by R220.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Lint: npx expo lint src scripts --max-warnings 0 (full folder each round).
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts or ios/. Do not change api.ts listSessions defaults.
- No new eslint-disable in app code. setup.ts must not import expo-router at top.
- Animated values: useState(() => new Animated.Value(x)).
- i18n: keep import { use as addPlugin }. One full key per sentence. Plurals _one and _other only. Every new string in en, es, fr.
- Outside React: import i18n from '@/lib/i18n'. Dates: dateLocale(i18n.language).
- Render tests named *.render.test.tsx. Jest --ci, one file per command, never -u.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel. Never print the URL.
- Every prompt: Claude Code works only on loop/phase4, runs no git commit or push, states the branch rule first.
- Onboarding i18n keys nested as onboarding.<screen>. Goal and activity keep flat keys.

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
- R196: saved onboarding answers kept on expired or revoked sessions. Deliberate sign-out and account deletion still wipe everything.
- R198: 401 routes split one per round. Session cleared via SESSION_ENDED, answers kept.
- R199: renderScreen wrapped in AppStateProvider (approved).
- R205: paywall 401 uses SESSION_ENDED.
- R206: 1d split one screen per round, goal first.
- R208: kept OnbScaffold, shared by every onboarding screen.
- R209 to R212: onboarding keys nested under onboarding.<screen>; cuisine and dietary options under options.<value>.
- R213: targets done. R214: disclaimer translated first. R215: HealthDisclaimer.tsx only.
- R216, R218: checkpoints green.
- R217: preview done in en, es, fr. Trial note uses {{days}}, no plural yet (TRIAL_DAYS = 7).
- R219: done screen strings in en, es, fr. Plan-ready screen NOT built. Kept order targets, paywall, done, because markCompleted clears answers before done shows. Not asked, decided.
- R220: row 2b record reconciled with code (no new strings).

## Blocked on Isa (do not retry)
- es and fr wording review: all onboarding screens, goal and activity forms, measurements, body type, cuisine, dietary, targets, summary, preview, done (title and welcomeToast: es 'Todo listo' / '¡Te damos la bienvenida a Lume!', fr 'Tout est prêt' / 'Bienvenue sur Lume !'), kJ, energyTarget, percentValue, mealLine, noBreakdown, goals.loadFailed, Save food, range separator, '80 %' spacing, lastSessions_one, healthDisclaimer.text.
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr.
- Whether es and fr should ever be shown (app is English only).
- goals.saved removal. Prettier. Scoped eslint allow confirmation.
- App Store privacy label and account data declaration.
- Camera string choice: plugin text vs infoPlist es/fr.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Training-days question, gain-weight or maintain goal in onboarding.
- Simulator checks (OWNER_CHECKS_phase4.md): answers survive a real Clerk expiry; signup, launch and paywall 401 routes; Total tile.

## Parked
- Paywall builds its cuisine line from English CUISINE_LABEL in src/components/onboarding/cuisines.ts. Remove the label field once the paywall is translated.
- Plan-ready summary screen between targets and paywall (post launch, needs flow change).
- Shared billing-disabled toast helper. delete-account.tsx swallows errors.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- formatNumber in src/lib/formatting.ts hardcoded to en-AU. units.ts also en-AU.
- WeekEnergyCard reads i18n directly. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- ConfidenceBadge hide reuses gymSession.hide. 'signed' helper defined in three files.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- consent.ts and purchases.ts use eslint-disable for the require rule (Row 2b or 3).
- Skeleton crashes under Reanimated test mock (Row 22).
- measurements.tsx: local variable t in a useState initialiser shadows t(). Rename in a tidy round.
- Onboarding: two dead ends need device check. Paywall unavailable message is developer wording. Target weight has no validation. Overweight option uses a burger emoji. Static paywall step precedes RevenueCat paywall. Unmapped Clerk error codes show Clerk's English text.
- Trial note plural: '{{days}} días' would read wrong if TRIAL_DAYS were 1 (today 7).
- Cuisine cap: 5+ cuisines show 3 cards, exactly 4 show all 4 (existing logic).
- Nothing dispatches SIGNED_IN, so the auth machine stays in unknown or signedOut.
- Completed users see 'Sign in again to finish setting up' (onboarding.sessionExpired). Wrong copy.
- connectivityMessage returns hard-coded English; no screen uses it.
- Still hard-coded English: paywall strings and toasts. Terms disclaimer paragraphs in src/app/legal/terms.tsx.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer, stack traces in passing tests (Row 22).
- Root config files and backend JavaScript not linted. preflight.mjs exits 1 on this machine.

## Problems noticed, not fixed
- Local ios/ prebuild output is stale until npx expo prebuild. Do not edit ios/.
- Two camera strings with different wording; plugin text wins.
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- KNOWN_ISSUES.md Backend section has Phase 3 wording. Docs round (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Verify:go has no -count=1, so Go can reuse cached results (parked).
- Secrets scan placeholder check is a heuristic.
- Signup placeholders are literals.
- Simulator check needed for Clerk session end on signup and paywall 401 routes.
- Preview: cuisine and halal lines are copy only; no data check.
- Trial note uses {{days}} with no plural forms (see parked).