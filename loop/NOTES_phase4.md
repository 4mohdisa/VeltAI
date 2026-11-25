# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 5 (5a closed, 5b open), 6b (steps a, b, c, d built; (c) recording in progress this round; steps e and f open).
- Checkpoint: tsc 0 errors; Jest 288 suites, 1,736 tests pass. Go: 49 packages, 770 tests, race clean.
- Route audit: 93 of 93 consumed.
- App tests mock the API, so they cannot see the 402 gate. First real check: sandbox run after 6b.

## Next
1. Row 6b step (c) bookkeeping (in progress this round).
2. Row 6b (e): refresh subscription state after purchase (paywall.tsx).
3. Returning user with no subscription: GET /api/onboarding gets 402 and goes back to onboarding without a reason message. Separate task after 6b (e).
4. Row 5b: consent screen, Settings switch, daily limit copy. Consent version 1.
5. Maestro onboarding flow (2b, 23) once Maestro is confirmed.
6. Plan-ready summary: parked until Isa approves.
7. Row 3 remainder after Isa signs off.

## Rules
- One task per prompt: one screen, file or component, max 5 steps. A prompt covering more is rejected. Grep first. Branch loop/phase4, no switching.
- Only git command: git branch --show-current. Never push.
- Report wording: built, or checked by a test. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- A report that skips a check is flagged. List each command run and its result.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. AI tests live in backend/tests/ai.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Training days stay on device. savePlan sends only body metrics. Goal and activity editing on goals row; diet, cuisine, training days on preferences.
- Row 6b: onboarding answers stay on device until trial or purchase confirmed; dismissed paywall never calls save.
- Row 6b (c): retry GET /api/subscription 4 times, 1.5 s apart, injectable timing.
- Row 6b (a, b, c, d, wording) recorded in the row; (c) and (d) recorded in the round after their build.
- Row 6 chosen over 5b: no owner dependency. Smallest 6b module first.
- Round after an incomplete report: Jev pick taken, since it closes the flagged gap before (e).
- Round after a rejected prompt (too many screens): rewritten to one file, doc only.
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
- Paywall error copy names no free tier and no later step in Settings.
- Loop note: prompts cover one screen, file or component, max 5 steps.

## Blocked on Isa (park in OWNER_CHECKS_phase4.md; do not retry)
- Row 5a 500 vs 403 consent read errors. E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; app-wide 'Retry' vs 'Try again'; rename gym.monthSessions and gym.monthFreezes; appState.tsx:119; goal change replaces hand-set calorie target; training days device or backend field; plan-ready go-ahead; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating; consent version needed.
- es and fr text for goals.plan, preferences.food, onboarding.trainingDays, onboarding.paywall.notConfirmed, onboarding.paywall.plansUnavailable, onboarding.paywall.storeError, and the six onboarding.paywall.refusal.* keys (deferred; do not retry).
- Terms text src/app/legal/terms.tsx:71 describes a free tier and scan allowance (legal copy).
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
- Returning user without subscription goes to onboarding (GET /api/onboarding gets 402) and shows no reason message. Dev builds with billing off need LUME_GATING_ENABLED=false.
- Sandbox webhook timing: the 4 x 1.5 s paywall budget is a guess; the two constants are the only thing to change.
- Restore purchases link shows profile.storeUnreachable; not checked for promises of later access.
- Terms legal copy at terms.tsx:71 stays parked for Isa.
- STATUS.md:32 and scanSeam.test.ts:450 describe free scans; TestLabel_WritesSessionRowForQuota keeps its old name.