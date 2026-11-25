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
- Row 3 PARTIAL: AppleSignInButton on signup and DevSignup, browser oauth_apple. Owner steps 1 to 7 in OWNER_CHECKS_phase4.md.
- Row 4 PARTIAL. Step 1 done (account/tables.go, 29 entries). Step 2 done (profile delete clears oauth_states and profiles). Step 3a done in code (oauth_states in auth.ExportTableNames, drift test TestExportCoversEveryAccountUserTable). Settings delete screen covered by settingsDeleteAccount.render.test.tsx.
- Phase 3 Row 6 and 13 BUILT. Row 14 PARTIAL: 14a, 14b Retry, 14c done. Nutrition spoken label open (blocked).
- Row 6 label 'R253' still unconfirmed.
- Last full checkpoint in notes: tsc 0 errors, 280 suites, 1,689 tests pass. Handover says 275 suites and 1,673 tests before R257 to R260. Settle at next checkpoint.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the branch rule and forbids other git commands.
- Report wording: 'built' or 'checked by a test'. Never 'verified' (Isa verifies).
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Animated: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- A round with no Jest run is not done (app rounds). Backend rounds: Go tests for changed packages, including tests/regression and tests/migrations when ExportTableNames changes.
- TestPG: localhost:5432, lume_test_local. Never print the URL.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, api.ts listSessions defaults, src/__tests__/foodDays.test.ts (until approved).
- Take round numbers from these notes only. Never guess them.
- Status words DIFFERENT, PARTIAL, BUILT, EXACT only in the status column.

## Decisions (never delete)
- Isa approved: plan-ready summary; training days and gain or maintain goal in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. Parity test at src/__tests__/localeParity.test.ts. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json, camera-only prompt. Parity runs in full Jest. Migration apply test runs once in verify:migrations.
- 2b 1d does not wait for Isa. 401 routes dispatch SESSION_ENDED. renderScreen wrapped in AppStateProvider (approved).
- Onboarding keys nested, options under options.<value>. validateOnboardingPayload uses i18n.
- CUISINE_LABEL and connectivityMessage removed. en-AU kept as formatNumber output.
- Barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure, clears on success. Food-log error wins when both reads fail.
- 14a over 14b. 14b over R249 mapping. One component per prompt.
- Retry label stays 'Try again' (common.tryAgain).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169, backend LIMIT kept.
- Retry assertions changed in gymExerciseProgress.emptyStates and gymMuscles.render. Accepted, sign-off requested.
- Row 3: browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto and rebuild. ios/ off limits. Apple hidden on Android.
- DevSignup Apple button uses AppleSignInButton. Accepted.
- Nutrition spoken label stays English, literal, no key.
- Row 4 step 1 chosen over signup platform pin: Jev 87%.
- Row 4 step 2: oauth_states cleared in the profile store delete (one statement), not a migration (smallest change, no schema change).
- Settings delete check chosen over signupDevFallback pin: Jev 99% run.
- signupDevFallback platform pin done (iOS). Row 4 wording corrected to 'built'.
- Row 4 export: oauth_states added to auth.ExportTableNames (step 3a), chosen over seeding (Jev 91% run). Export and deletion lists kept separate; drift test keeps them in step.
- Regression and migrations packages run before new work after step 3a (Jev run 97%, last task clean 47%, so a small task).

## Blocked on Isa (do not retry)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI green on GitHub.
- Simulator: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve editing foodDays.test.ts and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes.
- Approve plan-ready summary (2b).
- Row 3: confirm Apple hidden on Android. Choose native Apple sheet or keep browser flow. Owner steps 1 to 7 in OWNER_CHECKS_phase4.md.
- Parity rule: should English-only keys be exempt from localeParity.test.ts? Blocks the nutrition spoken label (nutrition.tsx:231). Do not retry until Isa decides.

## Parked
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation.
- Settings delete screen text is written into the file, not i18n keys (accepted under English-only). On 502 the delete screen shows the raw server message.
- eslint-disable in consent.ts and purchases.ts. exhaustive-deps disables at appState.tsx:114, gymSchedule.ts:78, energy.ts:37, measurements.tsx.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- Jest noise: '[data] API unreachable' warnings. Root config and backend JS not linted. verify:go has no -count=1.
- Food tab Try again reloads food log only when both reads fail.
- en.json duplicate keys gym.monthSessions/gym.monthFreezes vs gymCount.sessions/freezes: leave.
- Hotspots: useHydration no freshness window; gym/history.tsx maps up to 200 rows in a ScrollView; gym screens refetch on every open; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30).
- PERF_BASELINE.md lines 34 and 41 describe gym read as unbounded: out of date, fix in Row 19.
- Row 4 seed coverage: Postgres delete test seeds 5 of 29 tables; the other 24 only check zero rows. Seed each table (Row 4 step 3b).
- rate_limit_counters may hold user ids in text keys (swept in minutes, not listed).
- Lists to keep in step: auth.ExportTableNames and account.UserTables overlap (drift test added).

## Next
1. Run go test -count=1 for ./tests/regression and ./tests/migrations (set LUME_TEST_DATABASE_URL per command, never print it). Fix failures. Record Row 4 step 3a in PHASE4_ROWS.md (this round).
2. Row 4 step 3b: seed all UserTables in the Postgres delete test.
3. Fix 'verified' wording in PHASE4_ROWS.md rows 2.2 and 2b.
4. Full checkpoint after the next batch of changes. Confirm the round number from these notes before recording it.

## Loop note
- Last report did not run tests/regression and tests/migrations: the loop check flagged it. Fixed by Next 1.
- Same blocker twice: nutrition spoken label (parity rule). Recorded under Blocked, not retried.
- Latest handover round references (R265 checkpoint) are not in these notes: do not use them until confirmed.
- Jev signals used as advice only. Smaller tasks chosen when the last task was partial.
- Automatic check flagged 'verified' wording in a report. Fixed in Row 4 notes and Rules.