# Cleanup pass report — the two remaining human-call items

Date: 2026-09-08. Branch: `main`, committed (not left on a branch).
Addendum to `ARCHITECTURE_PASS_REPORT.md`, which ended with five items needing a
human call. The owner decided all five: three needed no code, two are built here.

| | Suites | Tests | tsc | eslint |
|---|---|---|---|---|
| **App before** | 43 | 678 | 0 errors | 0 errors, 35 warnings |
| **App after** | 44 | 694 | 0 errors | 0 errors, 35 warnings |

| | Passed | Skipped | Failed |
|---|---|---|---|
| **Backend before** (no Postgres) | 599 | 11 | 0 |
| **Backend after** (no Postgres) | 609 | 14 | 0 |
| **Backend after** (real Postgres) | **623** | **0** | 0 |

16 app tests and 13 backend tests added. No test was deleted or weakened.
`go build`, `go vet`, `gofmt -l`, `go test -count=1` and `go test -race` are all
clean, the last two against a real Postgres as well as without one.

**Decided with no code change**, and now recorded in `DECISIONS.md` so they are
not re-opened: the meal-wide delete stays a long press; a food write targets the
day on screen rather than today; `dashboard/nutrition.tsx`'s meal rows pushing
the food tab is accepted.

---

## 1. The chart chrome is one component — `9844cf2`

**`src/components/display/DetailChart.tsx`** (new, 238 lines) exports `Plot`,
`Axis`, `ChartHeader`, `KickerTitle`, `StatLine`, `BreakdownRow`, `heroLabels`,
the `Bar`/`Col` types and the `HERO_H`/`SEC_H` plot geometry. `GUTTER` stays
module-private: `Plot` and `Axis` share it so their columns line up, and no
route needs it.

All four routes — `/energy`, `/dashboard/week`, `/dashboard/training`,
`/dashboard/nutrition` — import it. **866 lines came out of them**, and the
three `ponytail:` comments that asked for this are discharged.

### It was a move, not a redesign — established before writing anything

The four copies were compared mechanically first, comments stripped. They were
**identical**, differing by exactly two lines in the whole set:

- `RANGE_DAYS = 14` sat inside training's chrome block. It is a training
  binding, so it stayed in `training.tsx`.
- `HERO_H` is absent from macros, which has no 14-day hero. It simply does not
  import it.

So **nothing needed a variant prop and nothing was dropped**. The differences
between the four views are all in what they *feed* the chrome — columns, scale
ceilings, axis labels, empty states, footnotes — and every one of those stayed
in its route. Two things were deliberately *not* moved: `signed()` (duplicated
in `energy.tsx` and `week.tsx`, but it formats a number and is not chrome) and
`Legend` (one caller in `energy.tsx`; one caller is not duplication).

### Confirmation the four screens are visually identical

`src/__tests__/render/detailChrome.render.test.tsx` mounts all four screens
whole and snapshots the **entire rendered host tree** — every `View`, every
style object, every `accessibilityLabel` — 10,066 lines across the four.

The snapshots were recorded **from the pre-extraction sources**, archived, and
then replayed against the extracted ones with `--ci` (which forbids rewriting).
They pass **byte-for-byte**; the snapshot file on disk is identical to the
archived pre-extraction copy. Data hooks are mocked with fixed rows and the
clock is pinned, so a snapshot is a function of the components alone, and the
fixtures deliberately include days the server could not compute so the **gap**
branches — the ones a careless extraction breaks first — are in the tree.

Also confirmed by hand on the iPhone 17 Pro simulator: the macros detail renders
the kicker, stat line, chart header, the plot with its ceiling label and both
gridlines, the axis labels aligned under the columns, and the Breakdown list —
with Fibre correctly drawing no bar at 0%.

### Regression guard

`summaryDetails.test.ts` gains seven tests: `DetailChart.tsx` must export every
shared piece, each route must import the chrome and **must not redeclare any of
it**, no route may still carry the `ponytail:` marker, and the shared file is
held to the same "no literal number beside a unit" grep the routes already face.
The guard was checked against the pre-extraction sources and catches all seven
duplicated declarations, so it is not vacuous.

---

## 2. `GET /api/food/days` — `d448bc5`

`useLoggedDays()` decided which days get a dot by calling `GET /api/food/logs`
with no date. That returns **every row the user has ever logged**, each with its
macros and its `scan_results` blob, and the client read the `date` off each one.
At a year of logging that is thousands of rows to derive a few hundred strings.

### Contract

```
GET /api/food/days[?from=YYYY-MM-DD][&to=YYYY-MM-DD]

200  {"data": ["2026-09-01", "2026-09-03", "2026-09-10"], "error": null}
400  {"data": null, "error": "from must be YYYY-MM-DD"}
400  {"data": null, "error": "to must be YYYY-MM-DD"}
400  {"data": null, "error": "from must not be after to"}
401  — no token; the route sits behind the same Clerk middleware as the rest
```

