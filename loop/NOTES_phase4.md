# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 5 (owner check pending), 6 (owner check pending), 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 6b.
- Row 2b: dead ends 1 to 6 and 8 built in code, each with a test. Dead end 7 likely fixed (onboarding.paywall.plansUnavailable), pending Isa sign off.
- Last full checkpoint (after dead end 8): tsc 0 errors; Jest 297/297 suites, 1,810/1,810 tests, 4 snapshots; 67 console.error, 165 console.warn (background noise).
- This round: docs only. Record dead end 8 in PHASE4_ROWS.md Row 2b notes and mark row 8 built in DESIGN_REFERENCES.md.

## Next
1. Docs for dead end 8 (this round). Check the result next round.
2. Subscription toast subscription.plansUnavailable (src/app/profile/subscription.tsx:92): reword to user text, en only.
3. Row 6b: remaining work not tied to step (f).
4. Row 2b: redesign sign up, sign in and onboarding, one surface per round.
5. Row 3 after Isa signs off the Apple steps (owner).
6. Maestro flows (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge or switch.
- Prompts state the branch rule first and name files fully. Grep paths first.
- One task and one surface per prompt. Max 5 steps. A rejected prompt is rewritten, not sent.
- Report wording: 'built' or 'checked by a test'. Never 'verified'. A skipped check is flagged and verified first next round.
- A blocker that repeats twice goes to Blocked and is not retried.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- TestPG: localhost:5432, lume_test_local, no password. URL for one command only, never printed.
- OWNER_CHECKS_phase4.md: append only.
- Never edit src/lib/mock/data.ts, useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.
- Lint ignores JSON: check locale files with JSON.parse.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; English grams group from 1,000; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 5: limit handled where errors are caught (scan.ts, label-scan.tsx); Ask Lume limit returns null on daily limit; consent gate on server first in backend/internal/consent; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 stays queueable; only ai_daily_limit_reached non-retryable; kept src/app/ai-consent.tsx; background rebuilds count against allowance.
- Row 2b dead end 5: back from measurements dismisses to preview; session_exists continues routing with no error toast.
- Row 2b dead end 6: 401 on subscriptionConfirmed ends the session, same as the save.
- Row 2b dead end 8: target weight required when shown (lose or muscle), same 30 to 300 kg check and inline error as weight, via bodyWeightError. Continue never disabled. Server still optional (up to 1000).
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart (a guess).
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
- Shared test helper screenTitle sits in src/__tests__/render/helpers.tsx.
- Resend has no cooldown: Clerk limits sends and the loading state blocks double taps.
- Jev low confidence on a round where stop was considered: stop rejected.
- Docs only round chosen as the smallest task while Jev risk is high.

## Blocked on Isa (park, do not retry)
- Row 2b dead end 7 sign off: confirm onboarding.paywall.plansUnavailable closes it.
- Row 2b target weight: should it stay required for lose and muscle goals?
- Row 6b step (f) stale strings and es/fr text: deferred under English only.
- Resumed onboarding Back goes to Welcome, or to previous step: needs one shared step list.
- A 402 while the app is open is not routed to the paywall.
- legal/terms.tsx:71 describes a free tier. legal/privacy.tsx says 'Turn off AI processing'.
- Row 5 owner lines: 'Who receives it' copy; consent version; 500 vs 403 read error; brief and insights at AI limit; plain 429 queueable; label scan exit; scan.ts vs photo capture screen.
- Row 2b: back after sign-in goes to preview or not; Clerk SSO session_exists on device; Resend cooldown.
- Restore purchases runs the subscription check, so a 401 there ends the session. Confirm.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; rename gym.monthSessions and gym.monthFreezes; goal change replaces hand-set calorie target; training days device or backend; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- react-test-renderer deprecation (67 console errors). gesture-handler worklet warning (21): needs device check before any BottomSheet change.
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup.

## Parked
- Ask Lume, label scan, photo capture need a second tap after accepting consent.
- Server limit message is English only. Hardcoded English: aiBrain not-enough-data message; 'Your data' in privacy.tsx.
- About 67 deliberate console warns from [data], [onboarding], [meals]; needs scoped spies.
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1 and tests/migrations.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Plan ending while open meets 402s in tabs with no paywall.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Row 5: parallel requests can slip a few extra AI calls past the limit. Old daily counts are never deleted.
- Gotcha: zsh does not word-split $VAR; use an array for Go package lists.
- Gotcha: each hook test through the harness prints one react-test-renderer deprecation console.error.
- Gotcha: lint and test exit codes are hidden by pipes; redirect output to a file and echo $?.
- Gotcha: PHASE4_ROWS.md rows keep 7 columns; append notes with <br> before the closing ' |'.