# Lume Loop Notes: Phase 4

## Goal
Finish the app with no input from Isa. Progress = PHASE4_ROWS.md.

## State
- Branch loop/phase4 only. Loop script commits. Never switch, push, merge, rebase or touch main.
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. First: export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH
- BUILT: 1, 12, 12b, 29.
- Row 2 PARTIAL. 2.2 BUILT. 2.5 BUILT (R239). Row 2 stays PARTIAL until Phase 3 Rows 6, 13, 14 are BUILT.
- Row 2b DIFFERENT: step 1d strings done (en, es, fr). Plan-ready screen parked for Isa's go-ahead.
- Current task (R240 rewritten): Phase 3 Row 13, barcode network error (barcode-scan.tsx + scan.ts only).
- Next after that: Row 13 calendar (foodDays.ts, calendar.tsx), then detail.tsx, then the Row 13 translations.
- Last full green checkpoint R237 (272 suites, 1,648 tests, tsc 0, lint clean).

## Order
- Now: Phase 3 Rows 13, then 6, then 14 (close open items). Then Row 2 to BUILT. Then 2b (plan-ready parked), 2d, 3 to 14b, 15 to 30, 31.
- Row 2c: not in the brief. Parked in OWNER_CHECKS. Reports asking for it are ignored.
- Trust this file over handovers and reports.
- One screen or component per prompt. Rejected prompts get rewritten to one screen, not split silently.

## Rules
- Max 5 steps per prompt. Grep before editing.
- Every prompt states the loop/phase4 branch rule and forbids other git commands.
- Lint: npx expo lint src scripts --max-warnings 0.
- No new eslint-disable. Animated values: useState(() => new Animated.Value(x)).
- i18n: keep import { use as addPlugin }. One full key per sentence. Plurals _one and _other only. Every new string in en, es, fr. Outside React: import i18n from '@/lib/i18n'.
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u.
- TestPG: localhost:5432, database lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.

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
- R176, R178: privacy manifest in app.json. Camera is the only prompt. check:manifest reads app.json.
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
- R237: full checkpoint run (green).
- R238: Jev said ask; brief forbids asking; run chosen.
- R239: English grams from 1,000 up group (1,234 g) per brief. Logged for Isa to confirm.
- R240: previous prompt rejected (multiple screens). Rewritten as one screen (barcode-scan.tsx, scan.ts as its data layer).

## Blocked on Isa (do not retry)
- es and fr wording review: onboarding, paywall, validation, sessionExpired, goals.loadFailed, Save food, kJ, energyTarget, noBreakdown, healthDisclaimer.text, paywall 4xx, Terms disclaimer.
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
- Simulator checks: answers survive a real Clerk expiry; signup, launch and paywall 401 routes; Total tile.

## Parked
- formatCurrency hard-codes A$ and a dot decimal in every language.
- Render tests in es and fr: Subscription, Gym tab, MacroTargetRows.
- legalParity.test.ts scans .tsx only; JSON legal text not covered by banned-claim scan.
- authMachine.test.ts names say 'copy' but no copy is tested (tidy round).
- consent.ts and purchases.ts use eslint-disable for the require rule.
- exhaustive-deps disable comments: appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders (signup.tsx:339, :362) are literals.
- Nothing dispatches SIGNED_IN, so the auth machine stays unknown or signedOut.
- Jest noise: i18next banner, devWarn, act warnings (Row 22).
- Root config and backend JavaScript not linted.
- Verify:go has no -count=1.

## Problems noticed, not fixed
- English still hard-coded in Terms rest and formatNumber / units.ts:76 (en-AU).
- formatStreak(0) in fr gives '0 jour'.
- Older backend without total_days gives undefined tile. Deploy backend with app (owner note).
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- getAnomalies and dismissAnomaly swallow errors on purpose (endpoint missing).
- Users do not see which field the server rejected on a 4xx.
- Gotcha: the Row 2b note may drift again; check it at each records round.
- Row 2 notes cell is long history. Trim at Row 2 BUILT.
- Row 2c reports ignored (not in brief).
- Gotcha: authMachine.test.ts and formatCurrency are parked; do not pick them up as Row 13 work.