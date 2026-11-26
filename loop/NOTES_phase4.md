# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT; soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 14a, 14b, 15 to 30, 31.
4. One screen or component per prompt, max 5 numbered steps.
5. Partly done gets ONE follow-up round; flagged again: park leftover, move on.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule and forbids switching, pushing, merging.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11 (owner check pending), 12 (incl. 12a), 13, 14 (privacy linked from Settings; Terms, health disclaimer, paywall terms parked), 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (code done, Maestro not run); 9 (leaving reason parked).
- Row 13: full gate re-run pending.
- Last full checkpoint: Round 66. tsc 0; Jest 323 suites, 2,015 tests.

## Next
1. Round 72: PRIVACY_DATA.md banned word line 215; APP_STORE_METADATA.md account data answers match PRIVACY_DATA.md and app.json.
2. Row 14a feedback, one screen or component per round.
3. Row 14b design intent audit.
4. Merge push token test files (src/__tests__/pushToken.test.ts, src/lib/notifications/pushToken.test.ts).
5. Confirm each row's status in PHASE4_ROWS.md before starting it.

## Parked (Row 14 leftovers, do not retry without a reason)
- Terms screen onto legal keys; health disclaimer link; paywall subscription terms.
- web/lib/legal.ts: push, Sentry, PostHog lines.
- LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'.

## Blocked on Isa (park, do not retry)
- Leaving and retention: destination, reason and priming copy, win back copy and price, resubscribe on cancelled, Apple Retention access, App Store Connect key, approve two messages, sandbox URL and 700 ms test.
- Billing: 7c StoreKit purchase needs iOS public key. Row 8: Maestro install, email code sign in, lume DB on 127.0.0.1:55432, expired, cancelled, past_due runs.
- Row 10: category strings, notification defaults, training-day reminders, quiet hours wording and off switch, UTC fallback, same-day reschedule after grant, push token retention, DELETE public or gated, re-register rate.
- Row 11: Settings switch and purpose strings; real HealthKit provider (package, entitlement, pod install); device steps.
- Row 12a: declare Email, Name, User ID on App Store label. Push token manifest type: owner decides.
- Row 13: age rating answers; production demo account; confirm lume.fit support and privacy URLs live.
- Row 5 copy: who receives it, consent version, 500 vs 403, AI limit copy, label scan exit, scan.ts vs photo capture.
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; resumed Back; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser.
- Tooling: react-test-renderer deprecation; gesture-handler warning; Prettier; push and CI; E2E account needs 250+ gym dates; npm audit (expo-notifications); pod install before notification prompt.
- Simulator checks: 401 after Clerk expiry; signup; launch; paywall; Total tile; Row 6 numbers; Row 14 gym line offline.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b items; HealthKit device steps.

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
- Push token: saved in secure storage after 204 (STORAGE_KEYS.pushToken, not wiped at sign-out); re-registered once per signed-in user; sign-out deletes saved copy only after DELETE succeeds. Native device token, not Expo token.
- Analytics off by default. English only for new keys. Stepper labels: common.decrease and common.increase.
- Row 11: no denied state for reads; reads return null when not granted or no data.
- Row 12a: account data in PRIVACY_DATA.md and app.json; manifest does not list push token.
- Row 13: APP_STORE_METADATA.md English only; follows PRIVACY_DATA.md and app.json; Gemini is default photo AI; crash data not linked to user.
- Render test stub: src/__tests__/render/setup.ts. Node Jest maps expo-notifications to src/__tests__/mocks/expoNotifications.ts (package.json).
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify.
- Protected: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.

## Parked (other)
- DELETE after session ends gets 401; stale row stays. Stale push tokens never removed. Failed POST not retried in same session. Token in memory only after relaunch: sign-out cannot remove it.
- Leaving screen not in a full non-silent run. Meal median across midnight averages to midday. Quiet hours stepper does not wrap at midnight.
- Expired session clears reminders until next foreground. Nothing derives per-slot meal times at app start.
- Node Jest expo-notifications mock lacks getDevicePushTokenAsync.
- Past_due may show two Manage buttons. Pull-to-refresh skips subscription.
- Hardcoded strings: body emoji 26, A$, 'Your data', server limit message, Stepper labels.
- About 68 console errors need scoped spies. Two useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- appleHealth.ts has write types and its own API: merge into real provider later.
- Root config and backend JS unlinted; verify:go lacks -count=1.
- Shared reanimated mock lacks useReducedMotion; render tests reaching skeletons need own mocks.

## Gotchas
- Branch check first (git branch --show-current only). Full Jest paths for single files; never jest -u; use --ci; redirect output to files.
- Lint: no setState in effect body; use guarded .then.
- Skeleton screens need per-file LoadingSkeleton mock. Typed routes lack /profile/winback and /profile/leaving: use navigate().
- expo-notifications is native: mock in tabs layout tests. Render tests must be *.render.test.tsx.
- Go entitlement tests need LUME_TEST_DATABASE_URL on lume_test_local.

## Round log
- Rounds 60 to 66: checkpoints clean; rows 10, 11, 13 closed.
- Round 67: Row 12a done (manifest OK).
- Round 68: prompt rejected for multiple screens.
- Round 69: privacy policy screen started.
- Round 70: privacy screen finished; flagged partly done.
- Round 71: follow-up done. Settings privacy link already existed; render test settingsPrivacyLink added. Flagged again.
- Round 72: Row 14 leftovers parked, Row 14 set BUILT (rule 5). Chose doc text fixes over Terms screen: small, low risk, already in Next, Jev ranked first (83%).
