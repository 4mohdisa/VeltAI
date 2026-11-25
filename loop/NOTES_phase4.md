# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT, soak row meets exit rule. Never ask. Park owner steps and carry on.

## Overrides (Isa)
1. English only. No es or fr writing or review. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- Branch loop/phase4. Loop script commits.
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 12, 12b, 29 (9 of 38). EXACT: 0. Row 3 PARTIAL. Row 2b DIFFERENT.
- Last full checkpoint: 282 suites, 1,704 tests, tsc 0, lint clean.
- Last round: tsc 0, changed render tests pass (subscriptionLinks 2, measurements 13, onboardingMeasurements 3, settingsDeleteAccount 9, foodTab.emptyStates 8, gymStreakSkeleton 2, gymStreakStripFootnote 2). Lint clean.
- TestPG: 26 pass on lume_test_local. Race green.
- Phase 3 Rows 6, 13, 14 BUILT. Row 14 simulator flow is in Row 23.
- Remaining exhaustive-deps disables: ParameterForm:141, BottomSheet:88, TodayCard:237, ScanReviewCard:118, energy.ts:37, appState.tsx:119 (owner question). Re-grep before touching.

## Rules
- One module per prompt, max 5 steps, grep first. Every prompt states the branch rule and forbids other git commands.
- Report wording: built or checked by a test. Never write verified.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints. Render tests are *.render.test.tsx.
- Animated: useState(() => new Animated.Value(x)).
- Backend: Go tests for changed packages; tests/regression and tests/migrations when ExportTableNames changes.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only.
- Disable rule: remove only when the fix changes no behaviour. Otherwise park and keep.
- Zsh: use arrays or ${=var}.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, api.ts listSessions defaults, or src/__tests__/foodDays.test.ts.
- Jev is advice only.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json; camera-only prompt.
- 2b 1d does not wait for Isa. Onboarding keys nested; options under options.<value>. en-AU kept as formatNumber output.
- Barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure, clears on success. Food-log error wins when both fail.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays (13 screens).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169; backend LIMIT kept.
- Row 3: browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto and a rebuild. Apple hidden on Android.
- Nutrition spoken label stays English, literal, no key.
- Row 4: oauth_states cleared in profile store delete, no migration. In auth.ExportTableNames. Child tables counted by parent ids before delete. Clerk first, then rows: Clerk failure returns 502 and keeps rows. Clerk 404 counts as deleted.
- Parity: English-only keys exempt via ENGLISH_ONLY with a reason. Delete text in en.json; failed delete shows plain fallback, never server text.
- Duplicate gym keys: gym.monthSessions and gym.monthFreezes kept; the other removed.
- Prompts covering more than one module are rewritten to one module.
- exhaustive-deps: compute plain values in render, depend on them, no disable. ParameterForm tells parent via a params effect after commit (tested).
- Reanimated SharedValue write: keep disable. Real missing dependency: fix unless behaviour changes (then park).
- A stale plan item (disable not present) is dropped, not added to Blocked.
- Jev asked for ask at 90%, 74% and 52%; kept run because the brief forbids ask.

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI on GitHub.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 Gym month line and Retry with backend stopped.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve foodDays.test.ts edit and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes. Approve plan-ready summary (2b).
- Row 3: confirm Apple hidden on Android; native sheet or browser flow; owner steps 1 to 7.
- Parity line in OWNER_CHECKS_phase4.md reads open: Isa closes it.
- App-wide ErrorState 'Retry' vs 'Try again' (13 screens, 7 tests).
- Rename gym.monthSessions and gym.monthFreezes (es and fr key moves).
- appState.tsx:119 exhaustive-deps: repeated identical batch would run again. Behaviour change; disable kept. Asked two rounds running; do not retry.
- Preview re-runs (about 400 ms) when an edit leaves params unchanged.

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts). Merge only if no behaviour change.
- No test that useEnergyBalance refetches only when the day changes.
- Food tab Retry: verify in Row 30.
- formatCurrency hard-codes A$. English literals in Terms, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked.
- signup.tsx:339, :362 placeholders are literals. Nothing dispatches SIGNED_IN.
- Disables kept: SliderField and BottomSheet Reanimated writes, gymSchedule.ts:78, src/debug/impl/index.tsx:99, three test files.
- Missing tests: BottomSheet open and close lifecycle (next candidate); ScanReviewCard weight-only change does not refetch; gym re-run timing.
- Jest 'API unreachable' noise. Root config and backend JS not linted. verify:go lacks -count=1.
- seedChildRows depends on exercise_library seed; local user 'lume' absent.
- 26 vs 28 TestPG pass lines: likely subtests, unconfirmed.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows in ScrollView; gym refetch on open; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- Older backend without total_days gives undefined tile.
- KNOWN_ISSUES.md Phase 3 wording; PERF_BASELINE.md lines 34, 41; PHASE4_ROWS.md 2.2 and 2b banned check word (Row 30).
- rate_limit_counters may hold user ids in text keys. auth.ExportTableNames and account.UserTables overlap (drift test exists).
- consent.ts and purchases.ts have no eslint-disable; earlier tasks aimed at wrong files.
- Row 14 note in PHASE3_ROWS.md over 17,000 characters: trim later (candidate).

## Next
1. Measurements Continue recompute (this round).
2. BottomSheet open and close lifecycle render test.
3. Lifecycle and weight-only render tests.
4. Row 3 remainder after Isa signs off.
5. Gym key rename only after Isa approves.

## Loop note
- Close partial flags before any new row. If tsc or tests were not run, run them first.
- Same blocker twice in a row: park it under Blocked and pick a surface that does not depend on it.
- Name files fully in every prompt after a handover.
- Prompts name one module, state the branch rule, and end with the report format.