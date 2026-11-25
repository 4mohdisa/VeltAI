# Lume Loop Notes: Phase 4

## Goal
Finish with no input from Isa. Progress = PHASE4_ROWS.md. Never ask. Park owner steps and carry on.

## Overrides (Isa, 25 Nov)
1. English only. Do not write, translate or review es or fr. Leave those files untouched. Missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. Leftovers go to Parked at the time box. BUILT at the time box (PARTIAL only if core is broken).
3. Order: Row 2b, then 3 to 14b, then 15 to 30, then 31.

## State
- Branch loop/phase4. Export PATH first. Loop script commits.
- BUILT: 1, 2.2, 2c, 2d, 4, 12, 12b, 29. Progress: 9 of 38 BUILT or EXACT, 0 EXACT.
- Row 2 PARTIAL until Phase 3 Row 14 is BUILT.
- Row 2b DIFFERENT (plan-ready summary parked for Isa).
- Row 3 PARTIAL: AppleSignInButton on signup and DevSignup (browser oauth_apple). Owner steps 1 to 7 in OWNER_CHECKS_phase4.md.
- Row 4 BUILT. Checkpoint green: tsc 0, Jest 281 suites and 1,698 tests, Go regression, migrations, account, auth ok.
- Phase 3 Rows 6 and 13 BUILT. Row 14 PARTIAL: 14a, 14b Retry, 14c done.
- Subscription Manage button now iOS only (done, 8 tests pass).

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the branch rule and forbids other git commands.
- Report wording: 'built' or 'checked by a test'. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Animated: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- App rounds need a Jest run and a type check. Backend rounds: Go tests for changed packages, plus tests/regression and tests/migrations when ExportTableNames changes.
- TestPG: localhost:5432, lume_test_local, set LUME_TEST_DATABASE_URL for one command only. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, api.ts listSessions defaults, src/__tests__/foodDays.test.ts (until approved).
- Status words DIFFERENT, PARTIAL, BUILT, EXACT only in the status column.

## Decisions (never delete)
- Isa approved: plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json, camera-only prompt.
- 2b 1d does not wait for Isa. 401 routes dispatch SESSION_ENDED. renderScreen wrapped in AppStateProvider (approved).
- Onboarding keys nested, options under options.<value>. en-AU kept as formatNumber output.
- Barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure, clears on success. Food-log error wins when both reads fail.
- 14a over 14b. 14b over R249 mapping. Retry label stays 'Try again' (common.tryAgain).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169, backend LIMIT kept.
- Retry assertions changed in gymExerciseProgress.emptyStates and gymMuscles.render. Accepted, sign-off requested.
- Row 3: browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto and rebuild. Apple hidden on Android. DevSignup Apple button uses AppleSignInButton (accepted).
- Nutrition spoken label stays English, literal, no key.
- Row 4: oauth_states cleared in profile store delete, no migration. oauth_states in auth.ExportTableNames. Child tables counted by parent ids before delete.
- Row 4 identity first (Clerk, then rows) accepted: a Clerk failure returns 502 and keeps rows, so retry is safe. A Clerk 404 counts as deleted.
- Parity rule (25 Nov): English-only keys exempt from localeParity.test.ts through one named list (ENGLISH_ONLY) with a reason.
- Delete screen text in en.json. Failed delete shows plain fallback text for every failure, never server text.
- Jev 'ask' overruled when the brief forbids ask.
- Checkpoint round rule: no file changes; gates reported, fixes in next round.
- Subscription screen follows the delete screen: same helper, one copy of the URL (done).

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI green on GitHub.
- Simulator: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing foodDays.test.ts and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes.
- Approve plan-ready summary (2b).
- Row 3: confirm Apple hidden on Android. Choose native sheet or keep browser flow. Owner steps 1 to 7.
- Parity line in OWNER_CHECKS_phase4.md is answered by the 25 Nov override; Isa to close it himself (append only).

## Parked
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- eslint-disable in consent.ts and purchases.ts. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Jest noise: 'API unreachable' warnings. Root config and backend JS not linted. verify:go has no -count=1.
- Inline Platform.OS === 'ios' checks in delete-account.tsx, AppleSignInButton and subscription.tsx: move into one export in subscriptionLinks.ts (later round).
- Duplicate keys gym.monthSessions/gym.monthFreezes vs gymCount.sessions/freezes: leave until cleanup round.
- Redundant openURL.mockRestore() in delete screen test; left alone.
- seedChildRows uses the first exercise_library row. Local DATABASE_URL user 'lume' does not exist locally; use the Mac's Postgres login for the test URL.
- Hotspots: useHydration no freshness window; gym/history.tsx maps up to 200 rows in a ScrollView; gym screens refetch on every open; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30). PERF_BASELINE.md lines 34 and 41 describe gym read as unbounded (Row 19).
- PHASE4_ROWS.md 2.2 and 2b notes use 'verified' (fix in Row 30).
- rate_limit_counters may hold user ids in text keys.
- auth.ExportTableNames and account.UserTables overlap (drift test added).

## Next
1. Food tab Try again reloads both reads (this round).
2. Move Platform.OS checks into subscriptionLinks.ts export.
3. Duplicate gym keys cleanup.
4. Phase 3 Row 14 remainder, so Row 2 can close.

## Loop note
- Jev signals are advice only. Smaller tasks chosen when the last task was partial or Jev's clean-finish chance is low.
- Loop flags of partial work are closed before any new row starts.
- Checkpoint rounds change no files; any red gate is reported and fixed in the next round.
- One screen per prompt. Rejected prompts are rewritten to a single screen.