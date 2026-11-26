# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 3 to 14b, 15 to 30, 31.
4. One screen or one component per prompt. Multi-part prompts get rejected.

## State
- BUILT: 1, 2, 2.2, 2b (owner check pending), 2c, 2d, 3 (owner check pending), 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 6b (step f blocked). 7 (7a, 7b built; 7c parked). 8 (BillingProblemBanner built; mounted on Today with render test).
- Not started: 9 to 11, 13, 14, 14a, 14b, 15 to 31.
- Last full run: tsc 0; Jest 303 suites, 1,835 tests; green. Full suite checkpoint due when the loop calls one.

## Next
1. Row 8: mount banner on Profile > Subscription, render test (in progress).
2. Row 8: expired state with resubscribe, Manage subscription, win back.
3. Row 8 simulator flow at end of row.
4. Full suite checkpoint when the loop calls one.

## Blocked on Isa (park, do not retry)
- 7c StoreKit simulator purchase and real offerings: needs iOS public key in env. Blocked twice.
- es and fr for onboarding.paywall keys, subscription.period.* labels, and subscription.billingProblem.* keys.
- Row 8 banner: whether it should react to on-device billing_issue before the webhook lands. Flagged partly done twice; not retried. Server record only for now.
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; previous-step back on resumed step; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser flow.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Tooling: react-test-renderer deprecation (68 console.error); gesture-handler worklet warning (21); Prettier; App Store privacy label; push and CI confirm; E2E account needs 250+ gym dates.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook; Apple Developer and Clerk Apple setup; iPhone sign in with Apple; Row 2b items in OWNER_CHECKS_phase4.md.
- Profile > Goals setCustomGoals calorie clamp check: repeated twice, not retried.

## Decisions (never delete)
- Isa (26 Nov): target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up email errors inline under field; training days stored on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md and add route check to verify; export, delete account, disconnect integrations and privacy/consent settings work without subscription.
- Row 2b: measurements Continue never disabled; invalid input shows inline errors. Inches whole 0 to 11. Feet whole 3 to 8; empty feet with inches shows feet range error. Target weight required when shown (lose or muscle), 30 to 300 kg; server optional up to 1000. Back from measurements dismisses to preview; session_exists continues. 401 on subscription check or save ends session. Calorie range under field on Save (floor 1500, or 1200 female). Unit prefill returns weight and target weight in saved unit. Apple, Google and other code-check errors stay as toasts.
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
- Row 7: wrapper first (7a), paywall screen second (7b). Only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when the store says eligible. 7b replaces the hosted paywall on the onboarding route only.
- Row 7b: restore failure shows 'no previous subscription found' (wrapper reports failure as none).
- Row 8: banner reads the server record (useServerEntitlement), shows only for past_due, never loads the RevenueCat SDK. Long message wraps rather than truncating. Mounted on Today (round 8). Next mount: Profile > Subscription.

## Parked
- Today pull-to-refresh does not refetch subscription state; banner updates only on Try again or next hydration.
- entitlementFromApi stores unknown server status as is; should check it.
- Ask Lume, label scan, photo capture need second tap after consent.
- Server limit message English only. Hardcoded English: aiBrain not-enough-data; 'Your data' in privacy.tsx.
- About 68 deliberate console warns need scoped spies. Trace the 67 to 68 console.error rise. billing/purchases.ts warns when billing is off.
- Unused after 7b: onboarding.paywall.seePlans and trialNote (remove with es and fr). Check hosted paywall text in en.json before removing.
- Subscription screen still uses hosted paywall and old billing calls, not the 7a wrapper.
- Test render Reanimated mock lacks useReducedMotion; one line in shared setup fixes it.
- Two private useApi copies (energy.ts, gymSchedule.ts). Import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; background AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1 and tests/migrations.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Plan ending while open meets 402s with no paywall.
- Dev builds with billing off need LUME_GATING_ENABLED=false.
- Row 5: parallel requests can slip extra AI calls past limit. Old daily counts never deleted.
- Row 2b: emoji on body-type uses hardcoded fontSize 26 (left alone to keep the look).
- phase14Regression.test.ts checks source text of targets.tsx; a render test would be sturdier.
- Row 2b es and fr values of three rewritten keys are out of date; paywall one names RevenueCat.

## Gotchas
- zsh --include=*.ts globs fail. Report counts must match the command run. Briefs may name files that do not exist; grep first. Jest name patterns can match more files; pass full paths. Test files end in .render.test.tsx. PHASE4_ROWS.md Row 2b is line 8; keep 8 pipes. Use find -newer against /tmp/p4_marker, not git status. Never use jest -u.
- Redirect output to files; pipes hide exit codes.
- Every prompt opens with the branch check and the rule to work only on loop/phase4.
- Keep every prompt to one screen or component.

## Loop note
- Round 8 banner flagged as partly done twice. Mounted on Today; the on-device question stays under Blocked and is not retried.
- Jev ranked run highest (97%); chose the Profile > Subscription mount, the top candidate.