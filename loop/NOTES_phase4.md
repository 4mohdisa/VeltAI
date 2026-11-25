# Lume Loop Notes: Phase 4

## Goal
Finish with no input from Isa. Progress = PHASE4_ROWS.md. Never ask Isa; park owner steps and carry on.

## Overrides (Isa, 25 Nov)
1. English only. Do not write, translate or review es or fr. Leave those files untouched. Missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. R12 writes leftovers to Parked. R15 sets BUILT (PARTIAL only if core broken).
3. Order: finish Row 2 and 2b, verify 2c and 2d, then 3 to 14b, 15 to 30, 31.
4. Rows 2c and 2d: verify, mark BUILT, replace placeholder rows with brief descriptions.

## State
- Branch loop/phase4. Export PATH first. Loop script commits.
- BUILT: 1, 2.2, 2.5, 12, 12b, 29. Phase 3 Rows 6, 13, 15 BUILT.
- Phase 3 Row 14: 14a, 14b, 14c done. Spoken meal label (nutrition.tsx ~231) stays English, no key (R263).
- Row 2b DIFFERENT (plan-ready summary parked for Isa).
- Last full checkpoint R242 (tsc 0, 275 suites, 1,673 tests). R265 checkpoint in progress (tsc and full jest --ci).

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states branch rule and forbids other git commands.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Animated: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- A round with no Jest run is not done.
- TestPG: localhost:5432, lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, api.ts listSessions defaults, src/__tests__/foodDays.test.ts (until approved).
- Locale files: src/lib/i18n/locales/. Nutrition screen: src/app/dashboard/nutrition.tsx.

## Decisions (never delete)
- Isa approved (25 Nov): plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000 (1,234 g, Isa to confirm).
- R123 formatDuration rounds total minutes first. R158 ConfidenceBadge uses scanCards.noBreakdown. R161 parity test at src/__tests__/localeParity.test.ts. R166 useGoals returns data, isLoading, error, refetch.
- R172 migration check skips exit 0 if variable unset. R174 CI local only. R176, R178 privacy manifest in app.json, camera-only prompt. R180 parity in full Jest. R182 Row 29 BUILT. R184, R186 migration apply test runs once in verify:migrations.
- R194 2b 1d does not wait for Isa. R195 to R205: 401 routes dispatch SESSION_ENDED. R199 renderScreen wrapped in AppStateProvider (approved).
- R209 to R212 onboarding keys nested, options under options.<value>. R225, R226 validateOnboardingPayload uses i18n. R228, R229 paywall 4xx toast uses onboarding.paywall.submitFailed except 401.
- R231, R235 CUISINE_LABEL and connectivityMessage removed. R233, R234 Terms disclaimer in legal.terms. R236 en-AU kept as formatNumber output.
- R240, R241 barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- R243 to R251 foodDays keeps dates, sets error on failure, clears on success. Calendar and Food tab read data only. One notice when both Food reads fail; food-log error wins.
- R254 14a over 14b. R255 gym.tsx literal over 14b. R256 14b over R249. R257 one component per prompt.
- useLoggedDays keeps own state (moving useHydration breaks hydrationErrorScreens.test.ts:34). Retry label stays 'Try again'.
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169, backend LIMIT kept. 1,000 sessions: rows 6,000 to 1,200; exercises query 1.4 to 2.1 ms down to 0.3 to 0.4 ms.
- R258, R260 Retry assertions changed from no Retry to Retry present (gymExerciseProgress.emptyStates, gymMuscles.render). Accepted, sign-off requested.
- R261 14c before early checkpoint. R262 14c workoutsLine needed no change.
- R263 Nutrition spoken label stays English. An en-only key fails localeParity and 13 typed tests. English-only override means no change needed. Row 14 BUILT once checkpoint green. Jev ask 84% not used (no questions).

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI green on GitHub.
- Simulator: 401 answers after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers (cold start, scroll, memory).
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing src/__tests__/foodDays.test.ts and removing days and loading aliases (R249). Blocked three times.
- Approve the R258 and R260 Retry assertion changes.
- Approve plan-ready summary (2b).

## Parked
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation. Calendar and Food error states in es and fr not checked.
- workoutsWeek.untimed_one and _other identical English. Harmless.
- eslint-disable in consent.ts and purchases.ts. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- Jest noise. Root config and backend JS not linted. verify:go has no -count=1.
- Dev only 'Simulate scan' and 'Unknown code' English literals. Food tab Try again reloads food log only. Two Food notices can stack if both reads fail (review).
- en.json duplicate gym keys (gym.monthSessions/monthFreezes vs gymCount.sessions/freezes): leave.
- PERF_BASELINE.md lines 34, 41 stale (gym read now limited).
- Hotspots: useHydration no freshness window; gym/history.tsx uses .map not FlatList; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Phase 3 Row 13 older text lists saved and translation items as open. R252 records checks.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).

## Loop note
- Jev advisory on ask (84%) and risk (1.9) noted. Kept run: the brief bans ask, and the only blocker is settled by the English-only override.
- Next: R265 checkpoint result, then Row 14 BUILT, then Row 2 BUILT, then verify 2c and 2d.
- Last round was flagged for tests not run. This round runs tsc and full jest --ci.