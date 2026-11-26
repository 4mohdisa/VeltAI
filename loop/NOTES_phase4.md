# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push, merge or switch.

## Overrides (Isa)
1. English only for new strings. es and fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 15-30, then 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done gets ONE follow-up. Flagged again: park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule. Every round runs tsc first.
8. Flagged work: run its tests before any new task.
9. Changes outside named files: check scope, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.
11. Checkpoint rounds: full tsc and full Jest, no edits. About every 5 rounds (next due Round 182).

## State (Round 179)
- BUILT (17 of 39): 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 14b, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 15, 31. DIFFERENT: 16-28, 30.
- Round 177 checkpoint green: tsc 0, Jest 350/350 suites, 2,190 tests.

## Row 15 (in progress)
- Done: gym 77.9, recipes 82.1, integrations 88.4, scan 79.3, food 84.0, auth 87.7.
- Order (Round 170): debugreports (0, Round 179), analytics (63.4), then scan and gym leftovers.
- Scan leftovers: runScanPipeline 50.0, Register 66.2, CalibrationReport 60.0.
- Food leftovers: summary 66.7, listSaved 57.1, dietaryScore 61.9, optFloat 44.4, toFloat 60.0.
- Auth leftover: RegisterWebhook 68.6, error branches.
- Gym leftovers: patchSession, patchExercise, lastLogged, listTemplates.
- Measure: go test -coverpkg=./internal/<pkg> ./... (plain -cover undercounts).
- Shared test helper (testPool, testUser) duplicated in gym, recipes, integrations, food. Needs Isa approval.
- tests/scan/learning_store_pg_test.go kept (test only). Isa may move it.

## Parked (fix only in its row)
- Scanned food log delete fails: scan_sessions.food_log_id has no ON DELETE rule (food/pg.go:145). Needs migration.
- Recipe and saved meal ORDER BY random UUID (pg.go:126, 292). Needs migration.
- Integrations: sync stops at 50 Strava or 25 WHOOP items. Expired token with no refresh gives 502. WHOOP external user ID never set.
- Recipe and saved meal log do not validate meal_type.
- Food: UpsertPortionPref with empty meal type can wipe typical_meal_type.
- Feedback 14a: wire or delete the chip before Row 31. Also feature_rated analytics, Settings feedback screen, Ask me switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md.
- Legal: web/lib/legal.ts lacks push, Sentry, PostHog. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'.
- Measurements Back: postAuth.ts:28 resume path. Check in row 23.
- Shared helper 'open Apple page, else toast' (subscription, delete-account, leaving).
- Push: DELETE after 401; stale tokens; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours do not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sorts then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Food UI: energy 'not enough days' has no action; paywall re-posts answers; search 'Add custom food' does not log; goBackOrHome falls back to Today; saved list drops meal slot; delete-account.tsx:101 white on white (device).
- Code: hardcoded strings; ~68 console errors; two useApi copies; mutations.ts and hooks.ts cycle; reanimated mock lacks useReducedMotion; SLOTS copies; mappers.ts duplicate.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep no-consent; Training axisLetters fixture.
- Config: root and backend JS unlinted.
- Docs: README and HOSTING_CHECKLIST must say export LUME_TEST_DATABASE_URL before npm run verify.

## Blocked on Isa (park, do not retry)
- Approve scanned food log delete fix (migration). Approve recipe ingredient order fix (migration). Approve integration sync paging fix.
- Approve or move tests/scan/learning_store_pg_test.go. Approve shared test helper package.
- Copy: consent, win back, leaving; target weight required; resend cooldown; paywall terms; Terms describe free tier; gym.freeze.confirm_one es and fr; dashboard.weekNoNetMessage and energyAddBodyStats wording; body stats hint; Fixes 24, 25, 12 option B; dashboardNutrition.render.test.tsx:102.
- Gym TestPG t.Skip when no database (ruling needed). Coverage scope: cmd/server, scripts, tools/*, internal/db.
- Apple and RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS key; native Apple sheet vs browser; Clerk session_exists on device.
- Push: category strings, defaults, quiet hours wording, token retention, DELETE gating.
- HealthKit: Settings switch, purpose strings, provider, device steps.
- Labels: Email, Name, User ID; push token manifest type.
- Store: age rating, production demo account, lume.fit URLs.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, foodDays.test.ts (add branches only). loop/DECISIONS_LOG.md and loop/NOTES_phase4.md are loop files.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; training days on backend; Continue never disabled; calorie floor 1500 (1200 female); 401 ends session.
- Launch gate: 402 opens /onboarding/paywall; paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Deletion: Clerk first, then rows; Clerk 404 counts as deleted.
- AI consent: server gate first; Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Billing: only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages.
- Retention: flag off by default; no food, body or workout values to analytics.
- Notifications: all off by default; permission only after priming says yes.
- Health: no denied state for reads; null when not granted.
- Analytics off by default. Snapshots edited by hand, never with -u.
- Fix 12 option A. Training energy card: Monday to today via weekOf.
- New strings: English only; add each key at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Round 167: dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle stay English only.
- Round 169: measurements Back unchanged (signed in skip locked by onboardingSignedInBack test).
- Round 170: Row 15 order gym, recipes, integrations, scan, debugreports, analytics, auth, food.
- Round 171: verify:go fails when LUME_TEST_DATABASE_URL is unset; no silent skip in the gate.
- Round 172: checkpoint is read only (tsc, full Jest, go vet).
- Round 176: food done at 84.0. Kept tests/scan/learning_store_pg_test.go (test only).
- Round 178: auth done at 87.7 (Jev's pick accepted). No production change.
- Round 179: debugreports next by Round 170 order (0 percent). Analytics follows.

## Gotchas
- Jest: full paths with --ci, output redirected, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'. zsh needs xargs -0 for 350 paths.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock Clerk in any test rendering welcome. expo-notifications is native: mock in tabs layout tests.
- Pin dates with jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- Gym is src/app/(tabs)/gym.tsx; Nutrition is src/app/dashboard/nutrition.tsx; food screens are under src/app/food/.
- Go TestPG needs LUME_TEST_DATABASE_URL on the command line only, never written to a file.
- Go tests that wait on client disconnect can hang under -race. Use a release channel.
- Round numbers in DECISIONS_LOG.md differ from PHASE4_ROWS.md. Use PHASE4_ROWS.md.

## Round log
- 60-124: rows 10-14 closed; 14a parked; 14b Fixes 1-15b.
- 128-157: Fixes 16-28 except 24, 25; 26a and 26b built.
- 158, 160, 163, 167, 172, 177: checkpoints green.
- 164-166: cleanup. 168: Row 14b closed.
- 169-171: Row 15 steps 1-2, verify:go gate.
- 173-176: Row 15 recipes, integrations, scan, food (84.0).
- 178: Row 15 auth (87.7).
- 179: Row 15 debugreports (in progress).