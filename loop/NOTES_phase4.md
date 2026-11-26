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
10. Notes under 600 words. Reply JSON only.

## State (Round 142)
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3-6, 10-14, 29. Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b, 7, 8, 9, 14a, 14b (open).
- Round 139 checkpoint green: tsc 0, 348 suites, 2,171 tests. Next checkpoint: Round 145.
- Fix 20 done (round 141; snapshot hand edited, no -u).
- Jest worker force-exit at end of full run: unexplained.

## Blocked on Isa (park, do not retry)
- Rows 5, 8, 9: consent copy; win back and leaving copy; Apple Retention access; sandbox URL; expired, cancelled, past_due runs; 7c iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE gating.
- Row 11: Settings switch, purpose strings, HealthKit provider, device steps.
- Row 12a: Email, Name, User ID labels; push token manifest type.
- Row 13: age rating, production demo account, lume.fit URLs.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording; Fix 24; Fix 25; Terms describe a free tier; Energy body stats hint; Fix 12 option B.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications); Jest worker force-exit.
- Tests rendering Welcome must mock @clerk/clerk-expo or Jest hangs. en.json and detail.tsx fail Prettier at HEAD: never --write.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Row 14b (open)
- DESIGN_INTENT.md is authoritative for numbering. Fixes 1-20 done.
- Fix 21 (round 142): Gym month label counts this month only (gym.tsx ~166).
- Then: Energy 'not enough days' empty state needs an action.
- Unfixed (fold in or park at closure): Training 'This week' energy card uses last 7 days (needs clock pinned fixture); training.axisLetters fixed September fixture; gym.freeze.confirm '1 freezes' (no plural forms); targets reuses earlier calorie target; food quantity and energy units not asked in onboarding; measurements.tsx:280 Back goes to preview; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed call sends signed-in user to onboarding; paywall non-401 failure re-posts answers; gym tab no logged pill (parked look change); history.tsx isoDaysAgo duplicates isoDate; search-results 'Add custom food' does not log; 'no matches' does not prefill name; saved.tsx meal from + not passed; food calorie card past days (option B, post launch); Manage subscription open-or-toast in three places; goBackOrHome falls back to Today (parked); back-or-Food fallback copied in two files; GlassButtons falls back to Today.
- Spotted: Food tab checks consent on mount only. insights.tsx comment about feed GET triggering AI: verify. src/lib/mock/data.ts:27 says 2 freezes; real cap is 1.
- At closure: drop stale 'Barcode, Scan and label scan still open' note and update PHASE4_ROWS.md (not updated since start of Phase 4 rows 2b-14b).

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
- Code: hardcoded strings; about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion; saved.tsx:48, label-scan.tsx:42, food.tsx SLOTS copies; mappers.ts duplicate; backOrFood duplicated (shared helper in nav.ts).
- Tests missing: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.
- Jest worker force-exit: investigate with --detectOpenHandles in its own round.

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
- Billing: only src/lib/billing/purchases.ts imports the RevenueCat SDK. Trial shown only when store says eligible. REFUND_REVERSED restores from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag off by default; message keys only; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00-07:00; all off by default; permission only after priming says yes.
- Push token: secure storage after 204. Sign-out deletes saved copy only after DELETE succeeds.
- Health: no denied state for reads; null when not granted or no data.
- Legal: copy in en.json; UPDATED date literal stays. Crash data not linked to user.
- Analytics off by default. Stepper labels: common.decrease, common.increase.
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.
- Meal reaches detail sheet through subject store, never a route param. Summary Today always shows today.
- Throttle never reads the clock; callers pass now. Launch counter uses module-level flag.
- Gym prefill: top set only, last 90 days; removing every set unticks the exercise.
- Round 122: Fix 12 option A; option B parked post-launch. Round 131: Fix 18 split. Round 133: freeze.tsx reuses gymStreak.noFreezes. Round 134: headline at 0 freezes follows the reason line. Round 135: Energy hint stays unlinked. Round 136: Training empty state links to /gym/log-session. Round 138: Fix 20 split into two prompts.
- Round 141: Jev said ask 87%. Ask is banned by Isa's rule, so run chosen. One stale snapshot hand edited (not -u).
- Round 142: chose Fix 21 (candidate 1), next in DESIGN_INTENT order. Jev agreed. Fix 21 reuses gymRange.ts helper.

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u. Wrap: perl -e 'alarm N; exec @ARGV'. In zsh pass many paths through xargs.
- Lint: no setState in effect body; use guarded .then. Render tests: *.render.test.tsx.
- Mock Clerk to avoid the MessagePort that stops Jest exiting. expo-notifications is native: mock in tabs layout tests.
- Use jest.useFakeTimers({ now, doNotFake: [...] }) to pin dates so setImmediate still runs.
- Paywall is src/app/onboarding/paywall.tsx; paywall render tests live in src/__tests__/render/.
- Each new key goes at the end of ENGLISH_ONLY in src/__tests__/localeParity.test.ts.

## Round log
- 60-124: rows 10-14 closed; 14a parked at step 4; 14b Fixes 1-15b done.
- 128-136: Fixes 16 to 19 done.
- 137-141: Fix 20 done (helper, summaryCards, training.tsx, snapshot hand edit).
- 142: Fix 21 issued (gym month label).
