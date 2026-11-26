# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push, merge or switch.

## Overrides (Isa)
1. English only for new strings. es and fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 16-30, then 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done: one follow-up, then park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Branch rule in every prompt. Every round runs tsc first.
8. Flagged work: run its tests before any new task.
9. Out of scope changes: check, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.
11. Checkpoint about every 5 rounds (tsc, full Jest, go vet, no edits). Next checkpoint: Round 194.

## State (Round 191)
- BUILT (18 of 39): 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-15, 14b, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 16, 31. DIFFERENT: 17-28, 30.
- Row 16: step 1 done (102 routes). Step 2 done (all ownership groups incl. insights dismiss). Step 3 (validation and error envelope, tests/food and tests/gym) in progress.
- Row 15 owner check pending: coverage scope ruling.

## Parked (fix only in its row)
- Debug reports: context null saved as null (debugreports.go:61); retry skips captured_at, trigger, route, versions.
- Food: scanned log delete fails (scan_sessions FK, needs migration); UpsertPortionPref can wipe meal type; search 'Add custom food' does not log; goBackOrHome falls back to Today; delete-account.tsx:101 white on white (device).
- Recipes: ORDER BY random UUID; PATCH skips ingredient and number checks (recipes.go:187); meal_type not validated. Row 18: recipes.authorize copies food.authorize.
- Insights: DismissInsight updates by id only (safe via handler owner check); add user_id to query with approval.
- Integrations: sync stops at 50 Strava or 25 WHOOP items; expired token gives 502.
- Gym complete handler reads body only when ContentLength != 0.
- Test helpers: seedMealLog and seedDay leave profiles (Row 25); signedTokens and seedOwner copied per package; DB pool helper has 8 copies.
- Feedback 14a: wire or delete chip before Row 31; feature_rated analytics, Settings screen, Ask me switch, npm run feedback, PRIVACY_DATA.md.
- Legal: web/lib/legal.ts lacks push, Sentry, PostHog; LegalScreen hardcodes dates and PENDING text.
- Measurements Back: postAuth.ts:28 resume path (check in row 23).
- Push: DELETE after 401; stale tokens; failed POST not retried. Schedules: meal median across midnight; quiet hours do not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text; schedule_pg.go sorts then LIMIT 30; errors swallowed in getMorningBrief, getProfile, getAnomalies; gym patchSession, patchExercise, lastLogged, listTemplates barely covered.
- Server loads .env from working folder; PORT without LUME_ENV counts as production (document in Row 30).
- tests/smoke has hand written route copy: replace with Row 16 table.
- Code: hardcoded strings; 158 console warn and error calls in Jest; two useApi copies; reanimated mock lacks useReducedMotion; mappers duplicate; root and backend JS unlinted.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep no-consent.
- Docs: README and HOSTING_CHECKLIST need LUME_TEST_DATABASE_URL before npm run verify.

## Blocked on Isa (park, do not retry)
- Approvals: food delete migration; recipe order migration; integration paging; null context fix; tests/scan/learning_store_pg_test.go; shared test helper; Gym TestPG skip ruling; coverage scope; bug fixes above; insights user_id hardening.
- Copy: consent, win back, leaving; target weight; resend cooldown; paywall terms; Terms free tier; gym.freeze.confirm_one (es, fr); dashboard.weekNoNetMessage; dashboard.energyAddBodyStats; body stats hint; Fixes 24, 25, 12 option B; dashboardNutrition.render.test.tsx:102.
- Apple and RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS key; native Apple sheet; Clerk session_exists on device.
- Push: category strings, defaults, quiet hours wording, token retention. HealthKit: Settings switch, purpose strings, device steps.
- Store: age rating, production demo account, lume.fit URLs, Email/Name/User ID labels.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

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
- Row 16: route list read from source; 401 test runs real cmd/server from a temp folder; one package group per round; token helper copied until shared helper approved.
- Round 181: Row 15 BUILT with owner check pending. Round 169: measurements Back unchanged. Round 171: verify:go fails when LUME_TEST_DATABASE_URL unset.
- Round 188: body weight DELETE is the last id route in goals; integration routes take a provider name, not an id.
- Round 191: Jev ask and stop signals not followed; no Isa blocker stops the loop.

## Gotchas
- Jest: full paths with --ci, output redirected, never jest -u. Wrap with perl -e 'alarm N; exec @ARGV'. Long path lists: xargs -0.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock Clerk when a test renders welcome. Mock expo-notifications in tabs layout tests.
- Pin dates: jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- Go TestPG needs LUME_TEST_DATABASE_URL on the command line only.

## Round log
- 182-186: Row 16 step 1 done; food and gym ownership green.
- 187: recipe and saved meal ownership, safe.
- 188: body weight ownership in goals, safe. No leaks found.
- 189: checkpoint green (tsc 0, Jest 350/350 suites, 2190 tests, go vet clean). No edits.
- 190: insights dismiss ownership test, safe. Step 2 complete.
- 191: started Row 16 step 3 (validation and envelope, food and gym).