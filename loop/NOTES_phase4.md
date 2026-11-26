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

## State (Round 157)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b, 31.
- DIFFERENT: 15-28, 30.
- Last full green: round 154 (350 suites, 2,189 tests, tsc 0).
- DESIGN_INTENT.md Done lines are authoritative for Fix numbers.

## Row 14b (open)
- Done: Fixes 1-20, 26a, 27, 28.
- Next: Fix 26b (detail.tsx uses subject.product; lookup only when absent or on Retry). Round 157 is the one follow-up for 26a.
- Parked: Fix 24 (drop training-days step), Fix 25 (remove repeated Profile rows), Fix 12 option B, body stats hint.
- Small open: gym.freeze.confirm '1 freezes' (add _one); nutrition.todayAgainstTargets and percentOfTarget unused; Energy 'not enough days' has no action; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call goes to onboarding; paywall non-401 failure re-posts answers; history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; goBackOrHome and GlassButtons fall back to Today; Week 'No net yet' says 'in onboarding'; Training axisLetters uses fixed September fixture.
- Spotted: Food tab checks consent on mount only; Gym tab reads this month twice; saved list does not pass meal slot to detail sheet.
- English only (override 1): dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle.

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
- Code: hardcoded strings; about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate; scan upload 4 s timer leak in productionReadiness.test.ts.
- Tests missing: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.
- Docs: PHASE4_ROWS.md round log stops at Round 61; Round 145 and Fix 20 Done lines overlap in DESIGN_INTENT.md.

## Blocked on Isa (park, do not retry)
- Rows 5, 8, 9: consent copy; win back and leaving copy; Apple Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE gating.
- Row 11: Settings switch, purpose strings, HealthKit provider, device steps.
- Row 12a: Email, Name, User ID labels; push token manifest type.
- Row 13: age rating, production demo account, lume.fit URLs.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording; Fix 12 option B; body stats hint; Fix 24; Fix 25; Terms describe a free tier.
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
- Ask banned. Chosen task run each round.

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'.
- Mock Clerk in any test rendering welcome (Jest hangs). expo-notifications is native: mock in tabs layout tests.
- jest.useFakeTimers({ now, doNotFake: [...] }) pins dates and keeps setImmediate.
- Held fetch promises need an afterEach that answers them (API client arms a 15 s timer).
- Each new key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- en.json and detail.tsx fail Prettier at HEAD: never --write.
- Skeleton needs reanimated's useReducedMotion; tests mock LoadingSkeleton.

## Round log
- 60-124: rows 10-14 closed; 14a parked; 14b Fixes 1-15b done.
- 128-148: Fixes 16-23 done; training energy card; force-exit leak fixed; checkpoint green.
- 149-152: Fixes 20, 27, 28 done; 24 and 25 parked.
- 153-155: Fix 26a prompts failed (scope too narrow, then two screens). No edits.
- 154: checkpoint green.
- 156: Fix 26a built on barcode-scan.tsx plus detailSubject.ts; 7 test files pass.
- 157: Fix 26b prompt issued (detail.tsx, barcodeScan.render.test.tsx).