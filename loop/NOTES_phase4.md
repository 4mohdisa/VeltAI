# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 3 to 14b, 15 to 30, 31.
4. One screen or component per prompt. A rejected prompt is rewritten at once.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 6b (step f blocked). 7 (7a, 7b built; 7c parked). 8 (banner on Today and Profile > Subscription; expired state built; win back screen built, not reachable yet).
- Not started: 9 to 11, 13, 14, 14a, 14b, 15 to 31.
- Round 13 full suite: tsc 0; Jest 308 suites, 1,880 tests, green. console.error 69 (baseline 67), untraced.
- Round 15: paywall arrival toast hidden for win back (done; question parked below).

## Next
1. Row 8: link Subscription expired and cancelled states to /profile/winback (round 16).
2. Trace console.error rise (67 to 69) and scope its spy.
3. Remove onboarding.paywall.seePlans and trialNote after checking en.json.
4. Row 8 simulator flow at end of row.

## Blocked on Isa (park, do not retry)
- Win back paywall: a real failed purchase from win back shows the 'weren't charged' toast. Kept because it is true. Isa confirms or asks to hide it. Parked after two flags.
- 7c StoreKit simulator purchase and real offerings: needs iOS public key in env.
- Row 8 banner: react to on-device billing_issue before the webhook lands?
- Row 8 win back: approve English copy for subscription.winback.*; supply es and fr; pick which package price to show.
- Round 12: Resubscribe opens paywall with reason 'expired', so an expired error toast shows on top of the expired message.
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; previous-step back on resumed step; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser flow.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Tooling: react-test-renderer deprecation; gesture-handler worklet warning; Prettier; App Store privacy label; push and CI confirm; E2E account needs 250+ gym dates.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym month line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook; Apple Developer and Clerk Apple setup; iPhone sign in with Apple; Row 2b items in OWNER_CHECKS_phase4.md.
- es and fr text for onboarding.paywall, subscription.period.*, subscription.billingProblem.*, subscription.expired.*, subscription.winback.* (deferred by Isa).

## Decisions (never delete)
- Isa: target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up email errors inline; training days stored on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md and add route check to verify; export, delete account, disconnect integrations and privacy/consent settings work without subscription.
- Row 2b: measurements Continue never disabled; invalid input shows inline errors. Inches 0 to 11. Feet 3 to 8. Target weight required when shown (lose or muscle), 30 to 300 kg; server up to 1000. Back from measurements dismisses to preview; session_exists continues. 401 on subscription check or save ends session. Calorie floor 1500 (1200 female). Apple, Google and code-check errors stay as toasts.
- Row 3: browser oauth_apple flow. Apple button hidden on Android.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 6: hydrateGym limit 200; backend LIMIT kept. Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. GET /api/subscription public. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- Retry label 'Try again'. Webhook secret from env only; unset means refuse events. Analytics off by default; loop follows the Settings switch.
- Row 7: wrapper first (7a), paywall screen second (7b). Only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. 7b replaces hosted paywall on onboarding route only. Restore failure shows 'no previous subscription found'.
- Row 8: banner reads server record (useServerEntitlement), shows only for past_due, never loads RevenueCat SDK. On past_due and expired the Subscription footer Manage button hides.
- Round 14: win back uses store price via wrapper; promotional offers only; no price text in Apple messages. WINBACK_REASON 'winback' in nav.ts; EXPIRED exported from subscription.tsx.
- Round 16: kept round 15 win back toast behaviour as the default while Isa decides.

## Parked
- Paywall reason list hardcodes 'expired' next to EXPIRED constant.
- Today pull-to-refresh does not refetch subscription state. entitlementFromApi stores unknown status as is.
- Subscription footer may show two Manage buttons on past_due.
- Body type emoji fontSize 26 hardcoded. Goals may clamp calories silently.
- Ask Lume, label scan, photo capture need second tap after consent.
- Server limit message English only; aiBrain not-enough-data and 'Your data' hardcoded English.
- About 69 console warns and errors need scoped spies.
- Test Reanimated mock lacks useReducedMotion; skeleton screens need per-file mock.
- Two private useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Row 5: parallel requests can slip past AI limit; old daily counts never deleted.
- onboarding.paywall.seePlans and trialNote unused after 7b.

## Gotchas
- zsh --include=*.ts globs fail. Report counts must match the command run. Pass full paths to Jest. Test files end in .render.test.tsx. PHASE4_ROWS.md Row 8 line keeps 8 pipes. Use find -newer against a fresh marker. Never jest -u. Never write 'verified'.
- Redirect output to files; pipes hide exit codes.
- Lint forbids setState inside an effect body; use a guarded .then.
- Every prompt opens with the branch check.
- One screen or component per prompt, including its own test file. Full suite only on checkpoint rounds.

## Loop note
- Round 13: full suite checkpoint passed.
- Round 15 report flagged partly done; the same blocker (win back toast) came back twice. Recorded under Blocked; next surface chosen.