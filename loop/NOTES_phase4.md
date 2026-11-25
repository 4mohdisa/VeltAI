# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak row exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b (plan-ready summary and Maestro flow open), 3, 5 (5a closed; 5b open), 6 (gate and webhook built; closing gaps this round).
- Go checkpoint: 49 packages, 770 tests, race clean. Lint 0.
- Frontend checkpoint: tsc 0; Jest 286 suites, 1,727 tests; 4 snapshots.
- TestPG: 7 in tests/scan and 11 webhook cases pass on lume_test_local.
- Route audit: 93 of 93 consumed; 2 anomaly routes broken by design. ROUTE_COVERAGE.md regenerated.

## Next
1. Row 6 close: no free scan allowance; public route review; REFUND_REVERSED; refused 402 reason.
2. Row 5b: consent screen, Settings switch, daily limits. Waits for Isa's consent version choice.
3. Maestro onboarding flow for 2b and 23 once Maestro is confirmed.
4. Plan-ready summary: parked until Isa approves.
5. Row 3 remainder after Isa signs off. Gym key rename after Isa approves.

## Rules
- One module per prompt, max 5 steps. Grep first. Prompts name branch loop/phase4 and forbid switching.
- Only git command: git branch --show-current. Never push.
- Report wording: built, or checked by a test. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only.
- AI tests live in backend/tests/ai.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Training days stay on device. Onboarding keeps original answers. eat_healthier maps to eat-better. savePlan sends only body metrics.
- Goal change replaces hand-set calorie target with recomputed one (pending Isa).
- Goal and activity editing split from diet, cuisine and training days.
- formatDuration rounds total minutes first. ConfidenceBadge uses scanCards.noBreakdown. useGoals returns data, isLoading, error, refetch.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json; camera-only prompt.
- Barcode failed state via lookupBarcodeResult. Dev builds fall back to mock database.
- foodDays keeps dates, sets error on failure. Food-log error wins when both fail.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays (13 screens).
- Row 6 (Phase 3): hydrateGym limit 200 at hooks.ts:169; backend LIMIT kept.
- Row 3: browser oauth_apple flow. Apple hidden on Android.
- Row 4: oauth_states cleared in profile store delete. Clerk first, then rows; Clerk failure 502 keeps rows. Clerk 404 counts as deleted.
- Duplicate gym keys: gym.monthSessions and gym.monthFreezes kept.
- Exhaustive-deps: plain values computed in render, no disable. Reanimated SharedValue write keeps disable.
- Checkpoint round: read only, full tsc and full app Jest, no file changes (Go checkpoint may write BASELINE_phase4.md).
- Row 5 split: 5a backend and route gate; 5b app. Consent on profiles.ai_consent_at; GET/POST/DELETE /api/ai/consent; six AI routes gated. Consent read error stays 500 and still refused.
- Row 6 chosen over 5b: no owner dependency.
- Webhook secret from env only; if unset, webhook refuses events.
- No free tier: 7 day Apple trial gives every feature. Scan free allowance removed (row 6 close).
- Public routes limited to auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback.
- REFUND_REVERSED restores state from event expiry. 402 gains reason field.

## Blocked on Isa (park in OWNER_CHECKS_phase4.md; do not retry)
- Row 5a closing check: 500 vs 403 for consent read errors; whether to add a consent version.
- E2E account needs 250+ gym dates: use seed script.
- Prettier. App Store privacy label and account data declaration.
- Push loop/phase4 and confirm CI on GitHub.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line and Retry with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit and removal of days and loading aliases; R258 and R260 Retry assertions.
- Row 3: confirm Apple hidden on Android; native sheet or browser; owner steps 1 to 7.
- Parity line in OWNER_CHECKS_phase4.md: Isa closes.
- App-wide ErrorState 'Retry' vs 'Try again'.
- Rename gym.monthSessions and gym.monthFreezes.
- appState.tsx:119 exhaustive-deps: recommend yes plus one render test.
- Goal change rule; training days device only or backend field.
- Go-ahead for plan-ready summary.
- Route audit in npm run verify? Commit ROUTE_COVERAGE.md?
- Preview re-runs (about 400 ms) on unchanged params. Eat healthier and training days labels may shrink on narrow phones.
- Cuisine change adds no saved foods for new cuisines.
- Deferred: es and fr text for goals.plan, preferences.food, onboarding.trainingDays.
- RevenueCat sandbox webhook setup (URL and Authorization in backend/.env only).

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts): merge only if no behaviour change.
- mutations.ts and hooks.ts import cycle; move bodyFromOnboarding to mappers.ts.
- measurements.tsx:118 heightToCm alignment. paywall.tsx:81 unsafe cast.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; gym re-run timing; step number on screen.
- formatCurrency hard-codes A$. formatStreak(0) fr gives '0 jour'.
- Food search ranking caches cuisine prefs 5 min. SettingsList has no disabled style.
- Nothing dispatches SIGNED_IN. Jest 'API unreachable' noise. Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- rate_limit_counters may hold user ids in text keys. auth.ExportTableNames and account.UserTables overlap.
- Audit script always rewrites ROUTE_COVERAGE.md.
- Packages with no test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- Row 14 note in PHASE3_ROWS.md over 17,000 chars: trim later.
- Row 5b: daily limit error copy must be English and shown by the app.
- Background AI sweep skipping users without consent: no test yet (pgstore.go join).
- Gate 402 does not distinguish refused reasons in app copy; app reads reason later.
- src/lib/api.ts:929 status comment lacks 'refunded'. Update in an app round.
- RevenueCat events still ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.