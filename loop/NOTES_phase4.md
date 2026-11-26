# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Work only on branch loop/phase4.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken). Leftovers go to Parked.
3. Order: 2b, 3 to 14b, 15 to 30, 31.

## State
- BUILT: 1, 2, 2.2, 2c, 2d, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 2b (dead ends 1 to 6, 8, 9 built; 7 closed in English, sign off open; sign up email errors inline done), 3 (waits on Apple owner steps), 6b.
- Last full checkpoint: tsc 0; Jest 296/296 suites, 1,804/1,804 tests; 67 console.error, 165 console.warn. Sign up email inline change and dead end 8 are after it. Checkpoint in progress.

## Next
1. Checkpoint (tsc, full Jest, lint on changed files). Record the numbers in the report.
2. Candidate: wrong code error under the code field via codeError (signup.tsx).
3. Row 3 after Isa signs off Apple steps (owner).
4. Maestro flows (2b, 23) once Maestro is confirmed.

## Rules
- Branch loop/phase4 only. Only git command: git branch --show-current. Never push, merge, switch or delete branches.
- One task per prompt, max 5 steps, files named in full, grep paths first.
- Wording: 'built' or 'checked by a test'. Never 'verified'.
- Lint: npx expo lint <files> --max-warnings 0. No new eslint-disable.
- Jest --ci, one file per command, never -u. Full suite only on checkpoints.
- Redirect lint and test output to files. Pipes hide exit codes.
- TestPG: localhost:5432, lume_test_local, URL on one command only, never printed.
- PHASE4_ROWS.md rows keep 7 columns: notes after <br>, before ' |'. OWNER_CHECKS_phase4.md append only.
- Never edit src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, foodDays.test.ts, listSessions defaults.
- New English strings: en.json and ENGLISH_ONLY in localeParity.test.ts.
- A blocker that repeats twice goes to Blocked and is not retried.

## Decisions (never delete)
- Isa (26 Nov): target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up email errors inline under field; training days stored on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md and add route check to verify; export, delete account, disconnect integrations and privacy/consent settings work without subscription.
- Row 2b: measurements Continue never disabled; invalid input shows inline errors. Target weight required when shown (lose or muscle), 30 to 300 kg; server treats it as optional up to 1000. Back from measurements dismisses to preview; session_exists continues. 401 on subscription check or save ends session.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. GET /api/subscription public. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 3: browser oauth_apple flow. Apple hidden on Android (pending Isa).
- Phase 3 row 6: hydrateGym limit 200; backend LIMIT kept.
- Retry label 'Try again'. Webhook secret from env only; unset means refuse events.
- Legal text follows no-free-tier decision. Privacy wording matches AI consent withdraw switch.
- Analytics off by default; loop follows the Settings switch.
- Shared test helper screenTitle in src/__tests__/render/helpers.tsx. i18next showSupportNotice false.
- Jev stop suggestions are advisory. Stop needs every row BUILT or EXACT. Keep tasks small.
- English only: es and fr deferred. The 'translate es and fr' follow-up is dropped.
- Dead end 8 (target weight) is recorded in PHASE4_ROWS.md Row 2b and DESIGN_REFERENCES.md.

## Blocked on Isa (park, do not retry)
- Dead end 7 copy sign off. Target weight stays required? Resend cooldown. Previous-step back on resumed step. Back to preview after sign in. Clerk session_exists on device.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Row 6b step (f) stale strings.
- react-test-renderer deprecation (67 console errors). gesture-handler worklet warning (21).
- E2E account needs 250+ gym dates. Prettier. App Store privacy label. Push and confirm CI.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook setup.

## Parked
- Wrong code still a toast (could go under code field via codeError if Isa wants).
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
- Gotchas: zsh --include=*.ts globs fail; each hook test prints one react-test-renderer deprecation. Report counts for test runs must match the command run.
- Gotchas: PHASE4_ROWS.md rows keep 7 columns. Lint exit codes hidden by pipes. Briefs may name files that do not exist; grep first.