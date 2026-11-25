# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken). Leftovers to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 5 (5a closed, 5b open), 6b (steps a to e built; f parked).
- Last checkpoint: tsc 0, Jest 292 suites, 1,774 tests, all pass. Route audit 93 of 93.

## Next (one screen per round)
1. DONE: ai-query.tsx opens ai-consent.tsx (replace/navigate per screen type).
2. DONE: insights.tsx uses replace('/ai-consent') (no-input screen; Isa to confirm).
3. IN PROGRESS: food/photo-capture.tsx, same wiring as ai-query.
4. food/label-scan.tsx: same wiring (navigate, button press).
5. Row 5b: withdraw switch in Settings, then daily limit copy.
6. Maestro onboarding flow (2b, 23) once Maestro is confirmed.
7. Row 3 remainder after Isa signs off.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge or switch.
- Every prompt states the branch rule first.
- One task per prompt, one screen or component per prompt, max 5 steps. Find files with find (grep -rl matches contents).
- Report wording: built, or checked by a test. Never 'verified'.
- A report that skips a check is flagged; next round verifies it first.
- A blocker that repeats twice goes to Blocked on Isa and is not retried.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only. AI tests live in backend/tests/ai.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart (a guess). Confirmed purchase writes status to settings store.
- Launch gate is src/app/index.tsx: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding, or opens tabs if completion flag set. src/app/onboarding/index.tsx is the Welcome screen.
- GET /api/subscription is public and never returns 402; the gate checks GET /api/onboarding.
- paywallHref(reason?) in src/lib/nav.ts is the only place the paywall link is built.
- REFUND_REVERSED restores state from event expiry. 402 has a reason field. Billing issue keeps access through grace.
- No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 5: 5a backend and route gate; 5b app. Consent on profiles.ai_consent_at. Consent read error stays 500. Consent version 1 (approval pending).
- Row 5b provider copy: Google Gemini named by default (LLM_PROVIDER=gemini); Anthropic only if backup on. Isa to confirm.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays.
- Webhook secret from env only; unset means refuse events.
- Checkpoint round: read only. Incomplete report with loop flag: verify first. Without flag: Jev pick.
- Loop rejected a prompt covering four screens: one screen per round.
- Loop rejected a prompt without the branch rule first: every prompt states it first.

## Blocked on Isa (park, do not retry)
- A 402 while the app is open is not routed to the paywall (needs routing decision).
- Row 6b step f: es and fr text for refusal keys, notConfirmed, plansUnavailable and storeError (these still describe a free tier).
- Terms copy src/app/legal/terms.tsx:71 describes a free tier.
- Row 5a/5b: 500 vs 403 read errors. Consent version (no version column). Consent screen analytics wording. Provider copy confirm. Accept also turns on analytics? (old alert did; consent screen does not).
- Confirm replace over navigate for insights.tsx (no-input screen).
- aiBrain.ts:168 still calls ensureAiConsent after a 403 (alert can still show).
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; 'Retry' vs 'Try again'; rename gym.monthSessions and gym.monthFreezes; appState.tsx:119; goal change replaces hand-set calorie target; training days device or backend; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- Owner check pending: launch wait for returning users; returning user with answers missing from phone can buy but cannot finish; RevenueCat sandbox webhook setup.

## Parked
- Ask Lume needs a second tap on Send after accepting consent (wait for consent screen review).
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts. measurements.tsx:118 heightToCm. paywall.tsx:81 unsafe cast. profile/privacy.tsx hardcoded 'Your data' title.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; paywallHref unit test; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. formatStreak(0) fr. SettingsList no disabled style. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1. Audit script rewrites ROUTE_COVERAGE.md.
- Hotspots: useHydration no freshness window; gym/history.tsx up to 200 rows; 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30.
- getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors. auth.ExportTableNames and account.UserTables overlap.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Restore purchases link shows profile.storeUnreachable; not checked for promises of later access.
- STATUS.md:32 and scanSeam.test.ts:450 describe free scans.
- A returning user without a subscription goes back to onboarding. A plan that ends while the app is open meets 402s in tabs with no paywall.
- No test files (tested from backend/tests): analytics, buildinfo, config, cuisine, db, debugreports, energy, entitlement, food, goals, httpx, recipes, subscription, tools/afcd.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Dev and PHASE3_ROWS.md row 14 note too long.