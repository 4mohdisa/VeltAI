Handover: Lume Phase 4, branch loop/phase4 (Rounds 187 to 201)

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- backend has its own go.mod, so run Go commands from backend.
- Set LUME_TEST_DATABASE_URL=postgres://localhost:5432/lume_test_local?sslmode=disable on the command line only.
- Last green checkpoint (Rounds 199 and 200): tsc 0 errors; Jest 350 of 350 suites, 2,190 tests; go vet clean; go test -race 44 packages ok, 0 failed, 12 with no test files.

Rows
- BUILT is unchanged at 18 of 39: 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 12b, 13, 14, 15, 29.
- Row 16 work is done, but its status is still DIFFERENT. The only open item is the 403 vs 404 ruling below.
  - Step 1: route table.
  - Step 2: ownership tests for every id route group (food, gym, recipes, saved meals, goals, body weight, insights, AI, integrations).
  - Step 3: validation tests for the same groups.
  - Invalid bearer token checked on all 96 protected routes.
  - The smoke route list was removed.
- In progress: Row 17 (migration tests), status still DIFFERENT. The tests are done and pass. Next: add the Row 17 note to PHASE4_ROWS.md, then run a full npm run verify with the URL.

Files that matter
- backend/tests/authz_routes_test.go
- ownership_pg_test.go and validation_pg_test.go in backend/tests/food, gym, goals and ai
- backend/tests/integrations/ownership_pg_test.go
- backend/tests/migrations/migrations_pg_test.go and migrations_apply_pg_test.go (scratchDatabase helper)
- backend/MIGRATIONS.md
- scripts/require-local-test-db.mjs, used by verify:go and verify:migrations in package.json
- deploy/migrate.sh (the only migration runner)
- KNOWN_ISSUES.md and PHASE4_ROWS.md

Decisions
- Each test package keeps its own copies of signedTokens, seedOwner and wantErrorEnvelope until Isa approves a shared helper package. There are now 6 copies, 6 and 5.
- Tests only assert what handlers reject today. Validation gaps are parked, not fixed.
- Migration tests drive the real migrate.sh against throwaway lume_test_migrate_* databases and seed with backend/scripts/seed_local.sql.
- Rollback is forward-fix only; there are no down scripts.

Waiting on Isa
- 403 vs 404 ruling: every handler returns 403 for another user's id, but one brief asked for 404.
- Shared helper package, coverage scope ruling, and the bug fixes in KNOWN_ISSUES.md.

Bugs and gaps, not fixed
- Integrations: an unknown provider returns 503 instead of 404 when the encryption key is missing (logged in KNOWN_ISSUES.md).
- Recipe PATCH doesn't check ingredients; recipe and saved meal create don't check item numbers.
- meal_type is not validated on saved meal create or the two log routes.
- Goals and onboarding store unchecked strings (weight_goal, activity_level, source, sex, units).
- Gym session PATCH accepts future dates and negative durations.
- Unknown-id 404 messages differ between packages.
- 243 console.warn and console.error lines in the Jest output.
- The schema test checks tables used by the backend's SQL, but not columns.

Never edit
- loop/DECISIONS_LOG.md, loop/NOTES_phase4.md, src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts, ios/
- backend/tests/scan/learning_store_pg_test.go and the listSessions defaults in src/lib/api.ts