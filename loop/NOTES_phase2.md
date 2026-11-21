# Lume Loop Notes: Phase 2

## Goal
Wire every row in PHASE2_ROWS.md to the local backend and test flows. Progress is counted from PHASE2_ROWS.md. Verify the file before trusting any status.

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Last green checkpoint: round 263 (tsc 0 errors; Jest 134 suites, 990 tests, 4 snapshots; go test green, TestPG skipped; LUME_TEST_DATABASE_URL unset).
- Round 264: row 17 plan card removed for v1, render test added. Pipe count 9, matches header.
- Status: 84 rows, all BUILT. 47 carry 'owner check pending'. Loop stopping at round 265 (stop report).
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show as modified in git status. Isa to check.

## Wording rule
- Use BUILT, 'checked in code', 'owner check pending', 'render test added'. Never 'verified' or 'confirmed' except api.scan.confirm.
- BUILT only when every part is done. Partial = PARTIAL.
- Status word in capitals appears only in the Status cell.

## Decisions (never delete)
- Local backend and local DB only. RevenueCat over Stripe. v1 locked; extras to Parked.
- Phase 1 design final. Isa verifies on device.
- TestPG only after DSN checked as 127.0.0.1:55432.
- plan.tsx and AI anomaly banner: no backend, no fabricated data.
- Clerk sign-in needs hosted JWKS: owner step. No auth bypass. Rows BUILT on passing local mocked tests.
- Modals: reduceMotion ? 'fade' : 'slide_from_bottom'.
- Render tests: components *.render.test.tsx; screens in src/__tests__/render/. No RNTL (RN 0.85.3).
- Rows 19, 20: no edit. Row 21: no data model or backend change; client aggregation over foodLogs.list per day.
- Row boundaries strict. Local-only mutations need no API test.
- Hosted migrations stay Isa's. Checkpoint rounds change no files.
- Row 9: TodayCard shows retry notice for a session outside the range (today plus yesterday, useGymRange in src/lib/data/gymRange.ts).
- Row 84 focus refetch uses silent revalidate with [] deps on focus callbacks.
- Round 261: checkpoint chosen over Jev ask.
- Round 264: row 17 chosen over Jev's view of a different first task (default b, smallest unblocked task).
- Round 265: stop. All rows BUILT; remaining items are owner steps.

## Done
- BUILT: all 84 rows (see PHASE2_ROWS.md). 47 carry 'owner check pending'; do not reopen them.
- Row 17: AI plan card removed for v1 (src/app/dashboard/plan.tsx), render test added.

## Blocked on Isa
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for simulator flows (install command needed from Isa's Mac).
- Merge loop/design-match into main: Isa.
- Token pass (icon sizes, stroke, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Hosted Supabase migrations: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md modified in git status: Isa to check.
- Row 17 path: task named src/app/(tabs)/plan.tsx; real file is src/app/dashboard/plan.tsx. Isa to confirm the target.

## Parked (not v1)
- Row 21: DetailChart lays Bars as a flex row, not stacked. Copy decision.
- Dead code: planReasonForBuild (src/lib/data/hooks.ts) and mockPlanReason (src/lib/mock/data.ts) unused after row 17. Remove in a later cleanup.
- planForBuild still backs the plan timeline; keep.
- Recipe and saved meal delete/unsave: no UI.
- Row 34 swipe pane square corners: design decision.
- Off-token values; ProgressBar 250 vs motion 260 ms.
- Sheet detents medium/large: no native mechanism.
- Food log long-press delete not discoverable. Goals 'Saved as you type' untrue when clamped.
- Account and index settings both link Delete Account.
- Rows 35 and 54 share one card and test file. Merge? Isa decision.
- gesture-handler worklet warning in SwipeableRow: pre-existing.
- logGymSession while gymLoggedToday is true.
- Muscles and exercise-progress design gaps: product decision.
- Button and LumeTabBar lack numberOfLines (es/fr overflow risk).
- Audit render tests with hardcoded *_date fixtures: pin the clock where found.
- Server 'today' uses fixed LUME_TIMEZONE, not device timezone (backend/internal/config/config.go).
- Two useFocusEffect calls in gym.tsx (refetchMonth, revalidate): possible consolidation.
- Local Clerk-compatible verifier and local test env file for LUME_TEST_DATABASE_URL: owner steps.
- Row 9: a session outside the 2-day range shows the retry notice. Known limit, untested edge.
- Loop script: force go test ./... -count=1 once per handover so cached results cannot hide a failure. Isa decision.
- Simulator flows for all rows: not run (Maestro not installed). Owner step.

## Next
- Stop report to Isa. Loop ends at round 265.
- Isa next: install Maestro, run claude auth login, set E2E_EMAIL and E2E_PASSWORD, decide the merge and the token pass.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- es/fr strings run 2.5x to 3.7x English.
- Headless Jest only; no simulator run yet. '[data] API unreachable' console noise is expected.
- Reanimated: mock ReanimatedSwipeable and stub useReducedMotion per test file only.
- Mock @/lib/api at the module boundary only. Screens using Screen need SafeAreaProvider.
- Count pipes against the header row before and after any PHASE2_ROWS.md edit.
- Jest SIGSEGV on resetRegistry.test.ts is transient; rerun before blaming a change.