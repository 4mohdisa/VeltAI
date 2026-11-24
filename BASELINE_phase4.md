# Baseline: Phase 4

- Date: 25 Nov 2026
- Branch: loop/phase4 (read from .git/HEAD)
- Node: v22.23.5 (nvm, put first on PATH for this round; the shell default is v24.16.0)
- Go: go1.26.5 darwin/arm64
- Jest pin in package.json: ~29.7.0 (unchanged)

## Gates

Every gate was green on the first run, so no fixes were made and the before and after numbers are the same.

| gate | command | result |
|---|---|---|
| App type check | `npx tsc --noEmit` | 0 errors |
| App Jest | `npx jest` | 242 of 242 suites passed, 1,397 of 1,397 tests passed, 4 snapshots passed |
| Backend Go | `go test ./... -v` from `backend/`, with LUME_TEST_DATABASE_URL unset | 34 packages ok, 0 failed, 14 packages with no test files |

## Skipped tests

- Go: 24 tests skipped, all named TestPG_ and all skipped because LUME_TEST_DATABASE_URL is unset.
- Jest: 0 skipped.

## TestPG against local Postgres

- Date: 25 Nov 2026
- Server: PostgreSQL 17.10 (Homebrew), localhost:5432, started with `brew services start postgresql@17`
- Database: lume_test_local, a disposable database on localhost only
- Setup: the shim from `backend/tests/food/days_pg_test.go` (auth schema, `auth.uid()`, `auth.jwt()`), plus the roles authenticated, anon and service_role, then all 18 files in `supabase/migrations` applied in order, one transaction each
- Command: `go test -count=1 ./... -v` from `backend/`, with LUME_TEST_DATABASE_URL set in the shell for that command only
- Result: 34 packages ok, 0 failed, 24 of 24 TestPG tests ran and passed, 0 skipped
- 25 Nov 2026: 24 TestPG tests ran on localhost lume_test_local, 0 skipped and 0 failed.
- No fixes were needed, so the before and after numbers are the same

## Difference from the expected numbers

The expected numbers were 241 suites, 1,386 tests and 20 skipped TestPG tests. The extra suite and tests come from commit e0c184d (rows 2c and 2d), which added `src/__tests__/australianDefaults.test.ts` and `backend/tests/food/afcd_pg_test.go` (TestPG_AFCDImportAndSearch).

## Row 2a hydrateGym limit

- Date: 25 Nov 2026
- Read: `hydrateGym` (`src/lib/data/hooks.ts`) called `api.gym.listSessions()` with no parameters, which is `GET /api/gym/sessions`. The backend ran `PGStore.ListSessions` (`backend/internal/gym/pg.go`): `SELECT ... FROM gym_sessions WHERE user_id = $1 AND <optional date range> ORDER BY date DESC, created_at DESC` with no LIMIT, then loaded every exercise for every returned session. It returned every session the user had ever logged.
- Cap: `GYM_SESSION_HYDRATE_LIMIT = 200` in `src/lib/data/hooks.ts`, sent as `?limit=200`; the SQL now ends `LIMIT nullif($4::int, 0)`, so a request without a limit reads the same rows as before.

| measurement | seeded sessions | before | after |
|---|---|---|---|
| App: sessions `hydrateGym` puts in the Gym store (Jest, `src/__tests__/productionReadiness.test.ts`) | 1000 | 1000 | 200 |
| Backend: rows `ListSessions` returns from lume_test_local (`TestPG_ListSessionsLimitReturnsNewest`) | 1000 | 1000 (no limit) | 200 (limit 200, the newest 200) |

- 25 Nov 2026: `GET /api/gym/streak` now returns `total_days`, `COUNT(DISTINCT date)` over all of the user's sessions with no limit. `TestStreakTotalDays` (5 sessions on 3 dates gives 3) and `TestPG_StreakTotalDaysCountsEveryDate` (250 sessions on 250 dates gives 250 on lume_test_local) pass under `go test -race`.

## Full verify, round 181

25 Nov 2026, Node 22.23.5, branch loop/phase4. `npm run verify` exit code 0. LUME_TEST_DATABASE_URL was not set, so the TestPG tests and the migration apply check skipped.

| Step | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `npm run lint -- --max-warnings 0` | 0 errors, 0 warnings |
| `jest --ci` | 260 of 260 suites, 1,534 of 1,534 tests, 4 of 4 snapshots pass, 0 failed |
| `verify:go` (`go test -race ./...`) | 34 packages ok, 14 with no test files, 0 failed (TestPG skipped) |
| `verify:migrations` | skipped with exit 0 (LUME_TEST_DATABASE_URL not set) |
| `secrets:scan` | 910 files checked, 0 findings |
| `check:manifest` | OK |

## Full verify with TestPG, round 182

25 Nov 2026, Node 22.23.5, branch loop/phase4, local PostgreSQL 17.10 on localhost:5432, database lume_test_local. `npm run verify` exit code 0 with LUME_TEST_DATABASE_URL set for that shell only (pointing at the local database; the value is not recorded).

TestPG: 27 run, 27 passed, 0 skipped, 0 failed (counted with a separate `go test -race -count=1 -v -run TestPG ./...` in the same shell, since `verify:go` prints no per-test lines). A full verbose Go run with the variable set showed no skipped test at all.

Migration apply check: passed, 18 migrations applied to a throwaway lume_test_migrate_* database, which was dropped afterwards (0 left).

| Step | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `npm run lint -- --max-warnings 0` | 0 errors, 0 warnings |
| `jest --ci` | 260 of 260 suites, 1,534 of 1,534 tests, 4 of 4 snapshots pass, 0 failed |
| `verify:go` (`go test -race ./...`) | 34 packages ok, 0 failed, TestPG run |
| `verify:migrations` | passed, 18 migrations applied |
| `secrets:scan` | 910 files checked, 0 findings |
| `check:manifest` | OK |

## Migration apply test runs once, round 184

25 Nov 2026, Node 22.23.5, branch loop/phase4, LUME_TEST_DATABASE_URL set for the command only (local lume_test_local; the value is not recorded). `npm run verify` exit code 0, log in /tmp/lume_verify_round184.log.

`verify:go` now runs `go test -race` on every package except backend/tests/migrations. `verify:migrations` now runs that whole package (`go test -race -count=1 -v ./tests/migrations`), so its 6 non-database tests are not lost.

| Count | Before (round 183) | After (round 184) |
|---|---|---|
| TestPG_MigrationsApplyToEmptyDatabase runs per verify | 2 | 1 |
| Go packages ok | 34 in `verify:go`, migrations package run again in `verify:migrations` | 33 in `verify:go` + 1 in `verify:migrations` = 34 |
| Go packages with no test files | 14 | 14 |
| Migrations package tests passed | 7 (`verify:go`) + 1 (`verify:migrations`) | 7 (`verify:migrations`) |
| TestPG (separate `go test -race -count=1 -v -run TestPG ./...`) | 27 of 27 | 27 of 27 |
| tsc / lint | 0 errors / 0 errors, 0 warnings | 0 errors / 0 errors, 0 warnings |
| Jest | 260 suites, 1,534 tests | 260 suites, 1,534 tests |
| Migrations applied | 18 | 18 |
| secrets:scan | 910 files, 0 findings | 910 files, 0 findings |
| check:manifest | OK | OK |

Round 185 recheck: `verify:go` excludes backend/tests/migrations (33 packages ok, 14 with no test files, 0 failed, down from 34 ok); `verify:migrations` applied 18 migrations and TestPG_MigrationsApplyToEmptyDatabase ran exactly once in the chain.
