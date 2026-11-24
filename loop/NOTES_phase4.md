# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Loop script commits. Never switch, push, merge, rebase or touch main.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- BUILT: 1, 12, 12b, 29.
- Row 2 PARTIAL (2.2 and 2.5 BUILT). Stays PARTIAL until Phase 3 Rows 6, 13, 14 are BUILT.
- Row 2b DIFFERENT: step 1d strings done (en, es, fr). Plan-ready screen parked for Isa's go-ahead.
- Row 13: barcode failed state (R240, R241), foodDays error (R243), calendar error (R244), Food tab notice (R245) all done.
- Next: records round. Add Row 13 lines to PHASE3_ROWS.md (R245 changes), list what is left.
- Then: remove days and loading aliases in foodDays.ts (update calendar test mock), es and fr render tests for error states, rest of Row 13.
- Last full green checkpoint R242 (tsc 0, 272 suites, 1,661 tests).

## Order
- Phase 3 Rows 13, 6, 14. Then Row 2 to BUILT. Then 2b (plan-ready parked), 2d, 3 to 14b, 15 to 30, 31.
- Row 2c: not in the brief. Parked in OWNER_CHECKS. Reports asking for it are ignored.
- Trust this file over handovers and reports.
- One screen or component per prompt. Rejected prompts get rewritten to one screen.

## Rules
- Max 5 steps per prompt. Grep before editing.
- Every prompt states the loop/phase4 branch rule and forbids other git commands.
- Lint: npx expo lint src scripts --max-warnings 0.
- No new eslint-disable. Animated values: useState(() => new Animated.Value(x)).
- i18n: keep import { use as addPlugin }. One full key per sentence. Plurals _one and _other only. Every new string in en, es, fr.
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u.
- TestPG: localhost:5432, database lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, or the api.ts listSessions defaults.

## Decisions (never delete)
- No questions to Isa. Park owner steps and carry on.
- Local Postgres and sandbox keys only. Isa deploys himself.
- RevenueCat only, no Stripe. No free tier: 7 day Apple trial gives every feature; no trial when buying straight away.
- Live AI calls only in the AI contract row, max 30 a day, logged in AI_TEST_LOG.md.
- Sentry for crashes, PostHog for analytics, names and counts only.
- Launch soon: no major UI changes. New Phase 4 screens may be designed fresh. Use Mobbin, log in DESIGN_REFERENCES.md, never copy real apps.
- R123: formatDuration rounds total minutes first.
- R158: ConfidenceBadge uses scanCards.noBreakdown; scanConfidence.test.ts:93 changed (Isa allowed).
- R161: parity test at src/__tests__/localeParity.test.ts. addMenu.voice and addMenu.describeOutLoud kept.
- R166: useGoals returns data, isLoading, error, refetch. goals.loadFailed added.
- R172: migration check skips with exit 0 when variable unset.
- R174: CI workflow local only, throwaway local Postgres service, no repository secret.
- R176, R178: privacy manifest in app.json. Camera is the only prompt.
- R180: parity test runs in full Jest. R182: row 29 BUILT after full verify exit 0.
- R184, R186: migration apply test runs once, in verify:migrations.
- R194: 2b 1d does not wait for Isa. Own en, es, fr strings, flagged for review.
- R195, R196, R198, R205: 401 routes dispatch SESSION_ENDED. Session cleared, answers kept.
- R199: renderScreen wrapped in AppStateProvider (approved).
- R209 to R212: onboarding keys nested; cuisine and dietary options under options.<value>.
- R225, R226: validateOnboardingPayload uses i18n. sessionExpired wording set.
- R228, R229: paywall 4xx toast uses onboarding.paywall.submitFailed for every 4xx except 401.
- R231, R235: CUISINE_LABEL and connectivityMessage removed.
- R233, R234: Terms disclaimer in legal.terms. Rest of Terms and Privacy stays English.
- R236: en-AU kept as the English output of formatNumber; es and fr use their own locale.
- R239: English grams from 1,000 up group (1,234 g) per brief. Logged for Isa to confirm.
- R240, R241: barcode failed state via lookupBarcodeResult.
- R242: checkpoint. lookupBarcodeAsync stays until Isa approves removing its pinned test.
- R243: foodDays.ts error: failure keeps dates and sets error; success clears it. useHydration not moved (hydrationErrorScreens.test.ts:34 pins it in hooks.ts; import cycle).
- R243: calendar error state limited to foodDays.ts and calendar.tsx; new es, fr strings flagged for Isa.
- R244: calendar error reuses an existing shared error component (no new component).
- R245: food.tsx keeps the week strip visible and shows a notice above it. Button says 'Try again' (common.tryAgain, built into LoadFailedNotice).
- Retry label: stays 'Try again' on every screen, because LoadFailedNotice is shared. The brief's 'Retry' wording is not used (applies to Row 13 and Row 14 retry buttons).

