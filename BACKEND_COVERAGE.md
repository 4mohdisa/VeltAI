# Backend coverage

Measured 27 Nov 2026 (Row 15, step 1 of 3) from `backend/` against the local `lume_test_local` database. Nothing was changed to get these numbers.

- **Own tests**: `go test -count=1 -cover ./...`, which counts only tests inside the same package.
- **All tests**: `go test -count=1 -p 1 -coverpkg=./... -coverprofile=...`, which also counts the black box tests in `backend/tests/*`. Most backend tests live there, so this is the real figure, and the 70 percent check uses it.
- `go test -race -count=1 ./...`: 39 packages ok, 0 failed, 0 data races, 16 with no test files; all 53 TestPG tests ran, none skipped.
- `internal/account` and the `backend/tests/*` packages have no statements of their own, so they have no row.

| Package | Own tests | All tests | Under 70% |
|---|---|---|---|
| `cmd/server` | 7.6% | 7.6% | Yes |
| `internal/ai` | 6.2% | 77.4% | No |
| `internal/aiquota` | 0.0% | 97.4% | No |
| `internal/analytics` | 0.0% | 63.4% | Yes |
| `internal/auth` | 32.1% | 69.5% | Yes |
| `internal/buildinfo` | 0.0% | 87.0% | No |
| `internal/config` | 0.0% | 83.2% | No |
| `internal/consent` | 100.0% | 100.0% | No |
| `internal/cuisine` | 0.0% | 100.0% | No |
| `internal/db` | 0.0% | 0.0% | Yes |
| `internal/debugreports` | 0.0% | 0.0% | Yes |
| `internal/energy` | 0.0% | 75.4% | No |
| `internal/entitlement` | 0.0% | 93.1% | No |
| `internal/feedback` | 94.7% | 94.7% | No |
| `internal/food` | 0.0% | 68.9% | Yes |
| `internal/goals` | 0.0% | 70.1% | No |
| `internal/gym` | 44.9% | 77.9% | No |
| `internal/httpx` | 0.0% | 100.0% | No |
| `internal/integrations` | 10.5% | 39.1% | Yes |
| `internal/localdb` | 94.7% | 94.7% | No |
| `internal/push` | 90.2% | 90.2% | No |
| `internal/ratelimit` | 29.3% | 93.9% | No |
| `internal/recipes` | 0.0% | 26.8% | Yes |
| `internal/retention` | 86.4% | 86.4% | No |
| `internal/scan` | 13.6% | 57.3% | Yes |
| `internal/scan/pipeline` | 77.2% | 82.3% | No |
| `internal/subscription` | 0.0% | 75.2% | No |
| `scripts` | 2.5% | 2.5% | Yes |
| `tools/afcd` | 0.0% | 0.0% | Yes |
| `tools/retention` | 0.0% | 0.0% | Yes |
| `tools/seed` | 21.5% | 21.5% | Yes |

## Under 70 percent (next round: table driven tests)

- `cmd/server` (7.6%)
- `internal/analytics` (63.4%)
- `internal/auth` (69.5%)
- `internal/db` (0.0%)
- `internal/debugreports` (0.0%)
- `internal/food` (68.9%)
- `internal/integrations` (39.1%)
- `internal/recipes` (26.8%)
- `internal/scan` (57.3%)
- `scripts` (2.5%)
- `tools/afcd` (0.0%)
- `tools/retention` (0.0%)
- `tools/seed` (21.5%)

## Round 170

- `internal/gym`: 49.8% to 77.9% with all tests counted (938 of 1,204 statements), and 5.5% to 44.9% from its own tests. New in-package TestPG tests: `internal/gym/pg_internal_test.go` (PGStore, ParamEngine) and `internal/gym/schedule_pg_internal_test.go` (SchedulePGStore). Still uncovered: the `patchSession`, `patchExercise`, `lastLogged` and `listTemplates` handlers.

## Round 173

- `internal/recipes`: 26.8% to 82.1% with all tests counted, and 0.0% to 82.1% from its own tests. New in-package TestPG tests: `internal/recipes/pg_internal_test.go` (handlers on top of PGStore). Still uncovered: the store failure (500) branches. Found the random ingredient order bug, recorded in KNOWN_ISSUES.md.

## Round 174

- `internal/integrations`: 39.1% to 88.4% with all tests counted. New in-package tests: `internal/integrations/providers_internal_test.go` (Strava and WHOOP against an httptest fake upstream: token exchange and refresh, activity mapping, partial responses, upstream errors, unreachable provider, timeout) and `internal/integrations/pg_internal_test.go` (TestPG for PGStore connections, OAuth state and imported sessions). The `mapStravaType` table in `internal_test.go` gained the remaining types. Still under 70%: the `callback`, `sync` and `disconnect` storage-error branches. Found the first-page-only sync bug, recorded in KNOWN_ISSUES.md.

## Round 175

- `internal/scan`: 57.3% to 79.3% with all tests counted (412 of 719 statements before). New TestPG file `tests/scan/learning_store_pg_test.go`, which reuses the package's `pgScanStore` and `freshUser` helpers: corrections and the signals they feed (portion, identity, macro, discard), calibration factors, the accuracy summary, session owner, rating and AI consent lookups, the user context block, saved meals, the pipeline session writes and the calibration report. New `internal/scan/decode_internal_test.go`: the request body limits (oversize is 413, bad JSON is 400). Still under 70%: `runScanPipeline` (50.0%), `Register` (66.2%) and `CalibrationReport` (60.0%), mostly failure branches. Found the scanned food log delete bug, recorded in KNOWN_ISSUES.md.
