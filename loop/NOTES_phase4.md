# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask. Park owner steps. Branch loop/phase4 only.

## Overrides (Isa)
1. English only; es/fr deferred; missing keys fall back to English.
2. About 15 rounds per row, then BUILT (PARTIAL only if core broken).
3. Order: 14b, 15-30, 31.
4. One screen or component per prompt, max 5 steps. Rejected prompt = failed attempt.
5. Partly done gets ONE follow-up; flagged again: park leftover.
6. Simulator and Maestro only in row 23 and soak rows.
7. Every prompt starts with branch rule. Every round runs tsc first.
8. Untested flagged work: run its tests before any new task.

## State
- BUILT: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10-14, 29; Phase 3 rows 6, 13, 14, 15.
- PARTIAL: 6b (step f blocked); 7 (7c parked); 8 (Maestro not run); 9 (leaving reason parked); 14a (chip unwired).
- Green checkpoints: Rounds 66, 80, 95, 109, 114 re-check (340 suites, 2,090 tests, tsc 0). Next checkpoint about Round 123.

## Row 14b (current)
- Done: Fix 1 meal slot on all Add paths; Fix 2 Summary and Nutrition read today; Fix 3 remove a set; Fix 4 prefill from last session; Fix 5 paywall server check; Fix 6 no record and no answers goes to goal step; Fix 7 gym log button on every day (Round 113, re-checked Round 114).
- Now (Round 115): Fix 8 units into Settings (measurements.tsx:57,68).
- Next: gym top-set save; recipes unreachable; list order.
- Follow-ups: measurements.tsx:280 Back goes to preview; Welcome shows Sign in to a signed-in user with no record; delete-account.tsx:101 white on white (device check); index.tsx:101-106 failed backend call sends signed-in user to onboarding; paywall non-401 record-check failure re-posts answers; drop stale 'Barcode, Scan and label scan still open' note from PHASE4_ROWS.md when 14b closes; gym tab shows no logged pill once logged (look change, parked).
- Parked: saved.tsx:48 slot check; label-scan.tsx:42 and food.tsx SLOTS copies; mappers.ts duplicate.
- Isa rulings pending: Fix 24 (training-days step), Fix 25 (duplicate Profile rows). Do not remove until ruled.
- Owner decision pending: Terms describe a free tier that does not exist. Per-set gym history needs a backend change (Isa).
- Tooling: en.json fails Prettier; never --write.

## Row 14a: parked
- Done: features.ts (11 keys), throttle.ts with tests, promptStore.ts, recordLaunch, FeatureFeedbackChip with render tests.
- Parked: chip wiring, feature_rated analytics, Settings feedback screen, Ask me for feedback switch, npm run feedback, delete and export coverage, PRIVACY_DATA.md. Wire or delete the chip before Row 31.

## Parked: legal
- web/lib/legal.ts lacks push, Sentry, PostHog lines. LegalScreen hardcodes 'Last updated' and 'PENDING LEGAL REVIEW'. Banned word in legalParity comment. Paywall footer on small iPhone: Row 23.

## Blocked on Isa (park)
- Rows 5, 8, 9: consent copy, win back and leaving copy, Apple Retention access, sandbox URL, expired, cancelled and past_due runs, 7c iOS public key.
- Row 10: category strings, defaults, quiet hours wording, push token retention, DELETE gating.
- Row 11: Settings switch, purpose strings, HealthKit provider, device steps.
- Row 12a: Email, Name, User ID labels; push token manifest type. Row 13: age rating, production demo account, lume.fit URLs.
- Sign-offs: target weight required; resend cooldown; Clerk session_exists on device; native Apple sheet vs browser; paywall terms wording.
- Tooling: react-test-renderer deprecation; gesture-handler warning; CI; E2E account needs 250+ gym dates; npm audit (expo-notifications); Jest worker force-exit.
- Owner check pending: launch wait; RevenueCat sandbox webhook; Apple and Clerk Apple setup; iPhone Apple sign in; Row 2b; HealthKit device steps.

## Parked: other (fix only in its row)
- Push: DELETE after session 401; stale tokens never removed; failed POST not retried.
- Schedules: leaving screen not in full run; meal median across midnight; quiet hours stepper no wrap.
- RevenueCat ignored: SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED, NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT.
- Backend: 49 queries use id::text = $1; schedule_pg.go oldest then LIMIT 30; swallowed errors in getMorningBrief, getProfile, getAnomalies, dismissAnomaly.
- Code: hardcoded strings (body emoji, A$, Your data, server limit message); about 68 console errors need scoped spies; two useApi copies; mutations.ts and hooks.ts import cycle; reanimated mock lacks useReducedMotion.
- Tests missing: useEnergyBalance refetch; BottomSheet lifecycle; ScanReviewCard refetch; AI sweep skipping no-consent users.
- Config: root config and backend JS unlinted; verify:go lacks -count=1.

