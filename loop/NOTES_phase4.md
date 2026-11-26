# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT. Row 3 BUILT (owner check pending).
- PARTIAL: 2b (inches whole 0 to 11 done; body-type sweep done; feet whole-number check in progress), 6b (step f blocked), 3 (owner checks).
- Not started: 7 to 11, 13, 14, 14a, 14b, 15 to 31.
- Last checkpoint: tsc 0; Jest 299/299 suites, 1,816/1,816 tests; 67 console.error, 165 console.warn.

## Next
1. Row 2b: feet box whole-number check (this round).
2. Row 2b: close as BUILT with owner check pending if no flaw is left.
3. Profile > Goals: check setCustomGoals for a silent calorie clamp.
4. Row 7: paywall wrapper (RevenueCat behind one module, mocked in Jest).
5. Row 8: subscription lifecycle screens.
6. Maestro flows (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge, switch or delete branches.
- One task per prompt, one screen or component per prompt, max 5 numbered steps, files named in full, grep paths first.
- Wording: 'built' or 'checked by a test'. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- Redirect lint and test output to files. Pipes hide exit codes.
- TestPG: localhost:5432, lume_test_local, URL on one command only, never printed.
- PHASE4_ROWS.md rows keep 7 columns: notes after <br>, before ' |'. OWNER_CHECKS_phase4.md append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, foodDays.test.ts, listSessions defaults.
- New English strings: src/lib/i18n/locales/en.json. ENGLISH_ONLY in localeParity.test.ts only if es and fr lack the key.
- Use find -newer against /tmp/p4_marker, not git status.
- A blocker that repeats twice goes to Blocked and is not retried.

## Decisions (never delete)
- Isa (26 Nov): target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up email errors inline under field; training days stored on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md and add route check to verify; export, delete account, disconnect integrations and privacy/consent settings work without subscription.
- Row 2b: measurements Continue never disabled; invalid input shows inline errors. Inches whole 0 to 11. Target weight required when shown (lose or muscle), 30 to 300 kg; server optional up to 1000. Back from measurements dismisses to preview; session_exists continues. 401 on subscription check or save ends session. Calorie range under field on Save (floor 1500, or 1200 for female). Unit prefill: weight and target weight come back in the saved unit. Dead ends 8 to 11 built. Apple, Google and other code-check errors stay as toasts.
- Row 3: browser oauth_apple flow. Apple button hidden on Android.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. GET /api/subscription public. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again'. Webhook secret from env only; unset means refuse events.
- Analytics off by default; loop follows the Settings switch.
- Shared test helper screenTitle in src/__tests__/render/helpers.tsx. i18next showSupportNotice false.
- Jev stop suggestions are advisory. Stop needs every row BUILT or EXACT. Keep tasks small.
- English only: es and fr deferred.

## Blocked on Isa (park, do not retry)
- Target weight stays required? and dead end 7 copy sign off.
- Resend cooldown. Previous-step back on resumed step. Back to preview after sign in. Clerk session_exists on device. Native Apple sheet vs browser flow.
- Whether Row 2b closes now or waits for Isa's answers (repeated twice; parked, close with owner check pending).
- es and fr text for onboarding.measurements.heightRangeIn, onboarding.targets.caloriesRange, and three rewritten keys (subscription.plansUnavailable, subscription.notConfiguredDev, onboarding.paywall.plansUnavailable; paywall one names RevenueCat).
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- react-test-renderer deprecation (67 console errors). gesture-handler worklet warning (21).
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup; Apple Developer and Clerk Apple setup; iPhone sign in with Apple check.

## Parked
- Ask Lume, label scan, photo capture need second tap after consent.
- Server limit message English only. Hardcoded English: aiBrain not-enough-data; 'Your data' in privacy.tsx.
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
- Setting: Profile > Goals setCustomGoals may clamp calories silently (unchecked).
- Row 2b: emoji on body-type uses hardcoded fontSize 26, no matching token (left alone to keep the look).
- Row 2b: es and fr values of three rewritten keys are out of date (paywall one names RevenueCat).
- Gotchas: zsh --include=*.ts globs fail; each hook test prints one react-test-renderer deprecation. Report counts must match the command run. Briefs may name files that do not exist; grep first. The render setup mocks the router without dismissTo. PHASE4_ROWS.md Row 2b is line 8; keep 8 pipes.

## Loop note
- Last prompt was rejected: it did not say to work only on loop/phase4. Every prompt now opens with that rule and a branch check.
- Same blocker repeated twice (closing Row 2b). Recorded under Blocked; not retried. Work moves to surfaces that do not depend on it.