# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 5 (owner check pending), 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 6b.
- Last checkpoint: tsc 0 errors; Jest 295/295 suites, 1,795/1,795 tests; 67 console.error, 163 console.warn; 4 snapshots pass.
- Row 2b dead ends 1 to 3 built (welcome.render.test.tsx, signupSignInMode.render.test.tsx, signupResend.render.test.tsx). Shared helper screenTitle in src/__tests__/render/helpers.tsx.
- Row 2b dead end 4 built: OnbScaffold back goes to ONBOARDING_ROOT when no history (onboardingScaffold.render.test.tsx).

## Next
1. Row 2b dead end 5: after sign in, back from measurements shows sign up buttons while signed in. Check first, then fix or test.
2. Refresh stale audit in DESIGN_REFERENCES.md (dead ends 1 to 4 now built).
3. Row 2b redesign of sign up, sign in and onboarding, one surface per round.
4. Row 6b: remaining work not tied to step (f).
5. Row 3 after Isa signs off the Apple steps (owner).
6. Maestro flows (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge or switch.
- Every prompt states the branch rule first and names files fully.
- Briefs may name files that do not exist (welcome.tsx, src/locales). Check paths with grep first.
- One task and one surface per prompt. Max 5 steps. A rejected prompt is rewritten, not sent.
- Report wording: built, or checked by a test. Never 'verified'.
- A report that skips a check or leaves a gap is flagged; next round verifies it first.
- A blocker that repeats twice goes to Blocked and is not retried.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.
- Lint ignores JSON: check locale files with JSON.parse.
- English only: new keys in src/lib/i18n/locales/en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 5: limit handled where errors are caught (scan.ts, label-scan.tsx); Ask Lume limit in aiBrain.ts returns null on daily limit; consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 stays queueable; only ai_daily_limit_reached non-retryable; brief and insights keep fallback text at limit; rate_limit_counters not reused; kept src/app/ai-consent.tsx; background rebuilds count against allowance; consent gate in backend/internal/consent.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart (a guess). Duplicate-note merge dropped (would remove facts).
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding, or opens tabs if completion flag set. GET /api/subscription public, never 402.
- paywallHref(reason?) in src/lib/nav.ts is the only place the paywall link is built.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). ErrorState default 'Retry' stays.
- Webhook secret from env only; unset means refuse events.
- Checkpoint round: read only except fixing reds caused by the last change.
- Asking is not allowed: run the smallest task.
- i18next showSupportNotice false. act() fixes live in tests, one file per round.
- One surface per round while risk is high.
- Jev low confidence on a round where stop was considered: stop rejected, rows remain open.
- Shared test helper screenTitle sits in src/__tests__/render/helpers.tsx.
- Resend has no cooldown: Clerk limits sends and the loading state blocks double taps.

## Blocked on Isa (park, do not retry)
- Row 6b step (f): stale strings. Names none; deferred under English only. Not retried.
- Back on a resumed onboarding step goes to Welcome, not the previous step. Needs one shared step list. Isa to decide.
- A 402 while the app is open is not routed to the paywall.
- es and fr text (deferred). legal/terms.tsx:71 describes a free tier. legal/privacy.tsx says 'Turn off AI processing'.
- Row 5 owner lines: 'Who receives it' copy; consent version; 500 vs 403 read error; brief and insights at AI limit; plain 429 queueable confirmation; label scan exit; scan.ts vs photo capture screen.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; rename gym.monthSessions and gym.monthFreezes; goal change replaces hand-set calorie target; training days device or backend; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- react-test-renderer deprecation (67 console errors). gesture-handler worklet warning (21): needs device check before any BottomSheet change.
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup.

## Parked
- Ask Lume, label scan, photo capture need a second tap after accepting consent.
- Server limit message is English only. Hardcoded English: aiBrain not-enough-data message; 'Your data' in privacy.tsx.
- Console noise: about 67 deliberate [data], [onboarding], [meals] warns; needs scoped spies.
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1 and tests/migrations.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Plan ending while open meets 402s in tabs with no paywall.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Row 5: parallel requests can slip a few extra AI calls past the limit. Old daily counts are never deleted.
- react-test-renderer: each hook test adds one console.error via the shared harness.
- Gotcha: zsh does not word-split $VAR; use an array for Go package lists.