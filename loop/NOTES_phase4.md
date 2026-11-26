# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15-30, 31.
4. One screen or component per prompt, max 5 steps. A rejected prompt counts as a failed attempt.
5. Partly done gets ONE follow-up; flagged again: park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule. Every round runs tsc first.
8. Untested flagged work: run its tests before any new task.
9. Changes outside a prompt's named files: check scope, then keep (with decision) or revert.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked), 7 (7c parked), 8 (Maestro not run), 9 (leaving reason parked), 14a (chip unwired), 14b (open).
- Last green full suite: Round 124 (346 suites, 2,108 tests). Next checkpoint: Round 135 (handover).
- Untested flagged work: Fix 16 (round 128), see Blocked.

## Blocked on Isa (park, do not retry)
- Fix 16 (round 128): automatic check flagged it twice (tsc or tests not confirmed). Parked. Round 135 full suite is the recheck.
- Rows 5, 8, 9: consent copy, win back and leaving copy, Apple Retention access, sandbox URL, expired, cancelled, past_due runs, 7c iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE gating.
- Row 11: Settings switch, purpose strings, HealthKit provider, device steps.
- Row 12a: Email, Name, User ID labels; push token manifest type. Row 13: age rating, production demo account, lume.fit URLs.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications); Jest worker force-exit.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Row 14b (open)
- Done: Fixes 1-15b. Fix 12 option A. Fix 15a consent returns to asker. Fix 15b ai-query Back falls back to Food. Fix 16 insights error with Retry (round 128, flagged, see Blocked).
- Next: Fix 17 welcome sign-in for signed-in user with no record (round 129). Then Fix 18: Food tab insights before consent (food.tsx:202).
- Unfixed (fold into a fix or park at closure): targets reuses earlier calorie target; food quantity and energy units not asked in onboarding; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call sends signed-in user to onboarding; paywall non-401 record failure re-posts answers; gym tab no logged pill (look change, parked); history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; 'no matches' does not prefill name; saved.tsx meal from + not passed; food calorie card past days (option B, post launch); Manage subscription open-or-toast in three places; goBackOrHome falls back to Today (parked).
- Isa rulings pending: Fix 24 (training-days step), Fix 25 (duplicate Profile rows). Do not remove until ruled.
- Owner decisions pending: Terms describe a free tier; per-set gym history needs a backend change.
- At closure: drop stale 'Barcode, Scan and label scan still open' note from PHASE4_ROWS.md.
- Tooling: en.json fails Prettier; detail.tsx and foodDetailLogged test fail Prettier at HEAD. Never --write.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts with tests, promptStore.ts, recordLaunch, FeatureFeedbackChip with render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen, Ask me for feedback switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md. Wire or delete the chip before Row 31.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Parked: other (fix only in its row)
- Shared helper for 'open Apple's page, else failure toast' (subscription.tsx, delete-account.tsx, leaving.tsx).
- Leaving feedback rows grouped only by the leaving_reason: prefix.
- Push: DELETE after session 401; stale tokens never removed; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours stepper does not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings; about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate; backOrFood duplicated in ai-consent and ai-query (shared helper in nav.ts).
- Tests missing: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, foodDays.test.ts (add branches only).

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Paywall checks server record first. No record and no answers goes to /onboarding/goal.
- Units saved to settings store on measurements Continue via setUnit.
- Macros split from adjusted calorie target on client and server (one shared helper each).
- Leaving survey via feedback API (category account, leaving_reason: key, no note, no migration). Manage subscription via existing helper.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows. Clerk failure gives 502 and keeps rows. Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; 429 queueable; only ai_daily_limit_reached non-retryable. Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Billing: only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial, no free tier. REFUND_REVERSED restores from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag off by default; message keys only; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00-07:00; all off by default; permission only after priming says yes.
- Push token: secure storage after 204 (STORAGE_KEYS.pushToken). Sign-out deletes the saved copy only after DELETE succeeds.
- Health: no denied state for reads; null when not granted or no data.
- Legal: copy in en.json; UPDATED date literal stays (manifest pins it). Crash data not linked to user.
- Analytics off by default. Stepper labels: common.decrease, common.increase.
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.
- Meal reaches detail sheet through subject store, never a route param. Summary Today always shows today.
- Throttle never reads the clock; callers pass now. Launch counter uses module-level flag.
- Gym prefill: top set only, last 90 days; removing every set unticks the exercise.
- Prettier on en.json: not reformatted.
- Round 120: stale handover Next ignored. Round 122: Fix 12 option A; option B parked post-launch. Round 123: Fix 13 chosen. Round 124: checkpoint green.
- Round 126: Fix 15a. Consent Back and Not now go back, not to the origin, to avoid a loop.
- Round 127: Fix 15b. ai-query keeps its own header; Back fallback changed in place.
- Round 129: Welcome chosen over Fix 18 (Food insights). Fix 18 reads through useInsights, the hook changed in Fix 16 that was flagged, so it depends on the unverified work. Jev's 83% pick was for Fix 18; kept the welcome fix for this reason.

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u. Wrap Jest: perl -e 'alarm N; exec @ARGV'. In zsh pass many paths through xargs.
- Lint: no setState in effect body; use guarded .then. Render tests: *.render.test.tsx.
- Mock Clerk to avoid the MessagePort that stops Jest exiting. expo-notifications is native: mock in tabs layout tests.
- Paywall is src/app/onboarding/paywall.tsx; paywall render tests live in src/__tests__/render/.

## Round log
- 60-124: rows 10-14 closed; 14a parked at step 4; 14b Fixes 1-15b done; checkpoint green at 124.
- 128: Fix 16 done, flagged by automatic check, parked under Blocked.
- 129: Fix 17 welcome (running). Fix 18 Food insights next.