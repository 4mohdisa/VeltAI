# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT; soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14a, 14b, 15 to 30, 31.
4. One screen or component per prompt, max 5 numbered steps.
5. Partly done gets ONE follow-up; flagged again: park leftover, move on.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with branch rule; forbids switching, pushing, merging.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 13, 14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (code done, Maestro not run); 9 (leaving reason parked).
- Checkpoints: Round 66 and Round 80 (tsc 0; Jest 325 suites, 2,018 tests, 4 snapshots, all green).

## Next
1. Round 81: Row 14a step 1, FEATURES config and throttle module with fake clock tests (in progress).
2. Row 14a step 2: feedback chip component.
3. Row 14a step 3: feedback sheet (What went wrong reasons, free text, What do you like).
4. Row 14a step 4: Settings feedback screen (pick feature, rate, My feedback) plus backend route with rate limit.
5. Row 14a step 5: npm run feedback summary script, delete and export coverage, PRIVACY_DATA.md.
6. Row 14b design intent audit (DESIGN_INTENT.md, then small fixes).
7. Checkpoint: find which suites emit the 164 console.warn blocks (82 at Round 66).

## Parked (Row 14 and legal, do not retry)
- Health disclaimer link.
- web/lib/legal.ts lacks push, Sentry, PostHog lines.
- LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'.
- Banned word in legalParity comment (flagged twice).
- Paywall and signup LegalLink duplicates; shared component later.
- Paywall footer on small iPhone: Row 23.
- loop/HANDOVER_phase4.md:34 says two push token test files exist; only src/__tests__/pushToken.test.ts remains.

## Blocked on Isa (park)
- Leaving and retention: destination, reason and priming copy, win back copy and price, Apple Retention access, App Store Connect key, approve two messages, sandbox URL.
- Billing: 7c StoreKit needs iOS public key. Row 8: Maestro install, email sign in, expired, cancelled, past_due runs.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE public or gated, pod install before notification prompt.
- Row 11: Settings switch, purpose strings, real HealthKit provider, device steps.
- Row 12a: Email, Name, User ID on App Store label; push token manifest type.
- Row 13: age rating; production demo account; confirm lume.fit URLs live.
- Row 5 copy: recipients, consent version, 500 vs 403, AI limit copy.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording (legal review).
- Tooling: react-test-renderer deprecation; gesture-handler warning; Prettier; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Simulator checks (row 23): 401 after Clerk expiry; signup; launch; paywall; Row 6 numbers; Row 14 gym line offline.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Parked (other)
- DELETE after session ends gets 401; stale push tokens never removed; failed POST not retried in session; sign-out cannot remove token after relaunch.
- Leaving screen not in full non-silent run; meal median across midnight; quiet hours stepper does not wrap; expired session clears reminders until foreground.
- Node Jest expo-notifications mock lacks getDevicePushTokenAsync.
- Past_due may show two Manage buttons; pull-to-refresh skips subscription.
- Hardcoded strings: body emoji 26, A$, 'Your data', server limit message, Stepper labels.
- About 68 console errors need scoped spies; two useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- appleHealth.ts has write types; merge into real provider later.
- Root config and backend JS unlinted; verify:go lacks -count=1.
- Reanimated shared mock lacks useReducedMotion.
- Two push token test files: src/lib/notifications/pushToken.test.ts deleted in Round 79; confirm at checkpoint.

## Decisions (never delete)
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; Allow and Not now equal weight; 429 queueable; only ai_daily_limit_reached non-retryable.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial gives every feature; no free tier. Billing issue keeps access through grace. REFUND_REVERSED restores state from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. Banner reads server record, past_due only. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag default off; message keys only; fixtures until owner access; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00 to 07:00; meal and streak dropped in quiet hours; workout and weekly move to quiet end; promotional needs own opt in; all off by default. Permission asked only after priming says yes. expo-notifications imported only in permissions.ts and device.ts. Reschedules go through rescheduleToday or runDailySchedule; neither prompts.
- Push token: saved in secure storage after 204 (STORAGE_KEYS.pushToken, not wiped at sign-out); re-registered once per signed-in user; sign-out deletes saved copy only after DELETE succeeds. Native device token, not Expo token. Kept test: src/__tests__/pushToken.test.ts.
- Analytics off by default. English only for new keys. Stepper labels: common.decrease and common.increase.
- Row 11: no denied state for reads; reads return null when not granted or no data.
- Row 12a: account data in PRIVACY_DATA.md and app.json; manifest does not list push token.
- Row 13: APP_STORE_METADATA.md English only; Gemini is default photo AI; crash data not linked to user.
- Row 14: legal copy in en.json (legal.privacy, legal.terms; paywall terms at onboarding.paywall.terms); legalParity reads headings from en.json; UPDATED date literal stays because the manifest pins it.
- Render test stub: src/__tests__/render/setup.ts. Node Jest maps expo-notifications to src/__tests__/mocks/expoNotifications.ts.
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.
- Protected: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.

## Gotchas
- Branch check first (git branch --show-current only). Full Jest paths for single files; never jest -u; use --ci; redirect output to files.
- Lint: no setState in effect body; use guarded .then.
- Skeleton screens need per-file LoadingSkeleton mock. Typed routes lack /profile/winback and /profile/leaving: use navigate().
- expo-notifications is native: mock in tabs layout tests. Render tests must be *.render.test.tsx.
- Go entitlement tests need LUME_TEST_DATABASE_URL on lume_test_local.

## Round log
- Rounds 60 to 66: checkpoints clean; rows 10, 11, 13 closed.
- Round 67: Row 12a done. Round 68: prompt rejected for multiple screens.
- Rounds 70 to 79: privacy screen, terms move, paywall terms, push token merge; Row 14 BUILT.
- Round 80: checkpoint green (325 suites, 2,018 tests); no edits.
- Round 81: Row 14a step 1 prompt issued.