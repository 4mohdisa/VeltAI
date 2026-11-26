# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only. Never push or merge.

## Overrides (Isa)
1. English only; es/fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15-30, 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done gets ONE follow-up; flagged again: park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with branch rule. Every round runs tsc first.
8. Untested flagged work: run its tests before any new task.
9. Changes outside named files: check scope, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.
11. Checkpoint rounds: full tsc and full Jest, no edits, report failures.

## State (Round 162)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b, 31.
- DIFFERENT: 15-28, 30.
- Round 160 checkpoint green: tsc 0, Jest 350/350 suites, 2,190 tests.

## Row 14b (open)
- Done: Fixes 1-20, 26a, 26b, 27, 28, 29.
- Parked: Fix 24, Fix 25, Fix 12 option B, body stats hint (Week 'No net yet' and energyAddBodyStats both say 'in onboarding').
- Open: nutrition.todayAgainstTargets and percentOfTarget unused; Energy 'not enough days' has no action; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call goes to onboarding; paywall non-401 failure re-posts answers; history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; goBackOrHome and GlassButtons fall back to Today; Training axisLetters uses fixed September fixture; Row 14b lacks Fix 26a entry; DESIGN_INTENT.md has duplicate Fix 20 Done line.
- Spotted: Food tab checks consent on mount only; Gym tab reads this month twice; saved list does not pass meal slot to detail sheet.
- English only: dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle, gym.freeze.confirm_one.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts with tests, promptStore.ts, recordLaunch, FeatureFeedbackChip render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen, Ask me for feedback switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md. Wire or delete the chip before Row 31.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Parked: other (fix only in its row)
- Shared helper for 'open Apple page, else toast' (subscription, delete-account, leaving).
- Push: DELETE after session 401; stale tokens never removed; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours stepper does not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings; about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate.
- Tests: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.
- Docs: PHASE4_ROWS.md round log stops at Round 61; DESIGN_INTENT.md duplicate Fix 20 line.

## Blocked on Isa (park, do not retry)
- Copy and sign-offs: consent, win back, leaving copy; target weight required; resend cooldown; paywall terms wording; Terms describe a free tier; Fix 12 option B; body stats hint; Fix 24; Fix 25; gym.freeze.confirm_one translation.
- Apple and RevenueCat: Apple Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS public key; native Apple sheet vs browser; Clerk session_exists on device.
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
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Paywall checks server record first. No record and no answers goes to /onboarding/goal.
- Units saved to settings store on measurements Continue via setUnit.
- Macros split from adjusted calorie target, one shared helper each side.
- Leaving survey via feedback API (category account, leaving_reason key, no note). Manage subscription via existing helper.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows. Clerk failure gives 502 and keeps rows. Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; 429 queueable; only ai_daily_limit_reached non-retryable. Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Billing: only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. REFUND_REVERSED restores from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag off by default; message keys only; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00-07:00; all off by default; permission only after priming says yes.
- Push token: secure storage after 204. Sign-out deletes saved copy only after DELETE succeeds.
- Health: no denied state for reads; null when not granted or no data.
- Legal: copy in en.json; UPDATED date literal stays. Crash data not linked to user.
- Analytics off by default. Stepper labels: common.decrease, common.increase.
- Fix 12 option A; option B parked. Training energy card: Monday to today via weekOf (shared helper in foodDays.ts).
- Fix 26a scope widened to detailSubject.ts (round 154): kept, needed for the type.
- Snapshots edited by hand, never with -u.
- Ask banned. Chosen task run each round. Jev asks are advisory only.
- English only for new strings (Isa). Missing es/fr keys fall back to English.

## Gotchas
- Full Jest paths with --ci, redirect output, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'.
- Mock Clerk in any test rendering welcome (Jest hangs). expo-notifications is native: mock in tabs layout tests.
- jest.useFakeTimers({ now, doNotFake: [...] }) pins dates and keeps setImmediate.
- Held fetch promises need an afterEach that answers them (API client arms a 15 s timer).
- Each new key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Skeleton needs reanimated's useReducedMotion; tests mock LoadingSkeleton.
- Gym is src/app/(tabs)/gym.tsx; Nutrition is src/app/dashboard/nutrition.tsx; food screens are under src/app/food/.

## Round log
- 60-124: rows 10-14 closed; 14a parked; 14b Fixes 1-15b done.
- 128-152: Fixes 16-28 done except 24, 25 (parked); training energy card; leak fixed.
- 153-157: Fix 26a and 26b built.
- 158, 160: checkpoints green (tsc 0, Jest 350/350).
- 159: gym.freeze.confirm plural fix (confirm_one, confirm_other).
- 161: Week copy item found blocked on Isa's ruling; no edit.
- 162: tsc first, then fix pending 4 s timer in productionReadiness.test.ts (flagged, untested).