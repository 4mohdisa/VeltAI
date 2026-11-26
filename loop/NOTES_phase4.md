# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push or merge.

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
11. Checkpoint rounds: full tsc and full Jest, no edits. Every ~5 rounds.

## State (Round 174)
- BUILT (17 of 39): 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 14b, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 31. DIFFERENT: 15-28, 30.
- Round 172 checkpoint green: tsc 0, Jest 350/350 suites, 2,190 tests.
- Next checkpoint: Round 177.

## Row 15 (in progress)
- Done: step 1 (BACKEND_COVERAGE.md), step 2 gym (49.8 to 77.9), step 3 recipes (26.8 to 82.1, Round 173).
- Under 70 (order): integrations 39.1 (Round 174), scan 57.3, debugreports 0, analytics 63.4, auth 69.5, food 68.9, gym handlers (patchSession, patchExercise, lastLogged, listTemplates).
- Measure with -coverpkg=./internal/<pkg> ./... (plain -cover undercounts).

## Row 30 follow-up
- README and HOSTING_CHECKLIST: export LUME_TEST_DATABASE_URL before npm run verify.
- Console noise: about 73 console.error and 85 console.warn in Jest output. Track later.

## Parked (fix only in its row)
- Recipe and saved meal ORDER BY random UUID (pg.go:126, 292): ingredients shuffle on each load. Needs migration (position column). Owner decision; in KNOWN_ISSUES and OWNER_CHECKS.
- Recipe and saved meal log do not validate meal_type.
- Duplicated testPool/testUser helpers in gym, retention, recipes tests.
- Feedback 14a: wire or delete the chip before Row 31. Also feature_rated analytics, Settings feedback screen, Ask me switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md.
- Legal: web/lib/legal.ts lacks push, Sentry, PostHog. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment.
- Measurements Back: postAuth.ts:28 resume path. Row 23 check.
- Shared helper 'open Apple page, else toast' (subscription, delete-account, leaving).
- Push: DELETE after 401; stale tokens; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours no wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sort then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Food: energy 'not enough days' no action; index.tsx:101-106; paywall re-posts answers; history isoDaysAgo duplicate; search 'Add custom food' does not log; goBackOrHome falls back to Today; Gym tab reads month twice; saved list drops meal slot; delete-account.tsx:101 white on white (device).
- Code: hardcoded strings; ~68 console errors; two useApi copies; mutations.ts/hooks.ts cycle; reanimated mock lacks useReducedMotion; SLOTS copies; mappers.ts duplicate.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep no-consent; Training axisLetters fixture.
- Config: root and backend JS unlinted.

## Blocked on Isa (park, do not retry)
- Copy: consent, win back, leaving; target weight required; resend cooldown; paywall terms; Terms describe free tier; gym.freeze.confirm_one es and fr; dashboard.weekNoNetMessage and energyAddBodyStats wording; body stats hint; Week copy; freeze es and fr; Fixes 24, 25, 12 option B; dashboardNutrition.render.test.tsx:102.
- Gym TestPG t.Skip when no database (ruling needed). Coverage scope: cmd/server, scripts, tools/*, internal/db.
- Apple/RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS key; native Apple sheet vs browser; Clerk session_exists on device.
- Push: category strings, defaults, quiet hours wording, token retention, DELETE gating.
- HealthKit: Settings switch, purpose strings, provider, device steps.
- Labels: Email, Name, User ID; push token manifest type.
- Store: age rating, production demo account, lume.fit URLs.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.
- Recipe order fix approval (see Parked).

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
- Round 173: recipes chosen over Jev's advisory view (smaller task under high risk score).
- Round 174: integrations chosen (smallest remaining in-scope package; high risk score). Recipe order fix parked, not approved by Isa, because it needs a migration.

## Gotchas
- Jest: full paths with --ci, output redirected, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'. zsh needs xargs -0 for 350 paths.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock Clerk in any test rendering welcome. expo-notifications is native: mock in tabs layout tests.
- Pin dates with jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }).
- Gym is src/app/(tabs)/gym.tsx; Nutrition is src/app/dashboard/nutrition.tsx; food screens are under src/app/food/.
- Go TestPG needs LUME_TEST_DATABASE_URL on the command line only, never written to a file.

## Round log
- 60-124: rows 10-14 closed; 14a parked; 14b Fixes 1-15b.
- 128-157: Fixes 16-28 except 24, 25; 26a and 26b built.
- 158, 160, 163, 167, 172: checkpoints green. 164-166: cleanup.
- 168: Row 14b closed. 169-171: Row 15 steps 1-2, verify:go gate.
- 173: Row 15 step 3 (recipes) done, 82.1 percent.
- 174: Row 15 step 4 (integrations) prompted.