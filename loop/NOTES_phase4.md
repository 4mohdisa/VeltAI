# Lume Loop Notes: Phase 4
Goal: all PHASE4_ROWS.md rows BUILT or EXACT; soak exit rule met. Never ask. Park owner steps. Branch loop/phase4 only. Never write 'verified'.

## Overrides (Isa)
1. English only; es and fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 3 to 14b, 15 to 30, 31.
4. One screen or component per prompt. Rejected prompts get rewritten; never bundle.
5. Prompts have at most 5 numbered steps.
6. A 'partly done' flag gets ONE follow-up round. Flagged again: park leftover, move on.
7. No simulator flow after each row. Simulator and Maestro only in row 23 and soak rows.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 8, 12, 12b, 29. Phase 3 rows 6, 13, 14, 15 BUILT.
- PARTIAL: 6b (step f blocked); 7 (7a, 7b built; 7c parked); 8 (Maestro flow written, not run); 9 (backend built; leaving screen built in round 28).
- Round 27 checkpoint green: tsc 0; Jest 309 suites, 1,894 tests, 4 snapshots; 68 console.error, 163 console.warn.
- Round 28: leaving.tsx built with 7 render tests. Its locale parity run was not done.

## Next
1. Round 29 (in progress): tsc, parity and leaving tests; then Settings row to /profile/leaving via navigate() with a render test. One screen per prompt.
2. Row 10 notifications (pure scheduling logic, fake clock, DST).
3. Full suite checkpoint at round 30.

## Blocked on Isa (park, do not retry)
- Leaving screen: where reason and note go (analytics allow-list, feedback endpoint, or nowhere).
- Win back: 'weren't charged' toast kept; English copy approved; which package price to show.
- Cancelled plan: Resubscribe beside Manage subscription, confirm.
- 7c StoreKit purchase and real offerings: needs iOS public key.
- Row 8: on-device billing_issue before webhook? Maestro: install; email code sign in (E2E_EMAIL is not +clerk_test); backend on lume at 127.0.0.1:55432; run expired, cancelled, past_due.
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; resumed-step Back; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403; brief and insights at AI limit; label scan exit; scan.ts vs photo capture.
- Tooling: react-test-renderer deprecation; gesture-handler worklet warning; Prettier; App Store privacy label; push and CI confirm; E2E account needs 250+ gym dates.
- Simulator checks: 401 after Clerk expiry; signup; launch; paywall; Total tile; Row 6 numbers; Row 14 gym line with backend stopped.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple Developer and Clerk Apple setup; iPhone sign in with Apple; Row 2b items.
- Row 9: Apple Retention Messaging access; App Store Connect API key in backend/.env; approve two English messages; sandbox real-time URL and 700 ms test.

## Decisions (never delete)
- Target weight optional server side; resumed onboarding Back goes to previous step; goal change with hand-set calories asks to update target; sign up errors inline; training days on backend.
- May delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify.
- Export, delete account, disconnect integrations, privacy settings work without subscription. Public routes: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke. Retention summary authenticated and counts only.
- Row 2b: measurements Continue never disabled, inline errors; inches 0 to 11, feet 3 to 8; target weight 30 to 300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Row 3: browser oauth_apple flow; Apple button hidden on Android.
- Row 4: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Row 5: consent gate on server first; consent on profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable.
- Row 6: hydrateGym limit 200; backend LIMIT kept. 6b: answers stay on device until trial or purchase confirmed; dismissed paywall never saves; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Row 7: wrapper first, screen second. Only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. Restore failure: 'no previous subscription found'.
- Row 8: banner reads server record (useServerEntitlement), past_due only; expired goes Subscription, then win back, then paywall. Past_due and expired hide Manage subscription.
- Win back: store price via wrapper; promotional offers only; no price text in Apple messages; WINBACK_REASON in nav.ts. Wrapper has no promotional offer API, so win back opens the paywall.
- REFUND_REVERSED restores state from event expiry. Billing issue keeps access through grace. No free tier: 7 day Apple trial gives every feature.
- Retry label 'Try again'. Webhook secret from env only; unset refuses events. Analytics off by default.
- Row 9: retention flag default off; message keys only; fixtures only until owner access; summary gated like paid routes; leaving screen sends no food, body or workout values to analytics.
- Round 29: Settings link chosen over notifications because Jev ranked it first (82%). Prompt rewritten to one screen after rejection.
- Round 25 log line stays at the end of PHASE4_ROWS.md.

## Parked
- Subscription footer may show two Manage buttons on past_due. Pull-to-refresh does not refetch subscription. entitlementFromApi stores unknown status as is.
- paywallSessionExpired prints unscoped devWarn. Paywall imports constants from a profile route file; move to src/lib.
- Body type emoji fontSize 26 hardcoded. Goals may clamp calories silently. Ask Lume, label scan, photo capture need a second tap after consent.
- Server limit message English only; aiBrain not-enough-data and 'Your data' hardcoded English.
- About 68 console warns and errors need scoped spies. Reanimated mock lacks useReducedMotion.
- Two private useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard weight refetch; AI sweep skipping no-consent users.
- formatCurrency hard-codes A$. Nothing dispatches SIGNED_IN. Unused onboarding.paywall.seePlans and trialNote.
- Root config and backend JS not linted. verify:go lacks -count=1.
- Route checks see only literal route strings; routes built from constants are missed.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Webhook does not check Apple's signed payload yet (comment marks the spot).
- Returning user without subscription goes to onboarding. Row 5: parallel requests can slip past AI limit; old daily counts never deleted.

## Gotchas
- Pass full paths to Jest. Never jest -u. Redirect output to files. Touch a fresh marker each round.
- Lint forbids setState inside an effect body; use a guarded .then.
- Every prompt opens with the branch check. Max 5 numbered steps. One screen or component per prompt.
- Screens with a skeleton need a per-file LoadingSkeleton mock.
- Typed routes lack /profile/winback and /profile/leaving; use navigate().
- Spy on useLocalSearchParams through jest.requireMock('expo-router'), not import *.
- Go entitlement tests need LUME_TEST_DATABASE_URL pointed at lume_test_local.
- Render tests can wrap the screen in SafeAreaProvider, so toJSON() is not null even when empty.
- English only: new keys go in en.json and on ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Round 25 log line stays at the end of PHASE4_ROWS.md.