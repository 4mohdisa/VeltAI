# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b (plan-ready summary, Maestro flow), 3, 5 (5a closed, 5b open), 6b (app side of the gate).
- Checkpoint (read only): tsc 0 errors; Jest 288 suites, 1,736 tests, 4 snapshots pass. Go checkpoint before row 6 close: 49 packages, 770 tests, race clean.
- Route audit: 93 of 93 consumed; ROUTE_COVERAGE.md regenerated.
- App tests mock the API, so they cannot see the backend 402 gate. First real check is a sandbox run after 6b.

## Next
1. Row 6b, one module per prompt: (a) API client 402 reason and refunded status (in progress); (b) onboarding saves only after trial or purchase, dismissed paywall never saves; (c) 402 right after purchase retries until the webhook lands; (d) reason copy; (e) refresh after purchase; (f) STATUS.md:32 and test name TestLabel_WritesSessionRowForQuota.
2. Row 5b: consent screen, Settings switch, daily limit copy. Consent version 1.
3. Maestro onboarding flow for 2b and 23 once Maestro is confirmed.
4. Plan-ready summary: parked until Isa approves.
5. Row 3 remainder after Isa signs off.

## Rules
- One task per prompt: one module, screen or component, max 5 steps. Grep first. Name branch loop/phase4 and forbid switching.
- Only git command: git branch --show-current. Never push.
- Report wording: built, or checked by a test. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. AI tests live in backend/tests/ai.
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
- Duplicate gym keys gym.monthSessions and gym.monthFreezes kept.
- Exhaustive-deps: plain values computed in render, no disable. Reanimated SharedValue write keeps disable.
- Checkpoint round: read only, no file changes.
- Row 5 split: 5a backend and route gate; 5b app. Consent on profiles.ai_consent_at; GET/POST/DELETE /api/ai/consent; six AI routes gated. Consent read error stays 500 and still refused.
- Row 6 chosen over 5b: no owner dependency.
- Webhook secret from env only; if unset, webhook refuses events.
- No free tier: 7 day Apple trial gives every feature. Scan free allowance removed.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- REFUND_REVERSED restores state from event expiry. 402 gains reason field.
- Row 6b: onboarding answers stay on device until trial or purchase confirmed; dismissed paywall never calls save.
- Analytics and debug reports stay gated (Isa to review).
- Round choice: smallest Row 6b module first, because Jev rates clean completion at 40% and risk high.

## Blocked on Isa (park in OWNER_CHECKS_phase4.md; do not retry)
- Row 5a 500 vs 403 for consent read errors. E2E account needs 250+ gym dates (seed script). Prettier. App Store privacy label and data declaration. Push loop/phase4 and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line and Retry with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; R258 and R260 Retry assertions; app-wide 'Retry' vs 'Try again'; rename gym.monthSessions and gym.monthFreezes; appState.tsx:119 exhaustive-deps; goal change rule; training days device or backend field; plan-ready go-ahead; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public.
- Row 3: confirm Apple hidden on Android; native sheet or browser; owner steps 1 to 7. Parity line: Isa closes.
- es and fr text for goals.plan, preferences.food, onboarding.trainingDays (deferred).
- RevenueCat sandbox webhook setup (URL and Authorization in backend/.env only). Sandbox testers need a subscription for all features.
- Preview re-runs (about 400 ms); labels may shrink on narrow phones. Cuisine change adds no saved foods.

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts). mutations.ts and hooks.ts import cycle. measurements.tsx:118 heightToCm. paywall.tsx:81 unsafe cast.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; gym re-run timing; step number on screen.
- formatCurrency hard-codes A$. formatStreak(0) fr gives '0 jour'. Food search caches cuisine prefs 5 min. SettingsList has no disabled style.
- Nothing dispatches SIGNED_IN. Jest 'API unreachable' noise. Root config and backend JS not linted. verify:go lacks -count=1. Audit script always rewrites ROUTE_COVERAGE.md.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. rate_limit_counters may hold user ids in text keys. auth.ExportTableNames and account.UserTables overlap.
- Packages with no test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- Row 14 note in PHASE3_ROWS.md over 17,000 chars: trim later. Row 5b daily limit copy in English.
- Background AI sweep skipping users without consent: no test yet (pgstore.go join).
- RevenueCat events still ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- STATUS.md:32 still describes 3 free scans a day. TestLabel_WritesSessionRowForQuota keeps an old name for a quota that no longer exists.
- App tests mock the API and cannot see the 402 gate; sandbox run after 6b is the first real check.