## Protected (do not edit)
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, foodDays.test.ts (add branches instead).

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target weight optional server side; resumed Back goes to previous step; training days on backend; Continue never disabled; inches 0-11, feet 3-8; target weight 30-300 kg; calorie floor 1500 (1200 female); 401 ends session.
- Fix 6: no record and no answers goes to /onboarding/goal; with answers goes to measurements.
- Fix 5 follow-up over Fix 7 (data written twice beats UI gap). Paywall checks server record first, 401 ends session.
- Apple sign in: browser oauth_apple flow; hidden on Android.
- Deletion: Clerk first, then rows; Clerk failure 502 keeps rows; Clerk 404 counts as deleted.
- Public routes: auth, webhook, subscription, offers, legal, health, consent, deletion, export, feedback, integration revoke, push DELETE. Push POST gated. Retention summary authenticated, counts only.
- AI consent: server gate first; profiles.ai_consent_at; 429 queueable; only ai_daily_limit_reached non-retryable. Insights to Gemini; Anthropic only when LLM_PROVIDER=claude.
- Row 6: hydrateGym limit 200, backend LIMIT kept. 6b: answers stay on device until trial or purchase; GET /api/subscription retried 4 times, 1.5 s apart.
- Launch gate: 402 opens /onboarding/paywall with reason; 401 ends session; network error resumes onboarding or opens tabs. paywallHref(reason?) in src/lib/nav.ts is the only paywall link builder.
- Billing: only src/lib/billing/purchases.ts imports RevenueCat SDK. Trial shown only when store says eligible. 7 day Apple trial, no free tier. REFUND_REVERSED restores from event expiry. Webhook secret from env only; unset refuses events. No Apple signature check.
- Expired: Subscription, then win back, then paywall. No price text in Apple messages. WINBACK_REASON in nav.ts.
- Retention: flag off by default; message keys only; leaving screen sends no food, body or workout values to analytics.
- Notifications: median meal times after 3 logs per slot; 7 day window; quiet hours 22:00-07:00; meal and streak dropped in quiet hours; workout and weekly move to quiet end; all off by default; permission only after priming says yes.
- Push token: secure storage after 204 (STORAGE_KEYS.pushToken); sign-out deletes saved copy only after DELETE succeeds.
- Health: no denied state for reads; null when not granted or no data.
- Legal: copy in en.json; UPDATED date literal stays (manifest pins it). Crash data not linked to user.
- Analytics off by default. Stepper labels: common.decrease, common.increase.
- Allowed edits: delete lookupBarcodeAsync and its test line; edit foodDays.test.ts; rename gym.monthSessions and gym.monthFreezes; ROUTE_COVERAGE.md in verify; localeParity ENGLISH_ONLY list.
- Meal reaches detail sheet through subject store, never a route param. Clearing Food search drops ?slot; log from detail sheet also drops ?slot. Summary Today always shows today.
- Throttle never reads the clock; callers pass now. Launch counter uses module-level flag.
- Gym prefill: top set only, last 90 days; removing every set unticks exercise.
- Prettier on en.json: not reformatted.

## Gotchas
- Full Jest paths, --ci, redirect output, never jest -u. Wrap Jest: perl -e 'alarm N; exec @ARGV'. In zsh pass many paths through xargs.
- Lint: no setState in effect body; use guarded .then. Render tests: *.render.test.tsx.
- Mock Clerk to avoid MessagePort that stops Jest exiting. expo-notifications is native: mock in tabs layout tests.
- Paywall is src/app/onboarding/paywall.tsx; paywall render tests live in src/__tests__/render/.

## Round log
- 60-108: rows 10-14 closed; 14a parked at step 4; 14b Fixes 1-4 done.
- 109: checkpoint green. 110: Fix 6 done. 111: Fix 5 follow-up rejected. 112: Fix 5 follow-up done.
- 113: Fix 7 done. 114: Fix 7 re-check clean (tsc 0, 41 gym suites, eslint clean).
- 115: Fix 8 started (units into Settings).
- Last handover Round 107; next after Round 120.