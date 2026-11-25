# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b (plan-ready summary, Maestro flow), 3, 5 (5a closed, 5b open), 6b (step a done).
- Checkpoint: tsc 0 errors; Jest 288 suites, 1,736 tests pass. Go: 49 packages, 770 tests, race clean.
- Route audit: 93 of 93 consumed.
- App tests mock the API, so they cannot see the 402 gate. First real check: sandbox run after 6b.

## Next
1. Row 6b (b): onboarding saves only after trial or purchase; dismissed paywall never saves.
2. Row 6b (c): 402 right after purchase retries until the webhook lands.
3. Row 6b (d): reason copy per reason (English, ENGLISH_ONLY).
4. Row 6b (e): refresh after purchase.
5. Row 6b (f): stale message at scanSeam.test.ts:450, STATUS.md:32, test name TestLabel_WritesSessionRowForQuota.
6. Row 5b: consent screen, Settings switch, daily limit copy. Consent version 1.
7. Maestro onboarding flow (2b, 23) once Maestro is confirmed.
8. Plan-ready summary: parked until Isa approves.
9. Row 3 remainder after Isa signs off.

## Rules
- One task per prompt: one module, screen or component, max 5 steps. Grep first. Branch loop/phase4, no switching.
- Only git command: git branch --show-current. Never push.
- Report wording: built, or checked by a test. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. AI tests live in backend/tests/ai.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Training days stay on device. savePlan sends only body metrics. Goal and activity editing on goals row; diet, cuisine, training days on preferences.
- Row 6b: onboarding answers stay on device until trial or purchase confirmed; dismissed paywall never calls save.
- Row 6 chosen over 5b: no owner dependency. Smallest 6b module first.
- Webhook secret from env only; if unset, webhook refuses events.
- No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- REFUND_REVERSED restores state from event expiry. 402 gains reason field.
- Checkpoint round: read only, no file changes.
- Row 5 split: 5a backend and route gate; 5b app. Consent on profiles.ai_consent_at.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Row 6 (Phase 3): hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays.
- Migration check exits 0 if variable unset. CI local only. Privacy manifest in app.json.
- Exhaustive-deps: no disable except Reanimated SharedValue writes.
- Analytics and debug reports stay gated (Isa to review).

## Blocked on Isa (park in OWNER_CHECKS_phase4.md; do not retry)
- Row 5a 500 vs 403 consent read errors. E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; app-wide 'Retry' vs 'Try again'; rename gym.monthSessions and gym.monthFreezes; appState.tsx:119; goal change replaces hand-set calorie target; training days device or backend field; plan-ready go-ahead; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- es and fr text for goals.plan, preferences.food, onboarding.trainingDays (deferred).
- RevenueCat sandbox webhook setup (URL and Authorization in backend/.env only).

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts). mutations.ts and hooks.ts import cycle. measurements.tsx:118 heightToCm. paywall.tsx:81 unsafe cast.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; step number on screen.
- formatCurrency hard-codes A$. formatStreak(0) fr. Food search caches cuisine prefs 5 min. SettingsList no disabled style.
- Nothing dispatches SIGNED_IN. Root config and backend JS not linted. verify:go lacks -count=1. Audit script rewrites ROUTE_COVERAGE.md.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. auth.ExportTableNames and account.UserTables overlap.
- No test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Background AI sweep skipping no-consent users: no test. PHASE3_ROWS.md row 14 note over 17,000 chars: trim later.
- App tests cannot see the 402 gate; sandbox run after 6b is the first real check.