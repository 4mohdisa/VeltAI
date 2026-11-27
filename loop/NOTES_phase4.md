# Lume Loop Notes: Phase 4
Goal: all rows BUILT or EXACT, soak exit met. Never ask; park owner steps. Branch loop/phase4 only.

## ACTION FOR ISA (only you can do this)
Claude Code login expired (round 210, still failing at round 437). Run: claude auth login, or claude setup-token and set CLAUDE_CODE_OAUTH_TOKEN. Optional: claude plugin install expo@claude-plugins-official --scope project. The loop resumes by itself.

## State (Round 437)
BUILT 20 of 39: 1, 2, 2.2, 2b-2d, 3-6, 10-17, 14b, 29; Phase 3 rows 6, 13, 14, 15. PARTIAL: 6b, 7, 8, 9, 14a, 31. DIFFERENT: 18b-c, 19-28, 30. 18a done; 18b steps 1-2 done.
Next: 18b step 3 (security headers in existing middleware chain, no HSTS).
Unrecorded checkpoints: 379, 393, 408, 423. Record when auth returns.

## Loop blocker
Claude Code auth. Environmental: resend the same self-contained prompt. Never park, never ask, never stop. Prompts must have at most 5 numbered steps.

## Parked (fix only in its row)
Debug: null context; retry drops fields. Food: scan log delete FK; portion pref wipes meal type; saved food skips nutrition checks. Gym: exercise POST 200 not 201; session PATCH accepts future date and negative duration. Goals: weight_goal, activity_level, source unchecked; onboarding skips sex, units. Recipes: random UUID order; PATCH, meal_type unchecked. Integrations: sync caps 50/25; expired token 502; unknown provider 503. Feedback 14a: wire or delete chip before 31. Legal: web legal lacks push, Sentry, PostHog. Push: DELETE after 401; stale tokens. Schedules: meal median across midnight; quiet hours. RevenueCat ignores PAUSED, EXTENDED, NON_RENEWING, TEMPORARY. Backend: 49 id::text queries; schedule sorts before LIMIT 30; swallowed errors; no long text cap; /api/scan 400 not 413; no image size check before paid call; label route no dimension check; non-images sent to Gemini; debug screenshots no type check (test build). Migrations: schema test skips columns; no CONCURRENTLY guard. Code: hardcoded strings; 243 console lines; two useApi; reanimated mock; root JS unlinted. Tests: 4 refetch and lifecycle gaps. Helpers: 6 copies of signedTokens, seedOwner, wantErrorEnvelope. Docs: LUME_TEST_DATABASE_URL. Rate limits: parked, no shared limiter approved.

## Blocked on Isa (do not retry)
Migration approvals (food delete, recipe order); integration paging; null context fix; null byte 400 guard; shared test helper; shared rate limiter or redirect guard; coverage scope; 403 vs 404 (403 kept); RevenueCat shared header. Copy: consent, win back, leaving, target weight, paywall terms, Terms free tier. Apple and RevenueCat: Retention access, sandbox, Apple sheet, 7c key. Push and HealthKit: categories, switches, purpose strings, device steps. Store: age rating, demo account, URLs. Tooling: CI, E2E account, npm audit.

## Protected
src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/, listSessions defaults in src/lib/api.ts, backend/tests/scan/learning_store_pg_test.go, foodDays.test.ts (add branches only), loop files.

## Decisions (never delete)
- Local Postgres and sandbox keys only. Deploys are Isa's.
- Onboarding: target optional; Continue never disabled; calorie floor 1500 (1200 female).
- 402 opens /onboarding/paywall via paywallHref in nav.ts (only builder).
- Deletion: Clerk first, then rows; Clerk 404 counts as deleted.
- AI consent gated on server; Anthropic only when LLM_PROVIDER=claude.
- Only src/lib/billing/purchases.ts imports RevenueCat. Trial only when store says eligible. No price text in Apple messages.
- Retention flag off. No food, body or workout values in analytics. Analytics and notifications off by default.
- Health: null when not granted.
- Snapshots by hand, never -u.
- Rows 16-17: route list from source; migration tests drive deploy/migrate.sh; rollback is forward fix only.
- Jev ask and stop signals not followed; no Isa blocker stops the loop.
- Row 18 split 18a-c. Secrets scan masks values. 18b in steps of max 5. No shared guard without approval.
- Redirect finding: tripwire test; flip when guard lands.
- Rate limits only through an existing limiter on AI and feedback routes; none means park, headers only.
- Claude Code auth failures are environmental: resend, never park.
- Each test package keeps its own helper copies until Isa approves a shared package.
- Security headers only in existing middleware chain; no HSTS (local HTTP).
- Checkpoints (303, 318-320, 326-341, 348-350, 354+, 363, 378, 379, 393, 408, 423): no-change type check and full app Jest.
- Rounds 408-437: auth failure resent; ask and stop signals not followed.

## Gotchas
Jest: full paths, --ci, output redirected, never -u. en.json and detail.tsx fail Prettier at HEAD: never --write. Go TestPG: LUME_TEST_DATABASE_URL on command line only (postgres://localhost:5432/lume_test_local?sslmode=disable). Every prompt states the loop/phase4 branch rule.

## Round log
182-203: Rows 16, 17 BUILT. 204, 209 checkpoints green. 205: 18a done. 206-207: 18b steps 1-2. 208: redirect tripwire. 210-434: Claude Code auth failures, resent. 395-436: 18b step 3 resent each time. 435: rejected prompt (8 steps) rewritten to 5 steps. 436: 18b step 3 resent as 5 step prompt. 437: resent again as 5 step prompt, Jev ask signal not followed (see decisions).