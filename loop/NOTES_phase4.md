# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak row meets exit rule. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- Branch loop/phase4. Loop script commits.
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 12, 12b, 29 (9 of 38). EXACT: 0. PARTIAL: 2b, 3.
- Phase 3 rows 6, 13, 14, 15 BUILT.
- Last checkpoint: tsc 0; Jest 283 suites, 1,706 tests, 4 snapshots pass. TestPG 26 pass. Race green.
- exhaustive-deps: only appState.tsx:119 left (parked). Kept disables: SliderField:68, BottomSheet:95,103,134, gymSchedule.ts:78, debug/impl/index.tsx:99.

## Row 2b (PARTIAL)
- Done: step sweep, training days in onboarding store, goal and activity editable in goals.tsx, Eat healthier kept, goal round scope audit (clean).
- Open now: bodyFromOnboarding goal mapping to goalTypeOf (hooks.ts, one line, test).
- Open next: diet, cuisine, training days editable in src/app/profile (diet and cuisine need backend endpoint; POST /api/onboarding rewrites whole row).
- Plan-ready summary: parked until Isa approves design.
- Maestro: shared with row 23, not run.

## Rules
- One module per prompt, max 5 steps. Grep first. Branch rule, no git commands, report format.
- Report wording: built or checked by a test only. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. zsh: arrays or ${=var}. Name files fully after handover. Jev is advice only.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Training days not sent to plan (would overwrite activity level).
- Goal change replaces hand-set calorie target with recomputed one (Isa may change). Onboarding keeps original answers.
- eat_healthier maps to eat-better in derive.ts; derivation same as maintain.
- savePlan sends only body metrics from onboarding; activity-only save keeps stored goal.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json; camera-only prompt.
- Barcode failed state via lookupBarcodeResult (found, notFound, failed). Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure, clears on success. Food-log error wins when both fail.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays (13 screens).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169; backend LIMIT kept.
- Row 3: browser oauth_apple flow. Apple hidden on Android.
- Row 4: oauth_states cleared in profile store delete. Clerk first, then rows; Clerk failure 502 keeps rows. Clerk 404 counts as deleted.
- Duplicate gym keys: gym.monthSessions and gym.monthFreezes kept; other removed.
- Prompts covering more than one module are rewritten to one module.
- exhaustive-deps: plain values computed in render, no disable. Reanimated SharedValue write keeps disable.
- Checkpoint round: read only, full tsc and full app Jest.
- Goal and activity editing split from diet, cuisine and training days.
- Goal round scope audit: edits outside goal module must be needed by the goal change; unrelated edits reverted.

## Blocked on Isa (do not retry; park in OWNER_CHECKS_phase4.md)
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI on GitHub.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line and Retry with backend stopped.
- Approve removing lookupBarcodeAsync and scanSeam.test.ts:521.
- Approve foodDays.test.ts edit and removing days and loading aliases (R249).
- Approve R258 and R260 Retry assertion changes.
- Row 3: confirm Apple hidden on Android; native sheet or browser flow; owner steps 1 to 7.
- Parity line in OWNER_CHECKS_phase4.md reads open: Isa closes it.
- App-wide ErrorState 'Retry' vs 'Try again' (13 screens, 7 tests).
- Rename gym.monthSessions and gym.monthFreezes.
- appState.tsx:119 exhaustive-deps: recommend yes plus one render test.
- Approve goal change rule (replaces hand-set calorie target).
- Preview re-runs (about 400 ms) when an edit leaves params unchanged.
- Eat healthier label may shrink on narrow phones or large text: device look.

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts): merge only if no behaviour change.
- mutations.ts and hooks.ts import each other; move bodyFromOnboarding to mappers.ts.
- Missing tests: useEnergyBalance day refetch; BottomSheet open and close; ScanReviewCard weight-only refetch; gym re-run timing.
- measurements.tsx:118 changeHeightUnit calls heightToCm(); align later.
- Food tab Retry: verify in Row 30.
- formatCurrency hard-codes A$. formatStreak(0) fr gives '0 jour'.
- Nothing dispatches SIGNED_IN.
- Jest 'API unreachable' noise. Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- rate_limit_counters may hold user ids in text keys. auth.ExportTableNames and account.UserTables overlap.
- Row 14 note in PHASE3_ROWS.md over 17,000 chars: trim later.

## Next
1. Row 2b: bodyFromOnboarding goal mapping to goalTypeOf (in progress).
2. Row 2b: diet, cuisine, training days editable in src/app/profile.
3. Row 2b: plan-ready summary (parked until Isa approves design).
4. Row 3 remainder after Isa signs off.
5. Gym key rename only after Isa approves.
6. Next checkpoint: Go gates and lint; numbers in BASELINE_phase4.md.