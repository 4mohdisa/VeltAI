# Lume Loop Notes: Phase 4

## Goal
Finish with no input from Isa. Progress = PHASE4_ROWS.md. Never ask. Park owner steps and carry on.

## Overrides (Isa, 25 Nov)
1. English only. Do not write, translate or review es or fr. Leave those files untouched. Missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. R12 writes leftovers to Parked. R15 sets BUILT (PARTIAL only if core broken).
3. Order: Row 2b, then 3 to 14b, then 15 to 30, then 31.

## State
- Branch loop/phase4. Export PATH first. Loop script commits.
- BUILT (per PHASE4_ROWS.md, verify count): 1, 2.2, 2.5, 12, 12b, 29. Phase 3 Rows 6, 13, 14, 15 BUILT in PHASE3_ROWS.md (Row 14 status to confirm: 14b Retry done, 14c done, nutrition spoken label open).
- Row 2 PARTIAL until Phase 3 Row 14 is BUILT.
- Row 2b DIFFERENT (plan-ready summary parked for Isa).
- Row 3 PARTIAL: steps 1 to 3 done (AppleSignInButton, signup.tsx uses it, seven owner steps appended to OWNER_CHECKS_phase4.md). Owner checks pending.
- Checkpoint (after Apple button step): tsc 0 errors, 279 suites, 1,687 tests pass, 4 snapshots pass.
- Progress line in PHASE4_ROWS.md was stale; being fixed this round from table counts.

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
- Isa approved (25 Nov): plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000 (1,234 g, Isa to confirm).
- R123 formatDuration rounds total minutes first. R158 ConfidenceBadge uses scanCards.noBreakdown. R161 parity test at src/__tests__/localeParity.test.ts. R166 useGoals returns data, isLoading, error, refetch.
- R172 migration check exits 0 if variable unset. R174 CI local only. R176, R178 privacy manifest in app.json, camera-only prompt. R180 parity in full Jest. R182 Row 29 BUILT. R184, R186 migration apply test runs once in verify:migrations.
- R194 2b 1d does not wait for Isa. R195 to R205: 401 routes dispatch SESSION_ENDED. R199 renderScreen wrapped in AppStateProvider (approved).
- R209 to R212 onboarding keys nested, options under options.<value>. R225, R226 validateOnboardingPayload uses i18n. R228, R229 paywall 4xx toast uses onboarding.paywall.submitFailed except 401.
- R231, R235 CUISINE_LABEL and connectivityMessage removed. R233, R234 Terms disclaimer in legal.terms. R236 en-AU kept as formatNumber output.
- R240, R241 barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- R243 to R251 foodDays keeps dates, sets error on failure, clears on success. One notice when both Food reads fail; food-log error wins.
- R254 14a over 14b. R255 gym.tsx literal over 14b. R256 14b over R249. R257 one component per prompt.
- useLoggedDays keeps own state. Retry label stays 'Try again'.
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169, backend LIMIT kept. 1,000 sessions: rows 6,000 to 1,200; exercises query 1.4 to 2.1 ms down to 0.3 to 0.4 ms. Label 'R253' unconfirmed.
- R258, R260 Retry assertions changed (gymExerciseProgress.emptyStates, gymMuscles.render). Accepted, sign-off requested.
- R261 14c before early checkpoint. R262 14c workoutsLine needed no change.
- R263, R265 Nutrition spoken label stays English, literal, no key.
- R266 2c and 2d mapped from OWNER_CHECKS headings. Accepted.
- R267 Row 3 step 1 is AppleSignInButton only. Apple label: existing key, else English literal. Clerk hook chosen from node_modules.
- R268 Apple sign in uses browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto and rebuild. ios/ off limits.
- R268 AppleSignInButton hidden on Android. Revisit with owner checks.
- Row 3 step 3 (Apple owner steps) done. Row 3 bookkeeping (PARTIAL, progress line) done this round, chosen over housekeeping because the last report was flagged as partly done.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI green on GitHub.
- Simulator: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing foodDays.test.ts and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes.
- Approve plan-ready summary (2b).
- Row 3: confirm Apple hidden on Android (R268). Choose native Apple sheet or keep browser flow.
- Row 3 owner steps 1 to 7 in OWNER_CHECKS_phase4.md.
- Parity rule: should English-only keys be exempt from localeParity.test.ts? Literal kept for now.

## Parked
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation.
- workoutsWeek.untimed_one and _other identical English. Harmless.
- eslint-disable in consent.ts and purchases.ts. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- DevSignup in signup.tsx (dev only) still shows Apple on Android.
- Jest noise: '[data] API unreachable' warnings. Root config and backend JS not linted. verify:go has no -count=1.
- Dev only 'Simulate scan' and 'Unknown code' English literals. Food tab Try again reloads food log only when both reads fail.
- en.json duplicate keys gym.monthSessions and gym.monthFreezes vs gymCount.sessions and gymCount.freezes: leave.
- Hotspots: useHydration no freshness window; gym/history.tsx uses .map not FlatList; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- PERF_BASELINE.md lines 34 and 41 describe the gym read as unbounded (out of date).
- Nutrition spoken meal label (src/app/dashboard/nutrition.tsx:231) still open; English-only key blocked by parity rule.

## Housekeeping queue (before Row 4)
- PHASE4_ROWS.md progress line: done this round, recheck next round.
- 2c and 2d 'files likely touched' and 'test' cells: replace 'files from that commit' and 'tests for that work'.
- PERF_BASELINE.md lines 34 and 41: gym read now limited to 200.
- DevSignup Apple button in signup.tsx: use AppleSignInButton.
- Loop notes checkpoint line: 279 suites, 1,687 tests.

## Next
1. Row 3 bookkeeping (this round).
2. Housekeeping queue above.
3. Row 4 (account deletion).

## Loop note
- R267: prompt rejected for multiple components. Rewritten as one component.
- Jev R267: run 89%, confidence 0.83. Risk 1.1. Chose run, smaller task.
- R268: Jev run 89%. Chose run for smallest next step.
- Checkpoint round: Jev run 82%, risk 1.1. Chose run (read only).
- Flagged report (automatic check): the last report's NEXT step was not done. Chose a run to close it. Jev run 92%, risk 1.1. Ask not allowed.