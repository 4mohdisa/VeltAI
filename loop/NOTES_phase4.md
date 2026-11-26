# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15 to 30, 31.
4. One screen or component per prompt, max 5 numbered steps. A rejected prompt is a failed attempt.
5. Partly done gets ONE follow-up; flagged again: park leftover, move on.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule. Every round runs tsc first.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 13, 14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (code done, Maestro not run); 9 (leaving reason parked); 14a (chip unwired).
- Checkpoints green at Rounds 66 and 80 (325 suites, 2,018 tests).

## Row 14b (current)
- DESIGN_INTENT.md done: nav map, four answers per screen, key numbers, Fix list (28 SMALL, 6 POST LAUNCH).
- Fix 1 (meal slot): Search, barcode scanner, barcode detail sheet, Scan again DONE (R88-R92). Label scan: R94 (label-scan.tsx reads slot param).
- Open: Food tab Photograph label must pass ?slot (food.tsx, next); detail-sheet log does not clear ?slot; quick-add, add, saved repeat inline slot check (switch to slotFromParam); food.tsx keeps a duplicate SLOTS list (mappers.ts too).
- Fix order after Fix 1: Summary 'Today' after browsing; gym set removal; top-set-only save; recipes unreachable; then list order.
- Pending Isa rulings: Fix 24 (training-days step), Fix 25 (duplicate Profile rows). Do not remove until ruled.
- Owner decision logged: Terms free-tier contradiction.
- Follow-ups: delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed backend call sends signed-in user to onboarding.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts and tests, promptStore.ts, recordLaunch, FeatureFeedbackChip with render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen and route, 'Ask me for feedback' switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md.
- Known: chip unwired (wire or delete before Row 31); reads state once on mount; save result ignored.

## Next
- Checkpoint: count console.warn suites (164 now, 82 at Round 66).
- terms.tsx onto legal.terms keys; health disclaimer; paywall subscription terms.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Blocked on Isa (park)
- Rows 5, 8, 9: consent copy and version, recipients; win back and leaving copy, price; Apple Retention access; App Store Connect key; sandbox URL; Maestro install; expired, cancelled, past_due runs; 7c needs iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE public or gated, pod install.
- Row 11: Settings switch, purpose strings, real HealthKit provider, device steps.
- Row 12a: Email, Name, User ID label; push token manifest type.
- Row 13: age rating; production demo account; confirm lume.fit URLs live.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording.
- Tooling: react-test-renderer deprecation; gesture-handler warning; Prettier; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Parked: other (fix only in its row)
- Push: DELETE after session gets 401; stale tokens never removed; failed POST not retried; two push token test files (check before editing).
- Schedules: leaving screen not in full non-silent run; meal median across midnight; quiet hours stepper does not wrap.
- RevenueCat events ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings (body emoji, A$, 'Your data', server limit message); about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion.
- Tests missing: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.

## Protected (do not edit)
- src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, src/__tests__/foodDays.test.ts.
- foodDetail.test.ts pins exact source text for router.replace('/food/barcode-scan'); keep that call and add branches instead.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; Allow and Not now equal weight; 429 queueable; only ai_daily_limit_reached non-retryable. Insights go to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial, no free tier. Billing issue keeps access through grace. REFUND_REVERSED restores from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag default off; message keys only; fixtures until owner access; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00 to 07:00; meal and streak dropped in quiet hours; workout and weekly move to quiet end; promotional needs own opt in; all off by default; permission only after priming says yes. expo-notifications only in permissions.ts and device.ts.
- Push token: secure storage after 204 (STORAGE_KEYS.pushToken, kept at sign-out); re-registered once per signed-in user; sign-out deletes saved copy only after DELETE succeeds. Native device token.
- Health: no denied state for reads; null when not granted or no data.
- Legal: copy in en.json (legal.privacy, legal.terms; paywall terms at onboarding.paywall.terms); UPDATED date literal stays (manifest pins it). Crash data not linked to user.
- Analytics off by default. Stepper labels: common.decrease and common.increase.
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.
- Meal reaches the detail sheet through the subject store, never a route param.
- Clearing the Food tab search drops ?slot.
- Throttle module never reads the clock; callers pass now. Launch counter uses a module-level flag.
- Round 90 flagged partly done; Round 91 follow-up completed the barcode detail meal. Further leftovers go to the Fix list, not new follow-ups.
- Jev: round 93 run chosen; risk 1.1 advisory only.
- Round 94: prompt rewritten to one screen (label-scan.tsx) after rejection; food.tsx link deferred to next round.

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u.
- Lint: no setState in effect body; use guarded .then.
- Skeleton screens need per-file LoadingSkeleton mock. Use navigate() for /profile/winback and /profile/leaving.
- expo-notifications is native: mock in tabs layout tests. Render tests are *.render.test.tsx.
- Go entitlement tests need LUME_TEST_DATABASE_URL on lume_test_local.
- Mocking Clerk avoids a MessagePort that stops Jest exiting. SafeAreaProvider hides children without initialMetrics.
- macOS has no timeout command: wrap Jest in perl -e 'alarm N; exec @ARGV'.

## Round log
- 60-80: rows 10, 11, 12a, 13, 14 closed; checkpoints green.
- 81-86: 14a built to step 4, then parked; 14b docs written.
- 87-89: prompts rejected (multi-screen). 88: Fix 1 Search. 90: barcode scanner. 91: barcode detail sheet meal.
- 92: Fix 1 Scan again keeps the meal. 93: Fix 1 label scan takes the meal from its param: planned in R94.