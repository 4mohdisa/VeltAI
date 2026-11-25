# Lume Loop Notes: Phase 4

## Goal
Finish with no input from Isa. Progress = PHASE4_ROWS.md. Never ask. Park owner steps and carry on.

## Overrides (Isa, 25 Nov)
1. English only. No es or fr writing, translating or review. Missing keys fall back to English. No language switcher.
2. Time box about 15 rounds per row. Leftovers go to Parked. BUILT at the time box (PARTIAL only if core is broken).
3. Order: 2b, then 3 to 14b, then 15 to 30, then 31.

## State
- Branch loop/phase4. Loop script commits.
- BUILT: 1, 2.2, 2c, 2d, 4, 12, 12b, 29. Progress 9 of 38 BUILT or EXACT, 0 EXACT.
- Last checkpoint (full Jest 282/1,704, tsc 0, lint clean) passed with no file changes.
- TestPG: 26 TestPG_ tests pass on lume_test_local. Race gate green.
- Row 2 PARTIAL until Phase 3 Row 14 is BUILT.
- Row 2b DIFFERENT (plan-ready summary parked for Isa).
- Row 3 PARTIAL: AppleSignInButton on signup and DevSignup (browser oauth_apple).
- Phase 3 Rows 6 and 13 BUILT. Row 14 PARTIAL: 14a, 14b Retry, 14c done.
- Row 4 delete account BUILT. subscriptionLinks.ts isManageSubscriptionAvailable() is the only Platform.OS check.

## Rules
- One screen or component per prompt. Max 5 steps. Grep before editing.
- Every prompt states the branch rule and forbids other git commands.
- Report wording: 'built' or 'checked by a test' only.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Animated: useState(() => new Animated.Value(x)).
- Render tests *.render.test.tsx. Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- App rounds: Jest and type check. Backend: Go tests for changed packages, plus tests/regression and tests/migrations when ExportTableNames changes.
- TestPG: localhost:5432, lume_test_local, Mac's own Postgres login (whoami, no password). LUME_TEST_DATABASE_URL for one command only. Never print the URL.
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
- Row 3: browser oauth_apple flow. Native sheet needs expo-apple-authentication, expo-crypto, rebuild. Apple hidden on Android. DevSignup uses AppleSignInButton (accepted).
- Nutrition spoken label stays English, literal, no key.
- Row 4: oauth_states cleared in profile store delete, no migration. In auth.ExportTableNames. Child tables counted by parent ids before delete. Clerk first, then rows: Clerk failure returns 502 and keeps rows. Clerk 404 counts as deleted.
- Parity: English-only keys exempt via ENGLISH_ONLY with a reason (25 Nov).
- Delete screen text in en.json. Failed delete shows plain fallback text, never server text.
- Subscription screen follows the delete screen: same helper, one copy of the URL.
- Duplicate gym keys: one key per meaning kept; other removed from en.json, and from es/fr as a key deletion only.
- Checkpoint rounds change no files; red gates are fixed in the next round.
- Jev 'ask' overruled when the brief forbids ask.
- Rejected prompts (more than one module) are rewritten to one module.
- purchases.ts 'remove eslint-disable' item dropped: no disable exists (checked twice).

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
- Parity line in OWNER_CHECKS_phase4.md reads open: Isa closes it himself (append only).
- App wide ErrorState default 'Retry' vs 'Try again': 13 screens, 7 tests. Needs Isa's call.
- Rename gym.monthSessions and gym.monthFreezes to gym.sessionCount and gym.freezeCount in en, es, fr. Needs es/fr key moves approved. Do not retry.

## Parked
- Food tab Retry reloads only the food log.
- formatCurrency hard-codes A$. English hard-coded in Terms rest, formatNumber, units.ts:76. formatStreak(0) fr gives '0 jour'.
- es and fr render tests parked until Isa restarts localisation.
- Signup placeholders signup.tsx:339 and :362 literals. Nothing dispatches SIGNED_IN.
- exhaustive-deps disables left: appState.tsx:119, gymSchedule.ts:78, energy.ts:37, BottomSheet.tsx:88, TodayCard.tsx:237, ParameterForm.tsx:141, ScanReviewCard.tsx:118.
- Deliberate disables to keep: SliderField.tsx and BottomSheet.tsx (Reanimated SharedValue writes, reasons written next to them), src/debug/impl/index.tsx:99 (optional require in a test build tool). Three test files also have disables.
- Jest noise: 'API unreachable' warnings. Root config and backend JS not linted. verify:go has no -count=1.
- seedChildRows uses the first exercise_library row. Local user 'lume' does not exist; use the Mac's Postgres login for the test URL.
- 26 vs 28 TestPG pass lines: extra 2 likely subtests, not confirmed.
- Hotspots: useHydration no freshness window; gym/history.tsx maps up to 200 rows in a ScrollView; gym screens refetch on every open; 49 queries use id::text = $1; gym/schedule_pg.go oldest first then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. 4xx field not shown to user.
- Older backend without total_days gives undefined tile. Deploy backend with app.
- KNOWN_ISSUES.md Backend section has Phase 3 wording (Row 30). PERF_BASELINE.md lines 34 and 41 describe gym read as unbounded (Row 19).
- PHASE4_ROWS.md 2.2 and 2b notes use a banned check word (fix in Row 30).
- rate_limit_counters may hold user ids in text keys.
- auth.ExportTableNames and account.UserTables overlap (drift test added).
- The delete screen test has a redundant openURL.mockRestore().
- Gym screens: no test covers the re-run timing after the gym.tsx dependency change.

## Next
1. Remove exhaustive-deps disable in src/app/onboarding/measurements.tsx (in progress).
2. Remove exhaustive-deps disables in BottomSheet.tsx:88 and TodayCard.tsx:237, one per round.
3. Phase 3 Row 14 remainder, so Row 2 can close.
4. Row 3 remainder (Sign in with Apple) once Isa's sign-off is in.
5. Gym key rename only after Isa approves.

## Loop note
- Jev signals are advice only. Smaller tasks when the last task was partial or Jev's clean-finish chance is low.
- Loop flags of partial work are closed before any new row starts.
- A loop flag that a type check or test was not run: the next round runs tsc and the related Jest files before anything else.
- Checkpoint rounds change no files; any red gate is reported and fixed in the next round.
- One module per prompt. Mention of Jev is never put in a Claude Code prompt.
- A stale plan item (a disable that does not exist) is dropped in Decisions, not added to Blocked on Isa.
- Last round (gym.tsx) removed a disable and changed one dependency array; no test covers the re-run timing.