Handover: Lume Phase 4, branch loop/phase4 (Rounds 172 to 186)

Setup
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Run export PATH=$HOME/.nvm/versions/node/v22.23.5/bin:$PATH first.
- Last green checkpoint (Round 184): tsc 0 errors, Jest 350 of 350 suites and 2,190 tests, go vet clean.
- Jest in zsh: use the no-path form, or pass paths with xargs -0. A plain $FILES list reaches Jest as one argument.
- TestPG: set LUME_TEST_DATABASE_URL=postgres://localhost:5432/lume_test_local?sslmode=disable on the command line only.

Rows
- BUILT (18 of 39): 1, 2, 2.2, 2b, 2c, 2d, 3, 4, 5, 6, 10, 11, 12, 12b, 13, 14, 15, 29.
- Row 15 became BUILT in Round 181. Every in-app internal package is at 70 percent or more; see BACKEND_COVERAGE.md at the repo root.

In progress: Row 16 (authorization and contract tests)
- Step 1 done: backend/tests/authz_routes_test.go classifies all 102 routes as PROTECTED or PUBLIC. It scans the source for routes, builds and runs the real cmd/server, and checks every PROTECTED route for 401 "missing bearer token".
- Step 2, ownership tests, done for two groups so far:
  - food: backend/tests/food/ownership_pg_test.go
  - gym: backend/tests/gym/ownership_pg_test.go
- No handler leaked another user's data.
- Next group: recipes and saved meals.

Decisions
- No route accessor was added. ServeMux can't list its routes and package main can't be imported, so the route list comes from a source scan.
- Each test package has its own copies of signedTokens and seedOwner, because the shared helper package is still waiting on Isa.

Gotchas
- cmd/server loads .env from the folder it runs in, and treats PORT without LUME_ENV as production. Tests run it from a temp folder with LUME_ENV=test.
- Never edit loop/DECISIONS_LOG.md, loop/NOTES_phase4.md, src/lib/mock/data.ts, src/__tests__/helpers/useApiHarness.ts or ios/.
- seedMealLog and seedDay in tests/food leave profiles behind.
- The DB pool helper now has seven copies across the backend.

Bugs found, not fixed (all in KNOWN_ISSUES.md except the debug report one)
- A scanned food log can't be deleted: scan_sessions.food_log_id has no ON DELETE rule. Needs a migration.
- Integration sync reads only the first page of workouts.
- Recipe ingredients and saved meal items come back in random order (ORDER BY a random uuid id).
- debugreports.go:61 stores "context": null as JSON null.
- UpsertPortionPref can wipe a stored meal type.

Waiting on Isa
- Coverage scope ruling for cmd/server, scripts, tools/* and internal/db (in OWNER_CHECKS_phase4.md).
- Approval for the bug fixes above and for the shared test helper package.
- Earlier items: dashboard wording, es and fr text for gym.freeze.confirm_one, Fixes 24 and 25.

Other open problems
- 158 console.warn and console.error calls in the Jest output.
- tests/smoke keeps a hand-written route list that the authz table makes redundant.