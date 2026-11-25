# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 5, 6b (6b step f blocked on Isa).
- Last checkpoint: tsc 0 errors; 293 suites, 1,784 tests pass. Go vet clean, -race ok, 29 TestPG pass on lume_test_local.
- act() flush done: accountLocale, integrationsLocale, tabbar, preferencesCopy, photoScan, confidenceBadge.noBreakdown.

## Next
1. act() flush, one file per round: brainProfileCard.numbers (2), then scanCards.strings (2). Check preferencesLocale count first; skip if 0.
2. Then back to row order: Row 5 remainder; Row 3 after Isa signs off.
3. Maestro onboarding flow (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge or switch.
- Every prompt states the branch rule first and names files fully.
- One task per prompt, one surface, max 5 steps.
- Report wording: built, or checked by a test. Never 'verified'.
- A report that skips a check is flagged; next round verifies it first.
- A blocker that repeats twice goes to Blocked on Isa and is not retried.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, user from whoami, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.
- Lint ignores JSON: check locale files with JSON.parse.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart (a guess).
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding, or opens tabs if completion flag set. GET /api/subscription is public, never 402.
- paywallHref(reason?) in src/lib/nav.ts is the only place the paywall link is built.
- REFUND_REVERSED restores state from event expiry. 402 has a reason field. Billing issue keeps access through grace.
- No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 5: consent on profiles.ai_consent_at; consent read error 500; consent version 1 (approval pending). Copy names Google Gemini; Anthropic only if backup on.
- aiBrain.ts loads @/lib/nav only inside the 403 branch (node Jest can't parse expo-router).
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays.
- Webhook secret from env only; unset means refuse events.
- Checkpoint round: read only except fixing reds caused by the last change.
- Asking is not allowed: run the smallest task.
- i18next showSupportNotice false.
- One file per round for act() fixes; flush stays inline in each test file, not a shared helper.
- Act() cleanup queue capped: after brainProfileCard and scanCards, return to row order.
- Jev risk 0.9 (high) on the last round noted; kept to one file per round.

## Blocked on Isa (park, do not retry)
- A 402 while the app is open is not routed to the paywall.
- es and fr text for English-only keys (row 6b, aiQuery.consentNeeded, aiQuery.notEnoughData, settings.privacyDetails.aiAllow, aiConsentedOn, dataTitle, aiConsent.screen).
- src/app/legal/terms.tsx:71 describes a free tier. src/app/legal/privacy.tsx says 'Turn off AI processing'; needs approval.
- Row 5: 500 vs 403 read errors; consent version; consent analytics wording; provider copy; replace vs navigate.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; rename gym.monthSessions and gym.monthFreezes; goal change replaces hand-set calorie target; training days device or backend; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- react-test-renderer deprecation (45 errors): move to @testing-library/react-native? Isa decides.
- gesture-handler worklet warning (21 errors): needs device or simulator check before any BottomSheet change.
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup.

## Parked
- Ask Lume, label scan, photo capture need a second tap after accepting consent.
- Hardcoded English: aiBrain not-enough-data message; 'Your data' in privacy.tsx.
- Console noise from error-path tests (about 72 deliberate [data], [onboarding], [meals] warns; needs scoped spies).
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1 and tests/migrations.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Plan ending while open meets 402s in tabs with no paywall.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Row 6b: merge three near-duplicate test-result lines.
- Row 2b: check preferencesLocale act() count; skip if 0.