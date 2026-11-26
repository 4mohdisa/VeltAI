# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT; soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never write 'verified'.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core is broken).
3. Order: 14, 14a, 14b, 15 to 30, 31.
4. One screen or component per prompt, max 5 numbered steps.
5. 'Partly done' gets ONE follow-up round; flagged again: park leftover, move on.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule and forbids switching, pushing, merging.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11 (owner check pending), 12, 12b, 13 (gates pending re-run), 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (code done, Maestro not run); 9 (leaving reason parked).
- Last checkpoint round 60: tsc 0; Jest 322 suites, 2,008 tests, 4 snapshots.

## Next
1. Gate run for Row 13 (type check, changed-file Jest, metadata scan). Round 65 task.
2. Row 12a: account data (email, name, user ID) in PRIVACY_DATA.md and app.json; update the push token section, which is out of date since Row 10.
3. Row 14 in-app legal, then 14a, 14b.
4. Confirm each row's status in PHASE4_ROWS.md before starting it.

## Blocked on Isa (park, do not retry)
- Leaving: destination; reason and note destination. Priming copy. Win back copy and price. Resubscribe beside Manage on cancelled.
- 7c: StoreKit purchase needs iOS public key.
- Row 8: Maestro install; email code sign in; database lume on 127.0.0.1:55432; run expired, cancelled, past_due.
- Row 10: category strings; notification defaults; training-day reminders; quiet hours wording and off switch; UTC fallback; same-day reschedule after later grant; push token retention; DELETE public or gated; push re-register rate.
- Sign-offs: target weight required; dead end 7 copy; resend cooldown; resumed Back; back to preview after sign in; Clerk session_exists on device; native Apple sheet vs browser.
- Row 5 copy: 'Who receives it'; consent version; 500 vs 403; AI limit copy; label scan exit; scan.ts vs photo capture.
- Row 9: Apple Retention access; App Store Connect key in backend/.env; approve two messages; sandbox URL and 700 ms test.
- Row 11 leftovers: Settings switch and purpose strings; real HealthKit provider (native package, entitlement, pod install); device steps; confirm 'requested' or 'not_determined' status.
- Row 13: account data label (Row 12a decision); age rating answers in App Store Connect; production demo account; confirm lume.fit/support and lume.fit/privacy are live.
- Tooling: react-test-renderer deprecation; gesture-handler warning; Prettier; privacy label; push and CI; E2E account needs 250+ gym dates; npm audit (expo-notifications); pod install before notification prompt.
- Simulator checks: 401 after Clerk expiry; signup; launch; paywall; Total tile; Row 6 numbers; Row 14 gym line offline.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b items; HealthKit device steps.

## Decisions (never delete)
- Onboarding: target weight optional server side; resumed Back goes to previous step; goal change with hand-set calories asks to update target; sign up errors inline; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Export, delete, disconnect, privacy work without subscription. Public: auth, webhook, subscription and offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; consent read error 500; Allow and Not now equal weight; plain 429 queueable; only ai_daily_limit_reached non-retryable.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial gives every feature; no free tier. Billing issue keeps access through grace. REFUND_REVERSED restores state from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. Banner reads server record, past_due only. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag default off; message keys only; fixtures until owner access; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot, once per day; 7 day window; quiet hours 22:00 to 07:00 (15 minute steps); meal and streak dropped in quiet hours; workout and weekly move to quiet end; promotional needs own opt in; all off by default. Permission asked only after priming says yes. expo-notifications imported only in permissions.ts and device.ts. Every reschedule goes through rescheduleToday or runDailySchedule; neither prompts.
- Push token: saved in secure storage after 204 (STORAGE_KEYS.pushToken, not wiped at sign-out); re-registered from ClerkBridge once per signed-in user; sign-out deletes saved copy only after DELETE succeeds; API client treats 204 as success.
- Analytics off by default. Retry label 'Try again'. English only for new keys. Stepper labels: common.decrease and common.increase.
- Row 11: no denied state for reads; reads return null when not granted or no data. Interface and mock provider done. Real provider waits for native package approval and pod install.
- Row 13: APP_STORE_METADATA.md is English only. It follows PRIVACY_DATA.md and app.json; analytics described as off until turned on; Gemini is the default photo AI; crash data not linked to user. Support and privacy URLs come from web/lib/site.ts.
- Render test expo-notifications stub: src/__tests__/render/setup.ts. Node Jest maps expo-notifications to src/__tests__/mocks/expoNotifications.ts (package.json).
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify.
- Protected: src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.

## Parked
- DELETE after session ends gets 401; stale row stays. Stale push tokens never removed. Failed POST not retried in the same session. Two push token test files to merge.
- Leaving screen not in a full non-silent run. Meal median across midnight averages to midday. Quiet hours stepper does not wrap at midnight.
- Expired session clears reminders until next foreground. Nothing derives per-slot meal times at app start.
- Node Jest expo-notifications mock lacks getDevicePushTokenAsync.
- Past_due may show two Manage buttons. Pull-to-refresh skips subscription.
- Hardcoded strings: body emoji 26, A$, 'Your data', server limit message, Stepper labels.
- About 68 console errors need scoped spies. Two useApi copies; import cycle mutations.ts and hooks.ts.
- Missing tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Hotspots: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; getMorningBrief, getProfile, getAnomalies, dismissAnomaly swallow errors.
- appleHealth.ts has write types and its own API: merge into the real provider later, park the write path.
- Root config and backend JS unlinted; verify:go lacks -count=1.

## Gotchas
- Branch check first (git branch --show-current only). Full Jest paths for single files; never jest -u; use --ci; redirect output to files.
- Lint: no setState in effect body; use guarded .then.
- Skeleton screens need per-file LoadingSkeleton mock. Typed routes lack /profile/winback and /profile/leaving: use navigate().
- Expo-notifications is native: mock in tabs layout tests. Render tests must be *.render.test.tsx.
- Go entitlement tests need LUME_TEST_DATABASE_URL on lume_test_local.

## Round log
- Round 60: full checkpoint clean. tsc 0; Jest 322 suites, 2,008 tests, 4 snapshots.
- Round 61: Row 10 closed as BUILT with owner checks.
- Round 63: Row 11 follow-up; read denial dropped. Flagged again; leftovers parked, Row 11 BUILT with owner check pending.
- Round 64: Row 13 store content drafts (English) written; status BUILT. Report had no type check or Jest run.
- Round 65: loop flagged Round 64 as not run. Gate run set as the task; Row 13 stays BUILT until it is green.