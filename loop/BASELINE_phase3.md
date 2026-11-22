# Phase 3 Baseline (Row 2)

Date: 2026-11-22
Node: v22.23.5 (via nvm, matches .nvmrc)
Jest: 29.7.0 (the runner `npx jest` uses, node_modules/jest-expo/node_modules/jest). The top-level node_modules/jest/package.json reads 30.0.5, which does not match package.json (~29.7.0) or package-lock.json (29.7.0); see "Install drift" below.

## Type check

`npx tsc --noEmit`: 0 errors (exit 0).

## App Jest

`npx jest`: 135 suites passed, 0 skipped, 135 total. 993 tests passed, 0 skipped, 993 total. 4 snapshots passed. Exit 0.

## Backend Go tests

`go test -count=1 -v ./...` from backend/: exit 0.
- Packages: 30 ok, 0 failed, 14 with no test files.
- Tests: 614 passed (526 top-level plus subtests), 0 failed, 18 skipped.

### Skipped backend tests

All 18 skip on the same guard, `t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")`.

| Name | File | Reason | Verdict |
|---|---|---|---|
| TestPG_LoggedDaysNeverLeaksAnotherUsersDays | backend/tests/food/days_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_LoggedDaysDedupesAndSorts | backend/tests/food/days_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_LoggedDaysRangeIsInclusiveAtBothEnds | backend/tests/food/days_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_MealMoveOnlyMovesTheOwnersRow | backend/tests/food/meal_move_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_LibraryRejectsNonCanonicalPrimaryMuscle | backend/tests/gym_schedule/muscle_canonical_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_LibraryRejectsNonCanonicalSecondaryMuscle | backend/tests/gym_schedule/muscle_canonical_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_SeedRewritesDriftedMuscleAndIsCanonical | backend/tests/gym_schedule/muscle_canonical_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_AddTemplateExerciseReturnsTheRow | backend/tests/gym_schedule/schedule_pg_sql_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_GetTemplateExerciseReturnsOwner | backend/tests/gym_schedule/schedule_pg_sql_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_GetTemplateExerciseOwnerIsTheTemplateOwner | backend/tests/gym_schedule/schedule_pg_sql_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_TemplateExercisesForStillScans | backend/tests/gym_schedule/schedule_pg_sql_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_ConfirmClaimsThePipelineRow | backend/tests/scan/confirm_reconcile_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_LateFinishDoesNotClobberAConfirmedRow | backend/tests/scan/confirm_reconcile_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_RefreshDoesNotChangeTheDayTotal | backend/tests/scan/confirm_reconcile_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_ConfirmWithoutSessionStillInserts | backend/tests/scan/confirm_reconcile_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_ConfirmWithDanglingSessionInserts | backend/tests/scan/confirm_reconcile_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_ReplayedConfirmDoesNotInsertASecondRow | backend/tests/scan/summary_replay_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |
| TestPG_SummaryExcludesUnconfirmedRows | backend/tests/scan/summary_replay_pg_test.go | LUME_TEST_DATABASE_URL not set, needs a real Postgres database | real |

## Main branch baseline for comparison

App Jest on main: 134 suites passed, 1 skipped. 990 tests passed, 3 skipped.
On loop/phase3, all 135 suites and 993 tests run and pass, with none skipped.

## Install drift

`npm ls jest` reports the hoisted node_modules/jest@30.0.5 as invalid against the ~29.7.0 pin. The lockfile records 29.7.0, so a clean `npm ci` should restore it. The gates above ran on 29.7.0 through the jest-expo proxy, so they are not affected.
