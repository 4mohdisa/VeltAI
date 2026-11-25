# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak row meets exit rule. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 12, 12b, 29. PARTIAL: 2b, 3, 5 (5a backend built, test gap on query and morning brief being closed; 5b open).
- Phase 3 rows 6, 13, 14, 15 BUILT.
- Go checkpoint: 49 packages, 770 tests pass, race clean. Lint 0 findings.
- Frontend checkpoint: tsc 0; Jest 286 suites, 1,727 tests pass; 4 snapshots pass.
- 7 TestPG tests in tests/scan ran against lume_test_local and passed.
- Consent: requireScanConsent and requireAIConsent fail closed. Nil store or no consent gives 403 ai_consent_required. Read error gives 500.
- Route audit: 93 of 93 consumed. Two anomaly routes broken by design. ROUTE_COVERAGE.md regenerated; Isa decides commit or delete.
- 2b open: plan-ready summary (needs Isa go-ahead); Maestro flow shared with row 23, not run.
- exhaustive-deps: only appState.tsx:119 left (needs Isa).

## Next
1. Close row 5a test gap: table tests for POST /api/ai/query and GET /api/ai/morning-brief on consent read error (500, provider not called), no consent (403), consent granted.
2. Row 5b app consent screen, Settings switch, daily AI limits (getConsent, setConsent, revokeConsent in src/lib/api.ts).
3. Row 6 entitlements webhook with fixtures.
4. Maestro onboarding flow for 2b and 23 once Maestro is confirmed installed.
5. Row 2b plan-ready summary: parked until Isa approves.
6. Row 3 remainder after Isa signs off. Gym key rename only after Isa approves.

## Rules
- One module per prompt, max 5 steps. Grep first. Prompts name branch loop/phase4 and forbid switching.
- No git commands except git branch --show-current. Never push.
- Report wording: built or checked by a test only. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. Name files fully after handover.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sub sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Training days not sent to plan. Goal change replaces hand-set calorie target with recomputed one. Onboarding keeps original answers.
- eat_healthier maps to eat-better. savePlan sends only body metrics.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json; camera-only prompt.
- Barcode failed state via lookupBarcodeResult. Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure. Food-log error wins when both fail.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays (13 screens).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169; backend LIMIT kept.
- Row 3: browser oauth_apple flow. Apple hidden on Android.
- Row 4: oauth_states cleared in profile store delete. Clerk first, then rows; Clerk failure 502 keeps rows. Clerk 404 counts as deleted.
- Duplicate gym keys: gym.monthSessions and gym.monthFreezes kept; other removed.
- Exhaustive-deps: plain values computed in render, no disable. Reanimated SharedValue write keeps disable.
- Checkpoint round: read only, full tsc and full app Jest, no file changes (Go checkpoint may write BASELINE_phase4.md).
- Goal and activity editing split from diet, cuisine and training days.
- Training days stay on device; no backend field.
- Row 5 split: 5a backend store and route gate; 5b app consent screen, Settings switch, daily limits.
- 5a: consent on profiles.ai_consent_at; GET/POST/DELETE /api/ai/consent; all six AI routes gated. No new table.
- Consent read error stays 500 so a DB hiccup does not re-show consent to agreed users. Still refused.
- Consent version: parked in OWNER_CHECKS for Isa. Built without version until he decides.
- Round N: loop flag said last task partly done. Gap closed as the next task before 5b.

## Blocked on Isa (park in OWNER_CHECKS_phase4.md; do not retry)
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
- Goal change rule approval. Training days: device only or add a backend field.
- Go-ahead for plan-ready summary screen.
- Whether route audit runs in npm run verify. Whether to commit ROUTE_COVERAGE.md.
- Consent version; 500 vs 403 for consent read errors.
- Preview re-runs (about 400 ms) when an edit leaves params unchanged.
- Eat healthier and training days labels may shrink on narrow phones or large text.
- Cuisine change adds no saved foods for new cuisines (intentional; Isa may want it).
- Deferred: es and fr text for goals.plan, preferences.food, onboarding.trainingDays.

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts): merge only if no behaviour change.
- mutations.ts and hooks.ts import each other; move bodyFromOnboarding to mappers.ts.
- measurements.tsx:118 changeHeightUnit calls heightToCm(); align later.
- paywall.tsx:81 uses as unknown as Onboarding; type mismatch would go unnoticed.
- Missing tests: useEnergyBalance day refetch; BottomSheet lifecycle; ScanReviewCard weight-only refetch; gym re-run timing; step number on screen.
- Food tab Retry: verify in Row 30. formatCurrency hard-codes A$. formatStreak(0) fr gives '0 jour'.
- Food search ranking caches cuisine preferences up to 5 minutes.
- SettingsList has no disabled style: loading or failed rows only ignore taps.
- Nothing dispatches SIGNED_IN. Jest 'API unreachable' noise. Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- rate_limit_counters may hold user ids in text keys. auth.ExportTableNames and account.UserTables overlap.
- Audit script always rewrites ROUTE_COVERAGE.md; no skip option.
- Packages with no test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- Row 14 note in PHASE3_ROWS.md over 17,000 chars: trim later.
- Row 5b: daily limit error copy must be English and shown by the app.