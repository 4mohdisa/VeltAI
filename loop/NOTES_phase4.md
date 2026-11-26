# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only. Never write 'verified'.

## Overrides (Isa)
1. English only; es and fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 3 to 14b, 15 to 30, 31.
4. One screen or component per prompt. A rejected prompt is rewritten at once.
5. Prompts have at most 5 numbered steps.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 6b (step f blocked). 7 (7a, 7b built; 7c parked). 8 (banner, expired, cancelled, win back built; simulator flow open for expired, cancelled, past_due).
- Not started: 9 to 11, 13, 14, 14a, 14b, 15 to 31.
- Round 17 full run: tsc 0; Jest 309 suites, 1,894 tests, 4 snapshots. console.error 69 (baseline 67), console.warn 163.
- Round 22: EXPIRED and CANCELLED each defined once in subscription.tsx; tsc 0; lint clean; 56 paywall and winback tests pass.

## Next
1. Round 23 (running): Row 8 simulator flow for expired, cancelled, past_due. Clears the Round 22 flag.
2. Round 24: trace console.error rise with scoped spies on paywallOnboardingPost.render.test.tsx.
3. Round 25: remove onboarding.paywall.seePlans and trialNote after checking en.json. Full suites on this checkpoint.
4. Then Row 9.

## Blocked on Isa (park, do not retry)
- Win back 'weren't charged' toast: kept, it is true.
- Cancelled plan shows Resubscribe beside Manage subscription: confirm.
- Win back copy: approve English; es and fr later; which package price to show.
- 7c StoreKit purchase and real offerings: needs iOS public key.
- Row 8 banner: react to on-device billing_issue before webhook lands?
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; resumed-step Back; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser flow.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Tooling: react-test-renderer deprecation; gesture-handler worklet warning; Prettier; App Store privacy label; push and CI confirm; E2E account needs 250+ gym dates.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook; Apple Developer and Clerk Apple setup; iPhone sign in with Apple; Row 2b items in OWNER_CHECKS_phase4.md.

## Decisions (never delete)
- Isa: target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up errors inline; training days on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md with route check in verify; export, delete account, disconnect integrations and privacy settings work without subscription.
- Row 2b: measurements Continue never disabled, inline errors. Inches 0 to 11, feet 3 to 8. Target weight required when shown, 30 to 300 kg (server 1000). Calorie floor 1500 (1200 female). 401 ends session. Apple, Google and code errors stay toasts.
- Row 3: browser oauth_apple flow; Apple button hidden on Android.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 6: hydrateGym limit 200; backend LIMIT kept. 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. GET /api/subscription public. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Row 7: wrapper first, screen second. Only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. Restore failure: 'no previous subscription found'.
- Row 8: banner reads server record (useServerEntitlement), past_due only, never loads the SDK. Past_due and expired hide the Subscription Manage button.
- Win back: store price via wrapper; promotional offers only; no price text in Apple messages; WINBACK_REASON in nav.ts; EXPIRED and CANCELLED exported once from subscription.tsx.
- Rounds 19 to 22: closing checks chosen after automatic flags; smallest steps; Jev ranking noted each time.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Retry label 'Try again'. Webhook secret from env only; unset refuses events. Analytics off by default; loop follows the Settings switch.
- Round 23: Row 8 simulator flow chosen over the console trace, because the Round 22 flag names Row 8 as partly done.

## Parked
- Subscription footer may show two Manage buttons on past_due. Pull-to-refresh does not refetch subscription. entitlementFromApi stores unknown status as is.
- Body type emoji fontSize 26 hardcoded. Goals may clamp calories silently.
- Ask Lume, label scan, photo capture need a second tap after consent.
- Server limit message English only; aiBrain not-enough-data and 'Your data' hardcoded English.
- About 69 console warns and errors need scoped spies.
- Reanimated test mock lacks useReducedMotion; skeletons need per-file mock.
- Two private useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Row 5: parallel requests can slip past AI limit; old daily counts never deleted.
- Shared status constants should move to src/lib.

## Gotchas
- Pass full paths to Jest. Never jest -u. Redirect output to files; pipes hide exit codes. Touch a fresh marker each round.
- Lint forbids setState inside an effect body; use a guarded .then.
- Every prompt opens with the branch check. One screen per prompt. Max 5 numbered steps.
- Screens with a skeleton need a per-file LoadingSkeleton mock.

## Loop note
- Last full run: tsc 0; Jest 309 suites, 1,894 tests, 4 snapshots (round 17). Full suites on the Round 25 checkpoint.