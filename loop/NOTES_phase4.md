# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push, merge or switch.

## Overrides (Isa)
1. English only for new strings; es and fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 17-30, then 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done: one follow-up, then park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Branch rule in every prompt. Every round runs tsc first.
8. Flagged work: run its tests before any new task.
9. Out of scope changes: check, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.
11. Checkpoints about every 5 rounds (tsc, full Jest, go vet, no edits). Last: 200. Next: 204.

## State (Round 201)
- BUILT 19 of 39: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-16, 14b, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 31. DIFFERENT: 17-28, 30.
- Row 16 BUILT (201): authz table (102 routes) on the real server; owner check pending for 403 vs 404.

## Parked (fix only in its row)
- Debug reports: null context saved as null (debugreports.go:61); retry skips captured_at, trigger, route, versions.
- Food: scanned log delete fails (scan_sessions FK, needs migration); UpsertPortionPref can wipe meal type; goBackOrHome falls back to Today; delete-account.tsx:101 white on white (device).
- Food validation: POST /api/food/saved skips nutrition checks (handlers.go:399).
- Gym: POST exercises returns 200 not 201 (gym.go:396); PATCH session accepts future date and any duration (gym.go:316).
- Goals: PUT /api/goals stores any weight_goal, activity_level, source; onboarding does not check sex, activity_level, goal, units.
- Recipes: ORDER BY random UUID; PATCH skips ingredient and number checks; meal_type not validated; negative or huge macros accepted.
- Integrations: sync stops at 50 Strava or 25 WHOOP items; expired token gives 502; sync and connect check key before provider name (integrations.go:326, :371).
- Feedback 14a: wire or delete chip before Row 31; feature_rated analytics, Settings screen, Ask me switch, npm run feedback, PRIVACY_DATA.md.
- Legal: web/lib/legal.ts lacks push, Sentry, PostHog; LegalScreen hardcodes dates and PENDING text.
- Push: DELETE after 401; stale tokens; failed POST not retried. Schedules: meal median across midnight; quiet hours do not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text; schedule_pg.go sorts then LIMIT 30; errors swallowed in getMorningBrief, getProfile, getAnomalies.
- Code: hardcoded strings; 243 console.warn and console.error lines in Jest; two useApi copies; reanimated mock lacks useReducedMotion; root and backend JS unlinted.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep no-consent.
- Test helpers: signedTokens and seedOwner in 6 copies; wantErrorEnvelope in 5; DB pool helper in 7; seedMealLog and seedDay leave profiles (Row 25).
- Docs: README and HOSTING_CHECKLIST need LUME_TEST_DATABASE_URL before npm run verify.
- Row 16 validation gaps (192): parked, not fixed.

## Blocked on Isa (park, do not retry)
- Approvals: food delete migration; recipe order migration; integration paging; null context fix; tests/scan/learning_store_pg_test.go; shared test helper; Gym TestPG skip ruling; coverage scope; bug fixes above; insights user_id hardening; 403 vs 404 for another user's id (403 kept, no leak).
- Copy: consent, win back, leaving; target weight; resend cooldown; paywall terms; Terms free tier; gym.freeze.confirm_one; dashboard.weekNoNetMessage; dashboard.energyAddBodyStats; body stats hint; Fixes 24, 25, 12 option B.
- Apple and RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS key; native Apple sheet; Clerk session_exists on device.
- Push and HealthKit: category strings, defaults, quiet hours wording, token retention; HealthKit Settings switch, purpose strings, device steps.
- Store: age rating, production demo account, lume.fit URLs, Email/Name/User ID labels.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk setup; iPhone Apple sign in; Row 2b; HealthKit device steps; Row 15 coverage scope; Row 16 403 vs 404.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, backend/tests/scan/learning_store_pg_test.go. foodDays.test.ts: add branches only. loop/DECISIONS_LOG.md and loop/NOTES_phase4.md are loop files.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional; Continue never disabled; calorie floor 1500 (1200 female); 401 ends session.
- Launch gate: 402 opens /onboarding/paywall; paywallHref in src/lib/nav.ts is the only paywall link builder.
- Deletion: Clerk first, then rows; Clerk 404 counts as deleted.
- AI consent: server gate first; Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat. Trial shown only when store says eligible. No price text in Apple messages.
- Expired: Subscription, then win back, then paywall.
- Retention flag off; no food, body or workout values to analytics.
- Notifications and analytics off by default.
- Health: no denied state for reads; null when not granted.
- Snapshots edited by hand, never -u. Fix 12 option A.
- New strings English only; add key at end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Row 16: route list read from source; 401 test runs real cmd/server from a temp folder with LUME_ENV=test; token helper copied until shared helper approved.
- Row 15 BUILT with owner check pending (181). verify:go fails when LUME_TEST_DATABASE_URL unset (171).
- Body weight DELETE is the last id route in goals; integration routes take a provider name, not an id (188).
- Jev ask and stop signals not followed; no Isa blocker stops the loop (191).
- Smoke route list replaced by the authz table (197).

## Gotchas
- Jest: full paths with --ci, output redirected, never jest -u. Wrap with perl -e 'alarm N; exec @ARGV'. Long path lists: xargs -0.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock Clerk when a test renders welcome. Mock expo-notifications in tabs layout tests.
- Pin dates: jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- Go TestPG needs LUME_TEST_DATABASE_URL on the command line only.
- cmd/server loads .env from its working folder; PORT without LUME_ENV counts as production.

## Round log
- 182-198: Row 16 steps 1-3 for all route groups; authz table is the only route list.
- Checkpoints green at 184, 189, 194, 199 (tsc 0, Jest 350/350, 2190 tests, go vet clean).
- 200: Go checkpoint green (44 ok, 12 no test files, race clean, 0 failures).
- 201: Row 16 status decided BUILT. Row 17 started.
- Next: Row 17. Round 204: full checkpoint.