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
11. Checkpoint about every 5 rounds (tsc, full Jest, go vet, no edits). Next checkpoint: Round 189.

## State (Round 186)
- BUILT (18 of 39): 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-15, 14b, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 31. DIFFERENT: 16-28, 30.
- Row 16 in progress: step 1 done (route table, 102 routes: 96 PROTECTED, 6 PUBLIC). Step 2: food routes done (403 for other users, 404 unknown, owner rows unchanged). Gym routes in Round 186.
- Row 15 owner check pending: coverage scope ruling for cmd/server, scripts, tools/*, internal/db.

## Parked (fix only in its row)
- Debug reports: 'context' null saved as null (debugreports.go:61). Retry skips captured_at, trigger, route, versions.
- Scanned food log delete fails (scan_sessions FK). Migration needed.
- Recipe and saved meal ORDER BY random UUID. meal_type not validated.
- Integrations: sync stops at 50 Strava or 25 WHOOP items; expired token gives 502.
- Food: UpsertPortionPref with empty meal type can wipe typical_meal_type.
- Test helpers: seedMealLog and seedDay never delete their profiles (Row 25). signedTokens is copied per package until the shared helper is approved.
- Feedback 14a: wire or delete chip before Row 31; feature_rated analytics, Settings screen, Ask me switch, npm run feedback, PRIVACY_DATA.md.
- Legal: web/lib/legal.ts lacks push, Sentry, PostHog; LegalScreen hardcodes dates and PENDING text.
- Measurements Back: postAuth.ts:28 resume path. Check in row 23.
- Push: DELETE after 401; stale tokens; failed POST not retried.
- Schedules: meal median across midnight; quiet hours do not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text; schedule_pg.go sorts then LIMIT 30; errors swallowed in getMorningBrief, getProfile, getAnomalies. Gym patchSession, patchExercise, lastLogged, listTemplates barely covered.
- Server loads .env from its working folder; a run from backend/ loads real keys. Fix in Row 16 or 18.
- Server treats PORT as production when LUME_ENV is unset. Document in Row 30.
- tests/smoke/smoke_test.go has a hand written route copy. Replace with the Row 16 route table.
- Food UI: search 'Add custom food' does not log; goBackOrHome falls back to Today; delete-account.tsx:101 white on white (device).
- Code: hardcoded strings; 158 console warn/error in Jest output; two useApi copies; mutations and hooks cycle; reanimated mock lacks useReducedMotion; mappers duplicate; root and backend JS unlinted.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep no-consent.
- Docs: README and HOSTING_CHECKLIST say export LUME_TEST_DATABASE_URL before npm run verify.

## Blocked on Isa (park, do not retry)
- Approvals: food log delete migration; recipe order migration; integration paging; null context fix; tests/scan/learning_store_pg_test.go; shared test helper (six copies); Gym TestPG skip ruling; coverage scope.
- Copy: consent, win back, leaving; target weight; resend cooldown; paywall terms; Terms free tier; gym.freeze.confirm_one (es, fr); dashboard.weekNoNetMessage; dashboard.energyAddBodyStats; body stats hint; Fixes 24, 25, 12 option B; dashboardNutrition.render.test.tsx:102.
- Apple and RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS key; native Apple sheet; Clerk session_exists on device.
- Push: category strings, defaults, quiet hours wording, token retention. HealthKit: Settings switch, purpose strings, device steps.
- Store and labels: age rating, production demo account, lume.fit URLs, Email/Name/User ID labels.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts. foodDays.test.ts: add branches only. loop/DECISIONS_LOG.md and loop/NOTES_phase4.md are loop files.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; Continue never disabled; calorie floor 1500 (1200 female); 401 ends session.
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
- Round 167: dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle English only.
- Round 169: measurements Back unchanged. Round 171: verify:go fails when LUME_TEST_DATABASE_URL unset.
- Rounds 176-180: food 84.0, auth 87.7, debugreports 96.3, analytics 97.6 closed. Test only.
- Round 181: Row 15 BUILT with owner check pending.
- Round 183: Row 16 step 1 route list read from source; 401 test runs real cmd/server from a temp folder.
- Round 184: checkpoint green, no edits.
- Round 185: Row 16 step 2 limited to food routes (prompt size).
- Round 186: Row 16 step 2 moves to gym routes; token helper copied into tests/gym until the shared helper is approved.

## Gotchas
- Jest: full paths with --ci, output redirected, never jest -u. Wrap with perl -e 'alarm N; exec @ARGV'. Long path lists: xargs -0.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock Clerk when a test renders welcome. Mock expo-notifications in tabs layout tests.
- Pin dates: jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- Go TestPG needs LUME_TEST_DATABASE_URL on the command line only. Measure: go test -coverpkg=./internal/<pkg> ./...

## Round log
- 60-157: rows 10-14, 14b, Fixes 1-28 (except 24, 25).
- 158-181: checkpoints green; Row 15 closed.
- 182: checkpoint green. 183: Row 16 step 1 done.
- 184: checkpoint green (tsc, full Jest 350 suites, go vet).
- 185: Row 16 step 2 food routes ownership tests, all safe.
- 186: Row 16 step 2 gym routes. Next checkpoint 189.