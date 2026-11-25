# Phase 4 baseline: Go gates and lint

Date: 2026-11-26
Branch: loop/phase4

## Go backend

- `go vet ./...`: no findings.
- `go test -count=1 -race ./...`: 49 packages. 35 have tests and all pass. 14 have no test files. 0 fail.
- Tests: 770 pass, 0 fail, 0 skipped. Subtests are counted.
- Race detector: on for the whole run. It found no data races.
- TestPG tests: 28 ran against the local Postgres test database, and all 28 pass, with none skipped. That is 26 `TestPG_` tests plus 2 `TestPGStore` tests in rate limiting. Earlier notes say 20, which is now out of date.

## Lint

- `npx expo lint src --max-warnings 0`: 0 findings (0 errors, 0 warnings). No eslint-disable comments were added.

## Route audit

- `node scripts/audit-routes.mjs`: 93 of 93 backend /api routes are used by the app.
- 0 orphaned, 5 backend only.
- 2 routes are reported as broken by design: GET /api/ai/anomalies and POST /api/ai/anomalies/:p/dismiss. These are known and intentional.