- **A bare array of ISO dates is the whole response**, because membership is all
  the UI ever asks for: `WeekStrip` and `/food/calendar` only call
  `loggedDays.has(iso)`. The dot-rendering code was read first to confirm that.
- **Distinct and sorted oldest-first**, done in the database. N logs on one day
  is one dot.
- **`from`/`to` are inclusive** and optional. A malformed date or a backwards
  range is a **400**, never a silently ignored filter — a filter that degrades
  into "no filter" answers a different question than the one asked.
- **Empty is `[]`, never `null`.** The client builds a `Set` from it directly.
- **Scoped to the authenticated user** via `auth.UserID(r.Context())`, the same
  pattern as every other `/api/food/*` route. A `user_id` in the query string is
  ignored.
- **No status filter, deliberately.** An `analyzing` / `ready` / `failed` scan
  row still marks its day, which is exactly what the client this replaces did.
  Filtering to `confirmed` would silently delete dots that are on screen today.
- **No migration.** `food_logs_user_date_idx (user_id, date)` from the initial
  schema already covers `SELECT DISTINCT date … WHERE user_id`.

### Test coverage — 13 tests

Ten drive the handler through the hermetic fake (`tests/food/days_test.go`):
ownership, per-user mirror, `user_id`-in-query ignored, empty-is-`[]`,
distinct + sorted, inclusive range, empty window, malformed range (five
spellings), backwards range, and every-status-counts.

Three run the **real SQL against a real Postgres** (`tests/food/days_pg_test.go`,
skipped without `LUME_TEST_DATABASE_URL`): ownership, dedupe + sort, and
inclusive bounds. A Go-side fake filters in Go and can never catch a missing
`WHERE user_id`, which is precisely the mistake that would leak one user's
calendar into another's.

**The ownership test, specifically.** `TestLoggedDaysOwnership` (fake) and
`TestPG_LoggedDaysNeverLeaksAnotherUsersDays` (real Postgres) both seed user A
with 1 Sept and 3 Sept, user B with 2 Sept, and assert each sees only their own
dates plus that A's result does not contain B's day. The endpoint was wired to
the app only after these passed. The PG one was then **mutation-tested**:
replacing `WHERE user_id = $1` with a tautology made it fail with the other
user's date in the result, so the test genuinely detects a leak rather than
passing by construction.

### Frontend

`api.foodLogs.days(range?)` calls the endpoint; `useLoggedDays()` consumes it
and builds its `Set`. A failed call still draws **no** dots — a dot is a claim
that a day has a log — and `?? []` keeps a null body a dotless calendar rather
than a crash.

`api.foodLogs.list()` keeps its optional `date` because the backend route
genuinely supports the unfiltered form and two API-contract tests exercise it;
what changed is that **no product code calls it that way any more**, and
`foodDates.test.ts` fails if one starts. That guard was also checked against the
old source and does catch the call it replaced.

### Verified end to end in the simulator

The app was run against a request-logging stub. It issued `GET /api/food/days`,
rendered dots on **exactly** the three dates returned (7, 8 and 10 September and
no others), and made **no** unfiltered `GET /api/food/logs` call — only the
day-scoped `?date=2026-09-08`.

---

## Things that surfaced and need a further human call

1. **A *failed* scan row still puts a dot on its day.** The endpoint counts
   every status, which is what the old client did, so this ships no behaviour
   change — but "the scan failed" is arguably not "there is food on this day".
   Filtering `failed` (while keeping `analyzing`/`ready`) is a one-word change
   plus a test edit if that reading is preferred.
2. **`useLoggedDays()` still asks for the whole date set, not the visible
   window.** It is bounded and tiny now (dates only), but a ten-year user still
   receives ~3,650 strings on mount. The `from`/`to` parameters exist and are
   tested; nothing passes them, because doing so would mean refetching every
   time the week or month moves — a behaviour change nobody asked for. Worth a
   decision if the calendar ever gets heavier.
3. **The backend gate has been hiding 11 real-SQL tests.** They skip *silently*
   without `LUME_TEST_DATABASE_URL`, so "0 failures" has never meant the SQL ran.
   All 11 were executed this pass against a real Postgres and all 11 pass — but
   CI provisioning a throwaway Postgres would turn that from luck into coverage.
   The three new `TestPG_LoggedDays*` tests join the same gate.
4. **The documented recipe for that Postgres is incomplete.** The header comment
   in `tests/gym_schedule/schedule_pg_sql_test.go` (copied into the other PG
   suites) omits `CREATE ROLE authenticated`, so following it verbatim fails on
   the first migration's RLS policies. The corrected recipe is in the new
   `tests/food/days_pg_test.go`; the older copies were left alone as out of
   scope for this pass.
5. **`onboardingContract.test.ts:130` carries an unused eslint-disable
   directive.** Pre-existing, one of the 35 baseline warnings, untouched here.

## Commits

```
9844cf2  refactor(summary): one DetailChart instead of four copies of it
d448bc5  feat(food): GET /api/food/days, so the calendar stops fetching everything
```
