# Lume Loop Notes: Phase 4

## Goal
Finish with no input from Isa. Progress = PHASE4_ROWS.md. Never ask. Park owner steps and carry on.

## Overrides (Isa, 25 Nov)
1. English only. Do not write, translate or review es or fr. Leave those files untouched. Missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. Leftovers go to Parked at the time box. BUILT at the time box (PARTIAL only if core is broken).
3. Order: Row 2b, then 3 to 14b, then 15 to 30, then 31.

## State
- Branch loop/phase4. Export PATH first. Loop script commits.
- BUILT (PHASE4_ROWS.md): 1, 2.2, 2c, 2d, 12, 12b, 29. Progress: 8 of 38 BUILT, 0 EXACT.
- Row 2 PARTIAL until Phase 3 Row 14 is BUILT.
- Row 2b DIFFERENT (plan-ready summary parked for Isa).
- Row 3 PARTIAL: AppleSignInButton, signup.tsx uses it, DevSignup Apple button uses it too (hidden on Android), browser OAuth (oauth_apple). Seven owner steps in OWNER_CHECKS_phase4.md.
- Phase 3 Row 6 and 13 BUILT. Row 14 PARTIAL: 14b Retry done, 14c done, nutrition spoken label open (blocked, see below).
- Last full checkpoint (26 Nov 2026, after the DevSignup Apple change): tsc 0 errors, 280 suites, 1,689 tests pass, 0 failed, 4 snapshots pass.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the branch rule and forbids other git commands.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Animated: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- A round with no Jest run is not done.
- TestPG: localhost:5432, lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, api.ts listSessions defaults, src/__tests__/foodDays.test.ts (until approved).
- Take round numbers from these notes only. Never guess them.
- Status words DIFFERENT, PARTIAL, BUILT, EXACT only in the status column.

## Decisions (never delete)
- Isa approved: plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000 (1,234 g, Isa to confirm).
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. Parity test at src/__tests__/localeParity.test.ts. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json, camera-only prompt. Parity runs in full Jest. Row 29 BUILT. Migration apply test runs once in verify:migrations.
- 2b 1d does not wait for Isa. 401 routes dispatch SESSION_ENDED. renderScreen wrapped in AppStateProvider (approved).
- Onboarding keys nested, options under options.<value>. validateOnboardingPayload uses i18n. Paywall 4xx toast uses onboarding.paywall.submitFailed except 401.
- CUISINE_LABEL and connectivityMessage removed. Terms disclaimer in legal.terms. en-AU kept as formatNumber output.
- Barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure, clears on success. One notice when both Food reads fail; food-log error wins.
- 14a over 14b. gym.tsx literal over 14b. 14b over R249 mapping. One component per prompt.
- useLoggedDays keeps own state. Retry label stays 'Try again' (common.tryAgain).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169, backend LIMIT kept. Label 'R253' unconfirmed.
- Retry assertions changed in gymExerciseProgress.emptyStates and gymMuscles.render. Accepted, sign-off requested.
- 14c before early checkpoint. workoutsLine needed no change.
- Nutrition spoken label stays English, literal, no key.
- 2c and 2d mapped from OWNER_CHECKS headings. Accepted.
- Row 3 step 1 is AppleSignInButton only. Apple label: existing key, else English literal.
- Apple sign in uses browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto and rebuild. ios/ off limits. Button hidden on Android, revisit with owner checks.
- DevSignup Apple button now uses AppleSignInButton (same next handler). Accepted.
- Removed the Row 2.5 reference: no such row exists.
- Checkpoint chosen over Row 4 step 1 this round: the handover and last report name it as due, and it may catch regressions from the DevSignup change. Jev run 77%.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI green on GitHub.
- Simulator: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing foodDays.test.ts and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes.
- Approve plan-ready summary (2b).
- Row 3: confirm Apple hidden on Android (signup and DevSignup). Choose native Apple sheet or keep browser flow.
- Row 3 owner steps 1 to 7 in OWNER_CHECKS_phase4.md.
- Parity rule: should English-only keys be exempt from localeParity.test.ts? Nutrition spoken meal label (nutrition.tsx:231) is blocked by this. Do not retry until Isa decides.

## Parked
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation.
- workoutsWeek.untimed_one and _other identical English. Harmless.
- eslint-disable in consent.ts and purchases.ts. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- signupDevFallback.render.test.tsx does not set the platform; passes only because setup reports iOS. Pin it next.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- Jest noise: '[data] API unreachable' warnings. Root config and backend JS not linted. verify:go has no -count=1.
- Dev only 'Simulate scan' and 'Unknown code' English literals. Food tab Try again reloads food log only when both reads fail.
- en.json duplicate keys gym.monthSessions and gym.monthFreezes vs gymCount.sessions and gymCount.freezes: leave.
- Hotspots: useHydration no freshness window; gym/history.tsx maps up to 200 rows in a ScrollView (not FlatList); gym screens refetch on every open; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- PERF_BASELINE.md lines 34 and 41 describe gym read as unbounded: out of date, fix in Row 19.

## Next
1. Full Jest checkpoint (this round).
2. Row 4 step 1: backend table coverage test for account deletion.
3. Pin platform in signupDevFallback.render.test.tsx.

## Housekeeping queue
- Update the checkpoint line after the full run.

## Loop note
- Same blocker twice: nutrition spoken label (parity rule). Recorded under Blocked, not retried. Pick surfaces that do not depend on it.
- Jev signals used as advice only. Smaller tasks chosen when the last task was partial.