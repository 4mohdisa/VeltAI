# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b, 3, 6b.
- 2b: dead ends 1 to 6, 8, 9 built with tests. Dead end 7 pending Isa sign off.
- Sign up flaw 3 (clerkMessage generic fallback) built, 5 test files pass. Not yet in a full run.
- Last full checkpoint (before dead end 8): tsc 0; Jest 296/296 suites, 1,804/1,804 tests; 67 console.error, 165 console.warn.

## Next
1. Full checkpoint: tsc and full Jest, covering clerkMessage and dead end 8.
2. Row 2b sign in surface pass.
3. Row 3 after Isa signs off the Apple steps (owner).
4. Maestro flows (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge or switch.
- One task and one surface per prompt. Max 5 steps. Name files fully. Grep paths first.
- Wording: 'built' or 'checked by a test'. Never 'verified'. Skipped checks are flagged and verified next round.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- Checkpoint round: read only, except fixing reds caused by the last change.
- TestPG: localhost:5432, lume_test_local, no password. URL on one command only, never printed.
- PHASE4_ROWS.md rows keep 7 columns: notes after <br>, before ' |'. OWNER_CHECKS_phase4.md is append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, foodDays.test.ts or listSessions defaults.
- Lint ignores JSON: check locale files with JSON.parse. zsh: use plain grep -rn; redirect lint and test output to files.
- A blocker that repeats twice goes to Blocked and is not retried.

## Decisions (never delete)
- Approved: plan-ready summary; training days and gain or maintain in onboarding; no trial or active sees paywall on morning brief; 'Sep' not 'Sept'; renderScreen wrapped in AppStateProvider; 401 dispatches SESSION_ENDED.
- Row 5: limit handled where errors are caught; consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 2b: dead end 5 back from measurements dismisses to preview, session_exists continues. Dead end 6 401 on subscription check or save ends session. Dead end 8 target weight required when shown (lose or muscle), 30 to 300 kg, inline bodyWeightError, Continue never disabled, server optional up to 1000. Dead end 9 sign in toggle keeps email.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart (a guess).
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs if completion flag set. GET /api/subscription public.
- paywallHref(reason?) in src/lib/nav.ts is the only place the paywall link is built.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again' (common.tryAgain). Webhook secret from env only; unset means refuse events.
- Shared test helper screenTitle in src/__tests__/render/helpers.tsx. i18next showSupportNotice false.
- Asking is not allowed: run the smallest task.

## Blocked on Isa (park, do not retry)
- Dead end 7 sign off. Sign up flaw 2: email errors inline or toasts (changes two tests).
- Target weight stays required for lose and muscle?
- Resumed onboarding Back: Welcome or previous step. Back to preview after sign in. Clerk session_exists on device. Resend cooldown.
- legal/terms.tsx:71 describes a free tier. legal/privacy.tsx says 'Turn off AI processing'.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; plain 429 queueable; label scan exit; scan.ts vs photo capture.
- Row 6b step (f) stale strings and es/fr text: deferred under English only.
- Approvals: remove lookupBarcodeAsync and scanSeam.test.ts:521; foodDays.test.ts edit; rename gym.monthSessions and gym.monthFreezes; goal change replaces hand-set calorie target; training days device or backend; commit ROUTE_COVERAGE.md; route audit in verify; integration revoke public; analytics gating.
- react-test-renderer deprecation (67 console errors). gesture-handler worklet warning (21): needs device check before BottomSheet change.
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Restore purchases runs subscription check, so a 401 ends session. Confirm. A 402 while app is open is not routed to paywall.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup.

## Parked
- Ask Lume, label scan, photo capture need second tap after consent.
- Server limit message English only. Hardcoded English: aiBrain not-enough-data; 'Your data' in privacy.tsx.
- subscription.notConfiguredDev reads like a developer message. subscription.plansUnavailable and onboarding.paywall.plansUnavailable es/fr out of date; paywall one names RevenueCat.
- About 67 deliberate console warns need scoped spies.
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1 and tests/migrations.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Plan ending while open meets 402s with no paywall.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Row 5: parallel requests can slip extra AI calls past limit. Old daily counts never deleted.
- Gotchas: each hook test prints one react-test-renderer deprecation; zsh --include=*.ts globs fail.