## Blocked on Isa (do not retry)
- es and fr wording review: onboarding, paywall, validation, sessionExpired, goals.loadFailed, Save food, kJ, energyTarget, noBreakdown, healthDisclaimer.text, paywall 4xx, Terms disclaimer, barcode failed strings, calendar strings, food.loggedDaysFailed.
- How far legal text is translated, and legal review in each language.
- E2E account needs 250+ gym dates. Morning brief free-plan refusal: is it an error?
- 'Sept' in English. Hours and minutes spacing in es and fr. '80 %' spacing. Spanish four-digit numbers without separator.
- English grouping from 1,000 up (1,234 g) confirmation.
- Whether es and fr should ever be shown (app is English only).
- Prettier. Scoped eslint allow confirmation.
- App Store privacy label and account data declaration.
- Camera string choice: plugin text vs infoPlist es/fr.
- Push loop/phase4 and confirm CI runs green on GitHub.
- Training-days question; gain-weight or maintain goal in onboarding.
- Plan-ready summary screen (needs go-ahead).
- Approval to delete dead lookupBarcodeAsync in scan.ts and its assertion at scanSeam.test.ts:521.
- Simulator checks: answers survive a real Clerk expiry; signup, launch and paywall 401 routes; Total tile.

## Parked
- formatCurrency hard-codes A$ and a dot decimal in every language.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows, failed barcode state, calendar error, Food tab logged-days error.
- legalParity.test.ts scans .tsx only; JSON legal text not covered by banned-claim scan.
- authMachine.test.ts names say 'copy' but no copy is tested (tidy round).
- consent.ts and purchases.ts use eslint-disable for the require rule.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders (signup.tsx:339, :362) are literals.
- Nothing dispatches SIGNED_IN, so the auth machine stays unknown or signedOut.
- Jest noise: i18next banner, devWarn, act warnings (Row 22).
- Root config and backend JavaScript not linted.
- Verify:go has no -count=1.
- Dev only 'Simulate scan' and 'Unknown code' titles are English literals.
- Gotcha: Line 39 of OWNER_CHECKS_phase4.md quotes the old es sessionExpired wording. File is append only, leave it.

## Problems noticed, not fixed
- If the food-log read and the logged-days read both fail while the day has rows, two notices stack.
- days and loading aliases in foodDays.ts can go once food.tsx and calendar.tsx use data and isLoading (calendar test mock returns only days).
- lookupBarcodeAsync (scan.ts:409) is unused apart from scanSeam.test.ts:521.
- English still hard-coded in Terms rest and formatNumber / units.ts:76 (en-AU).
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Users do not see which field the server rejected on a 4xx.
- Dev builds: a 404 matched by the mock records no scan_completed event (dev analytics only).
- Gotcha: the Row 2b note may drift again; check it at each records round.
- Row 2c reports ignored (not in brief).
- Checkpoint reports said 'Simulator flow not run'. Expected: no simulator check in Row 13 rounds.