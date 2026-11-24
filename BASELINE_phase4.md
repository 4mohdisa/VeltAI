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

- Go: 21 tests skipped, all named TestPG_ and all skipped because LUME_TEST_DATABASE_URL is unset.
- Jest: 0 skipped.

## Difference from the expected numbers

The expected numbers were 241 suites, 1,386 tests and 20 skipped TestPG tests. The extra suite and tests come from commit e0c184d (rows 2c and 2d), which added `src/__tests__/australianDefaults.test.ts` and `backend/tests/food/afcd_pg_test.go` (TestPG_AFCDImportAndSearch).
