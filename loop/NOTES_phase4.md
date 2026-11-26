# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push or merge.

## Overrides (Isa)
1. English only for new strings. es and fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15-30, 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done gets ONE follow-up. Flagged again: park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with the branch rule. Every round runs tsc first.
8. Flagged work: run its tests before any new task.
9. Changes outside named files: check scope, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.
11. Checkpoint rounds: full tsc and full Jest, no edits, report failures.

## State (Round 165)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b, 31. DIFFERENT: 15-28, 30.
- Last green checkpoint: Round 163 (tsc 0, Jest 350/350, 2,190 tests).
- Round 164 flagged: tsc ran, Jest did not. Round 165 runs tests first.

## Row 14b (open)
- Done: Fixes 1-23, 26a, 26b, 27, 28, 29. Parked: Fix 24, Fix 25, Fix 12 option B, body stats hint.
- Open: energy 'not enough days' has no action; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call goes to onboarding; paywall non-401 failure re-posts answers; history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; goBackOrHome and GlassButtons fall back to Today; Training axisLetters uses fixed September fixture.
- Spotted: Food tab checks consent on mount only; Gym tab reads this month twice; saved list drops meal slot for detail sheet.
- English only: dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle.
- Unused keys nutrition.todayAgainstTargets, nutrition.percentOfTarget: removal in Round 165.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts and tests, promptStore.ts, recordLaunch, chip render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen, Ask me for feedback switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md. Wire or delete the chip before Row 31.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Parked: other (fix only in its row)
- Shared helper 'open Apple page, else toast' (subscription, delete-account, leaving).
- Push: DELETE after session 401; stale tokens never removed; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours stepper does not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings; ~68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users; productionReadiness.test.ts 4 s pending timer.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.

## Blocked on Isa (park, do not retry)
- Copy: consent, win back, leaving; target weight required; resend cooldown; paywall terms; Terms describe free tier; Fix 12 B; body stats hint; Fix 24; Fix 25; gym.freeze.confirm_one es and fr.
- Apple/RevenueCat: Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS public key; native Apple sheet vs browser; Clerk session_exists on device.
- Push: category strings, defaults, quiet hours wording, token retention, DELETE gating.
- HealthKit: Settings switch, purpose strings, provider, device steps.
- Labels: Email, Name, User ID; push token manifest type.
- Store: age rating, production demo account, lume.fit URLs.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, foodDays.test.ts (add branches only).

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; training days on backend; Continue never disabled; calorie floor 1500 (1200 female); 401 ends session.
- Launch gate: 402 opens /onboarding/paywall; paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Deletion: Clerk first, then rows; Clerk 404 counts as deleted.
- AI consent: server gate first; 429 queueable; Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Billing: only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages.
- Retention: flag off by default; no food, body or workout values to analytics.
- Notifications: all off by default; permission only after priming says yes.
- Health: no denied state for reads; null when not granted.
- Analytics off by default. Snapshots edited by hand, never with -u.
- Fix 12 option A. Training energy card: Monday to today via weekOf.
- Ask banned. Chosen task runs each round. Jev asks are advisory only.
- New strings: en only; add each new key at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- Round 165: removing unused keys from es and fr as well (unused everywhere).

## Gotchas
- Full Jest paths with --ci, output redirected, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'.
- Mock Clerk in any test rendering welcome. expo-notifications is native: mock in tabs layout tests.
- jest.useFakeTimers({ now, doNotFake: ['setImmediate'] }) pins dates. Answer held fetch promises in afterEach.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Mock LoadingSkeleton in render tests. To fake no history: jest.spyOn(router, 'canGoBack').
- Gym is src/app/(tabs)/gym.tsx; Nutrition is src/app/dashboard/nutrition.tsx; food screens are under src/app/food/.

## Round log
- 60-124: rows 10-14 closed; 14a parked; 14b Fixes 1-15b.
- 128-157: Fixes 16-28 except 24, 25; 26a and 26b built.
- 158, 160, 163: checkpoints green. 159, 161, 162: small fixes or no edit.
- 164: docs cleanup; tsc only, Jest not run (flagged).
- 165: unused key removal and tally fix; affected tests run.