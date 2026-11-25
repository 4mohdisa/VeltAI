# Lume Loop Notes: Phase 4

Goal: every PHASE4_ROWS.md row BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. No es or fr work. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 5 (5a closed, 5b open), 6b (steps a to e built; launch gate 401 and 402 tests pass; gate file is src/app/index.tsx; step f open).
- Last full run: tsc 0; Jest 289 suites, 1,759 tests. Go 49 packages, 770 tests, race clean.
- Route audit: 93 of 93 consumed.
- App tests mock the API, so the 402 gate is untested end to end in the app.

## Next
1. Row 6b: verify the last report's launch gate claim (in progress; lint and tsc on touched files).
2. Row 6b: send a user to the paywall with the reason when a 402 arrives mid session (needs a routing decision if the plan ends while the app is open).
3. Row 6b (f): English free-tier wording in plansUnavailable and storeError.
4. Row 5b: consent screen, Settings switch, daily limit copy. Consent version 1 (approval pending).
5. Maestro onboarding flow (2b, 23) once Maestro is confirmed.
6. Plan-ready summary: parked until Isa approves.
7. Row 3 remainder after Isa signs off.

## Rules
- One task per prompt, one screen or component per prompt, max 5 steps. Find files with find first (grep -rl matches contents, not names).
- Only git command: git branch --show-current. Never push, merge or switch.
- Report wording: built, or checked by a test. Never 'verified'.
- A report that skips a check is flagged; next round verifies it first.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. AI tests live in backend/tests/ai.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart, injectable timing. Confirmed purchase writes status to settings store.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding, or opens tabs if completion flag set. Gate file is src/app/index.tsx.
- paywallHref(reason?) in src/lib/nav.ts: optional reason, so a 402 with no reason keeps the plain link. The link is built in one place only.
- REFUND_REVERSED restores state from event expiry. 402 has a reason field. Billing issue keeps access through grace.
- No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 5: 5a backend and route gate; 5b app. Consent on profiles.ai_consent_at. Consent read error stays 500.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Row 6 (Phase 3): hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays.
- Webhook secret from env only; unset means refuse events.
- Checkpoint round: read only.
- Incomplete report with loop flag: verify first. Without flag: Jev pick.
- Round 2 rejection (multi-screen prompt): keep each prompt to one screen or component.

## Blocked on Isa (park, do not retry)
- Row 5a 500 vs 403 read errors. E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; 'Retry' vs 'Try again'; rename gym.monthSessions and gym.monthFreezes; appState.tsx:119; goal change replaces hand-set calorie target; training days device or backend; plan-ready go-ahead; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating; consent version.
- Launch wait for returning users (every launch calls GET /api/onboarding): confirm on device and slow connection. In OWNER_CHECKS_phase4.md.
- Returning user with answers missing from phone: can buy but cannot finish. In OWNER_CHECKS_phase4.md.
- Terms copy src/app/legal/terms.tsx:71 describes a free tier (legal copy).
- RevenueCat sandbox webhook setup (URL and Authorization in backend/.env only).
- es and fr text (deferred; English only per Isa).

## Parked
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts. measurements.tsx:118 heightToCm. paywall.tsx:81 unsafe cast.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; paywallHref unit test in nav.ts (only screen tests cover it now).
- formatCurrency hard-codes A$. formatStreak(0) fr. SettingsList no disabled style.
- Nothing dispatches SIGNED_IN. Root config and backend JS not linted. verify:go lacks -count=1. Audit script rewrites ROUTE_COVERAGE.md.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. auth.ExportTableNames and account.UserTables overlap.
- No test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Background AI sweep skipping no-consent users: no test.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Sandbox webhook timing: 4 x 1.5 s is a guess.
- Restore purchases link shows profile.storeUnreachable; not checked for promises of later access.
- STATUS.md:32 and scanSeam.test.ts:450 describe free scans; TestLabel_WritesSessionRowForQuota keeps its old name.
- A returning user without a subscription goes back to onboarding (GET /api/onboarding gets 402).
- A plan that ends while the app is open meets 402s in the tabs with no paywall. Needs a routing decision.
- es and fr still describe a free tier (plansUnavailable, storeError); no es or fr text for onboarding.paywall.refusal.* or notConfirmed.
- Dev and PHASE3_ROWS.md row 14 note too long.