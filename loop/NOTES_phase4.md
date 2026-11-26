# Lume Loop Notes: Phase 4

Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 3 to 14b, 15 to 30, 31.
4. One screen or component per prompt. A rejected prompt is rewritten at once.
5. Prompts have at most 5 numbered steps.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 6b (step f blocked). 7 (7a, 7b built; 7c parked). 8 (banner, expired, cancelled, win back built; simulator flow not run).
- Not started: 9 to 11, 13, 14, 14a, 14b, 15 to 31.
- Round 17 checkpoint: tsc 0; Jest 309 suites, 1,894 tests, 4 snapshots pass. console.error 69, console.warn 163.
- Round 21 report: constants and four paywall tests pass. Flagged partly done by automatic check.

## Next
1. Round 22 (running): close Rounds 20 and 21. Confirm EXPIRED and CANCELLED single definitions and imports, grep literals, tsc, lint, four paywall tests plus winback. Fresh marker /tmp/p4_marker_r22.
2. Round 23: trace console.error rise (67 baseline, 69 now) with scoped spies on paywallOnboardingPost.render.test.tsx and others.
3. Round 24: remove onboarding.paywall.seePlans and trialNote after checking en.json. Full suites on this checkpoint.
4. Then: Row 8 simulator flow once per-screen checks pass.

## Blocked on Isa (park, do not retry)
- Win back: a real failed purchase shows 'weren't charged' toast. Kept, it is true.
- Cancelled plan shows Resubscribe beside Manage subscription: confirm.
- Win back copy: approve English; supply es and fr later; pick package price to show.
- 7c StoreKit purchase and real offerings: needs iOS public key in env.
- Row 8 banner: react to on-device billing_issue before webhook lands?
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; resumed-step Back; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser flow.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403 read error; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Tooling: react-test-renderer deprecation; gesture-handler worklet warning; Prettier; App Store privacy label; push and CI confirm; E2E account needs 250+ gym dates.
- Simulator checks: 401 after Clerk expiry, signup, launch, paywall; Total tile; Row 6 numbers; Row 14 gym line with backend stopped.
- Owner check pending: launch wait for returning users; RevenueCat sandbox webhook; Apple Developer and Clerk Apple setup; iPhone sign in with Apple; Row 2b items in OWNER_CHECKS_phase4.md.

## Decisions (never delete)
- Isa: target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calorie target asks 'Update your calorie target to match?'; sign up email errors inline; training days on backend; may delete lookupBarcodeAsync and its test line, edit foodDays.test.ts, rename gym.monthSessions and gym.monthFreezes, commit ROUTE_COVERAGE.md and add route check to verify; export, delete account, disconnect integrations and privacy/consent settings work without subscription.
- Row 2b: measurements Continue never disabled; invalid input shows inline errors. Inches 0 to 11. Feet 3 to 8. Target weight required when shown (lose or muscle), 30 to 300 kg; server up to 1000. Back from measurements dismisses to preview; session_exists continues. 401 on subscription check or save ends session. Calorie floor 1500 (1200 female). Apple, Google and code-check errors stay as toasts.
- Row 3: browser oauth_apple flow. Apple button hidden on Android.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable; background rebuilds count against allowance.
- Row 6: hydrateGym limit 200; backend LIMIT kept. Row 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. GET /api/subscription public. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Row 7: wrapper first (7a), paywall screen second (7b). Only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. 7b replaces hosted paywall on onboarding route only. Restore failure shows 'no previous subscription found'.
- Row 8: banner reads server record (useServerEntitlement), shows only for past_due, never loads RevenueCat SDK. On past_due and expired the Subscription footer Manage button hides.
- Win back: store price via wrapper; promotional offers only; no price text in Apple messages. WINBACK_REASON 'winback' in nav.ts; EXPIRED exported from subscription.tsx. Round 15 toast behaviour kept.
- Round 19: winback.tsx imports CANCELLED from subscription.tsx; one definition.
- Round 20: chose over Round 21 pick; Jev ranked it first at 90%, smallest step.
- Round 21: flagged partial round 20 finished first. Jev ranked Run 66%, smallest task chosen. Shared status constants move to src/lib later, not now.
- Round 22: closing check chosen after the automatic flag. Jev ranked Ask 49%, Run 43%; Ask not allowed, so Run.
- Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Retry label 'Try again'. Webhook secret from env only; unset means refuse events. Analytics off by default; loop follows the Settings switch.
- Round 18: rewritten after rejection to one screen; Row 8 simulator checks split per screen.

## Parked
- Subscription footer may show two Manage buttons on past_due. Pull-to-refresh does not refetch subscription. entitlementFromApi stores unknown status as is.
- Body type emoji fontSize 26 hardcoded. Goals may clamp calories silently.
- Ask Lume, label scan, photo capture need second tap after consent.
- Server limit message English only; aiBrain not-enough-data and 'Your data' hardcoded English.
- About 69 console warns and errors need scoped spies.
- Test Reanimated mock lacks useReducedMotion; skeletons need per-file mock.
- Two private useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN.
- Root config and backend JS not linted. verify:go lacks -count=1.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Returning user without subscription goes to onboarding. Row 5: parallel requests can slip past AI limit; old daily counts never deleted.
- onboarding.paywall.seePlans and trialNote unused (Round 24).
- Shared status constants should move to src/lib (paywall imports from a profile route file).

## Gotchas
- zsh --include=*.ts globs fail. Pass full paths to Jest. Never jest -u. Never write 'verified'.
- Redirect output to files; pipes hide exit codes. Touch a fresh marker each round.
- Lint forbids setState inside an effect body; use a guarded .then.
- Every prompt opens with the branch check. One screen or component per prompt. Max 5 numbered steps.
- Screens with a skeleton need a per-file LoadingSkeleton mock (Reanimated mock lacks useReducedMotion).

## Loop note
- Round 22 running: close Rounds 20 and 21. Full suites on Round 24 checkpoint.
- Last full run: tsc 0; Jest 309 suites, 1,894 tests, 4 snapshots (round 17).