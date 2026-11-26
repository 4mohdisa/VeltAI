# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred. Missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15-30, 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done gets ONE follow-up; flagged again: park the leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with branch rule. Every round runs tsc first.
8. Untested flagged work: run its tests before any new task.
9. Changes outside a prompt's named files: check scope, then keep (with decision) or revert.
10. Notes under 600 words. Reply JSON only.

## State (Round 149)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b (open), 31 (open).
- DIFFERENT: 15-28, 30.
- Round 148: force-exit leak fixed (held fetch timers in goalsPlan and preferencesFood render tests). Full run 350 suites, 2,182 tests, tsc 0, no force-exit warning.
- Round 149: PHASE4_ROWS.md refresh (prompt sent).

## Blocked on Isa (park, do not retry)
- Rows 5, 8, 9: consent copy; win back and leaving copy; Apple Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE gating.
- Row 11: Settings switch, purpose strings, HealthKit provider, device steps.
- Row 12a: Email, Name, User ID labels; push token manifest type.
- Row 13: age rating, production demo account, lume.fit URLs.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording; Fix 12 option B; body stats hint; Fix 24 (drop training-days step); Fix 25; Terms describe a free tier.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications).
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Row 14b (open)
- DESIGN_INTENT.md is authoritative for numbering. Fixes 1-23 done.
- Parked: Fix 24, Fix 25, Fix 12 option B, body stats hint.
- Next: Fix 26 onward per DESIGN_INTENT.md. If none is buildable, close 14b as BUILT with owner checks.
- Small open items: gym.freeze.confirm '1 freezes' (add _one); nutrition.todayAgainstTargets and percentOfTarget unused; Energy 'not enough days' needs an action; targets reuses earlier calorie target; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call sends signed-in user to onboarding; paywall non-401 failure re-posts answers; gym tab no logged pill (parked look change); history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; 'no matches' does not prefill name; food calorie card past days (option B, post launch); goBackOrHome and GlassButtons fall back to Today (parked); Week 'No net yet' says 'in onboarding' (body stats hint).
- Spotted: Food tab checks consent on mount only. Gym tab reads this month twice. Saved list does not pass meal slot to detail sheet. src/lib/mock/data.ts:27 says 2 freezes; real cap is 1 (protected file, do not edit).
- English only (fine under override 1): dashboard.weekPickedNet, dashboard.weekPickedNoNet, nutrition.weekGramsTitle.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts with tests, promptStore.ts, recordLaunch, FeatureFeedbackChip render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen, Ask me for feedback switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md. Wire or delete the chip before Row 31.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Parked: other (fix only in its row)
- Shared helper for 'open Apple's page, else failure toast' (subscription, delete-account, leaving).
- Push: DELETE after session 401; stale tokens never removed; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours stepper does not wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go sorts oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings; about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate; back-or-Food duplicated (shared helper in nav.ts); production test scan upload 4 s timer may leak on slow machines.
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
- Leaving survey via feedback API (category account, leaving_reason: key, no note). Manage subscription via existing helper.
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
- Fix 12 option A; option B parked post-launch. Training energy card: Monday to today via weekOf (shared helper in foodDays.ts).
- Jev said ask in rounds 141, 143, 144, 145: ask banned, ran chosen. Round 146: snapshot hand edit (no -u), continued. Round 148: force-exit leak fixed. Round 149: ran PHASE4_ROWS refresh over ask (Jev run 63%).

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'.
- Mock Clerk in any test rendering welcome (MessagePort stops Jest exit). expo-notifications is native: mock in tabs layout tests.
- Use jest.useFakeTimers({ now, doNotFake: [...] }) to pin dates so setImmediate still runs.
- Held fetch promises need an afterEach that answers them (the API client arms a 15 s timer).
- Each new key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.
- en.json and detail.tsx fail Prettier at HEAD: never --write.

## Round log
- 60-124: rows 10-14 closed; 14a parked at step 4; 14b Fixes 1-15b done.
- 128-144: Fixes 16 to 23 done. 145-146: training energy card, snapshot edit. 147: full checkpoint green.
- 148: force-exit leak fixed. Full green.
- 149: PHASE4_ROWS.md refresh (in progress).