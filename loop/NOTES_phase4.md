# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask; park owner steps. Branch loop/phase4 only.

## Overrides
1 English only for new strings. 2 About 15 rounds per row, then BUILT. 3 Order 18-30, then 31. 4 One screen or component per prompt, max 5 steps. 5 Partly done: one follow-up, then park. 6 Simulator and Maestro only in rows 23 and soak. 7 Branch rule in every prompt; tsc first each round. 8 Flagged work tested before new task. 9 Out of scope changes: check, then keep with decision or revert. 10 Notes under 600 words. 11 Checkpoint about every 5 rounds.

## State (Round 252)
BUILT 20 of 39: 1, 2, 2.2, 2b-2d, 3-6, 10-17, 14b, 29. Phase 3 rows 6, 13, 14, 15. PARTIAL: 6b, 7, 8, 9, 14a, 31. DIFFERENT: 18b-c, 19-28, 30. 18a done. 18b steps 1-2 done.
Next: 18b step 3 (security headers, resent in round 252), then 18c.

## Loop blocker
Claude Code login expired since round 210. Isa must run claude auth login or claude setup-token and set CLAUDE_CODE_OAUTH_TOKEN. Listed in OWNER_CHECKS_phase4.md. Expo plugin not installed (ignored for backend work). Resend every round. Environmental: never park, no ask, no stop.

## Parked (fix only in its row)
Debug: null context stored as null; retry drops fields. Food: scan log delete (FK); portion pref wipes meal type; saved food skips nutrition checks. Gym: exercise POST 200 not 201; session PATCH takes future date and negative duration. Goals: weight_goal, activity_level, source unchecked; onboarding skips sex, units. Recipes: random UUID order; PATCH and meal_type unchecked. Integrations: sync caps 50 and 25; expired token 502; unknown provider 503. Feedback 14a: wire or delete chip before 31. Legal: web legal lacks push, Sentry, PostHog. Push: DELETE after 401; stale tokens. Schedules: meal median across midnight; quiet hours. RevenueCat ignores PAUSED, EXTENDED, NON_RENEWING, TEMPORARY. Backend: 49 id::text queries; schedule sorts before LIMIT 30; swallowed errors; no long text cap; /api/scan 400 not 413 for oversize; no image size check before paid call; label route no dimension check; non-images sent to Gemini; debug screenshots no type check (test build only). Migrations: schema test skips columns; no CONCURRENTLY guard. Code: hardcoded strings; 243 console lines; two useApi; reanimated mock; root JS unlinted. Tests: 4 refetch and lifecycle gaps. Helpers: 6 copies of signedTokens, seedOwner, wantErrorEnvelope. Docs: LUME_TEST_DATABASE_URL. Rate limits: parked, no shared limiter approved.

## Blocked on Isa (do not retry)
Migration approvals (food delete, recipe order), integration paging, null context fix, null byte 400 guard, shared test helper, shared rate limiter or redirect guard, coverage scope, 403 vs 404 (403 kept), RevenueCat shared header. Copy: consent, win back, leaving, target weight, paywall terms, Terms free tier. Apple and RevenueCat: Retention access, sandbox, Apple sheet, 7c key. Push and HealthKit: categories, switches, purpose strings, device steps. Store: age rating, demo account, URLs. Tooling: CI, E2E account, npm audit. Owner checks: OWNER_CHECKS_phase4.md.

## Protected
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, backend/tests/scan/learning_store_pg_test.go. foodDays.test.ts: add branches only. Loop files.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target optional; Continue never disabled; calorie floor 1500 (1200 female).
- 402 opens /onboarding/paywall via paywallHref in nav.ts (only builder).
- Deletion: Clerk first, then rows; Clerk 404 counts as deleted.
- AI consent gated on server; Anthropic only when LLM_PROVIDER=claude.
- Only src/lib/billing/purchases.ts imports RevenueCat. Trial only when store says eligible. No price text in Apple messages.
- Retention flag off. No food, body or workout values in analytics. Analytics and notifications off by default.
- Health: null when not granted.
- Snapshots by hand, never -u. New strings: key at end of ENGLISH_ONLY.
- Rows 16-17: route list read from source; migration tests drive deploy/migrate.sh; rollback is forward fix only.
- Jev ask and stop signals not followed; no Isa blocker stops the loop.
- Row 18 split 18a, b, c. Secrets scan masks values. 18b in steps of max 5. No shared guard without approval.
- Redirect finding: tripwire test; flip when guard lands.
- Rate limits only through an existing limiter on AI and feedback routes; none exists means park, headers only.
- Claude Code auth failures are environmental: resend, never park.
- Each test package keeps its own helper copies until Isa approves a shared package.

## Gotchas
Jest: full paths, --ci, output redirected, never -u. en.json and detail.tsx fail Prettier at HEAD: never --write. Go TestPG: LUME_TEST_DATABASE_URL on command line only (postgres://localhost:5432/lume_test_local?sslmode=disable).

## Round log
182-203: Rows 16, 17 BUILT. 204 checkpoint green. 205: 18a done. 206-207: 18b steps 1-2. 208: redirect tripwire. 209: checkpoint green. 210-251: Claude Code auth failures, resent. 252: auth failure again, resent 18b step 3 (security headers, backend, 5 steps).
Next: 18b step 3, then 18c. If auth still fails, resend. Do not park.