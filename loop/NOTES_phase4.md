# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Loop script commits. Never switch, push, merge, rebase or touch main.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- BUILT: 1, 12, 12b, 29. Row 2 PARTIAL (2.5 parked). Row 2b DIFFERENT: screens 1a to 1d done, paywall strings done, preview and plan-ready screen not built.
- R227 checkpoint green: 270 suites, 1,637 tests, tsc 0, lint 0. Handover cites 268 and 1,579; R230 numbers are the record.
- Next full checkpoint: R242 or next handover.
- OWNER_CHECKS_phase4.md: append only.

## Order
- R230: checkpoint, read only, no file changes.
- Then: CUISINE_LABEL cleanup in cuisines.ts (unused export, English label field).
- Row 2c: no scope in the brief; park in OWNER_CHECKS and move on.
- Then 2d, 2.2 remaining, 3 to 14b, 15 to 30, 31.
- A red round is fixed in a small round before new work.
- At the next records round: check Row 2b notes in PHASE4_ROWS.md against the handover (it has drifted before).

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the loop/phase4 branch rule and forbids other git commands.
- Lint: npx expo lint src scripts --max-warnings 0.
- Do not edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, or api.ts listSessions defaults.
- No new eslint-disable. Animated values: useState(() => new Animated.Value(x)).
- i18n: keep import { use as addPlugin }. One full key per sentence. Plurals _one and _other only. Every new string in en, es, fr. Outside React: import i18n from '@/lib/i18n'.
- Onboarding keys nested under onboarding.<screen>. Goal and activity keep flat keys.
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u.
- TestPG: localhost:5432, database lume_test_local. Never the ssh tunnel. Never print the URL.

## Decisions (never delete)
- No questions to Isa. Park owner steps in OWNER_CHECKS_phase4.md and carry on.
- Local Postgres and sandbox keys only. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- R123: formatDuration rounds total minutes first.
- R158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 changed (Isa allowed).
- R161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept.
- R166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- R168: goals.saved kept; removal needs a non-allowed test edit. Parked.
- R172: migration check skips with exit 0 when variable unset.
- R174: CI workflow local only, throwaway local Postgres service, no repository secret.
- R176, R178: privacy manifest in app.json. Camera is the only prompt. check:manifest reads app.json (ios/ is stale).
- R180: parity test runs in full Jest.
- R182: row 29 BUILT after full verify exit 0 with local TestPG.
- R184, R186: migration apply test runs once, in verify:migrations.
- R194: 2b 1d does not wait for Isa. Own en, es, fr strings, flagged for review.
- R195, R196, R198, R205: 401 routes dispatch SESSION_ENDED. Session cleared, answers kept.
- R199: renderScreen wrapped in AppStateProvider (approved).
- R206: 1d split one screen per round. R208: OnbScaffold kept.
- R209 to R212: onboarding keys nested; cuisine and dietary options under options.<value>.
- R219: done screen translated. Plan-ready screen NOT built: needs Isa's go-ahead.
- R222: paywall strings done. es and fr are agent wording for review.
- R225: validateOnboardingPayload i18n chosen over sessionExpired copy.
- R226: sessionExpired copy 'Your session ended. Sign in again to continue.'
- R228: paywall 4xx toast uses onboarding.paywall.submitFailed. Server English 4xx text still shows; tracked in row 2b.
- R229: CONNECTION_MESSAGE test constant reads en.onboarding.paywall.submitFailed.
- R230: checkpoint round, read only, per handover.

## Blocked on Isa (do not retry)
- es and fr wording review: onboarding screens, paywall, validation, sessionExpired, goals.loadFailed, Save food, kJ, energyTarget, noBreakdown, healthDisclaimer.text, paywall 4xx.
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr. '80 %' spacing.
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
- formatNumber and units.ts hardcoded to en-AU. nutrition.tsx:231 builds 'slot, energy' in code.
- kcalEatenPerDay and kcalNetPerDay names misleading (renames not allowed).
- 'signed' helper in three files. ConfidenceBadge hide reuses gymSession.hide.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- consent.ts and purchases.ts use eslint-disable for the require rule (Row 2b or 3).
- Skeleton crashes under Reanimated test mock (Row 22).
- measurements.tsx: local t in useState initialiser shadows t(). Tidy round.
- Trial note plural '{{days}} días' wrong if TRIAL_DAYS were 1.
- Terms disclaimer paragraphs in src/app/legal/terms.tsx are hard-coded English.
- connectivityMessage returns English and is unused. Signup placeholders are literals.
- Nothing dispatches SIGNED_IN, so the auth machine stays unknown or signedOut.
- Jest noise: i18next banner, devWarn, act warnings, deprecated react-test-renderer (Row 22).
- Root config and backend JavaScript not linted. preflight.mjs exits 1 on this machine.

## Problems noticed, not fixed
- CUISINE_LABEL in cuisines.ts unused; English label field may be unused. The paywall cuisine line still reads it.
- Paywall feature list and toasts still English in places; server 4xx text English.
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Verify:go has no -count=1 (parked).
- Secrets scan placeholder check is a heuristic.
- Preview: cuisine and halal lines are copy only; no data check.
- Key naming mixed: goal and activity flat, later screens nested.
- onboarding.sessionExpired says 'finish setting up', wrong for users who finished onboarding.
- measurements.tsx local t shadows t().
- Gotcha: the Row 2b note may drift again; check it at each records round.