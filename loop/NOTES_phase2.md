# Lume Loop Notes: Phase 2

## Goal
Wire every row in PHASE2_ROWS.md to the local backend and test flows. Progress is counted from PHASE2_ROWS.md. Verify the file before trusting any status.

## State
- Repo: /Users/mohammedisa/Development/projects-app/LumeAI. Branch loop/phase2 only. Never switch, push or merge.
- Local only: API http://localhost:8080. Postgres 127.0.0.1:55432, container lume-test-pg.
- Round 261 checkpoint green: tsc 0 errors; Jest 134 suites, 990 tests, 4 snapshots. Backend go test green, TestPG skipped.
- Handover: 84 rows, all BUILT, 47 carry 'owner check pending'. Header has 9 pipes.
- Loop files loop/DECISIONS_LOG.md and loop/NOTES_phase2.md show as modified in git status. Isa to check.
- Prompts: one row or one checkpoint, one file, full paths, grep before creating a test file. Every prompt states the loop/phase2 rule. Prompts never edit loop/ files.
- A loop flag on a report means the gate runs next round.

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
- Row 9 includes the TodayCard malformed-response guard and retry notice for a session missing from the range. Range is today plus yesterday (useGymRange in src/lib/data/gymRange.ts).
- Row 84 focus refetch uses silent revalidate with [] deps on focus callbacks.
- Round 261: checkpoint chosen over Jev ask.
- Round 262: read only grep chosen. Row 17 default (b) to be applied the round after this one.

## Done
- BUILT: all 84 rows (see PHASE2_ROWS.md). 47 carry 'owner check pending'; do not reopen them.

## Blocked on Isa
- Row 17 plan.tsx: asked round 260, no answer. Default (b) drop the card for v1, recorded in decisions.
- Sign-in: hosted Clerk JWKS; E2E_EMAIL and E2E_PASSWORD unset. Blocks live checks for rows 1, 2, 18.
- Claude CLI sign-in expires 2026-11-24 to 2026-11-27: run claude auth login.
- Maestro not installed: owner step for simulator flows.
- Merge loop/design-match into main: Isa.
- Token pass (icon sizes, stroke, letter-spacing, 9pt space, bar width, small radius): one design pass with Isa.
- Hosted Supabase migrations: Isa.
- loop/DECISIONS_LOG.md and loop/NOTES_phase2.md modified in git status: Isa to check.

## Parked (not v1)
- Row 21: DetailChart lays Bars as a flex row, not stacked. Copy decision.
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

## Next
- Round 262 result: read the grep report. Fix any hit in one cell in a separate row task.
- Then row 17 default (b): remove the plan card for v1 in one row task, with a test.
- Then the stop report.

## Known issues
- Authenticated flows cannot run end to end until sign-in is solved.
- Jev risk about 1.2 of 2: keep tasks small, one row, one file.
- Claude Code 5-hour limit: if hit, wait one round, do not change scope.
- es/fr strings run 2.5x to 3.7x English.
- Headless Jest only; no simulator run yet. '[data] API unreachable' console noise is expected.
- Reanimated: mock ReanimatedSwipeable and stub useReducedMotion per test file only.
- Mock @/lib/api at the module boundary only. Screens using Screen need SafeAreaProvider.
- Count pipes against the header row before and after any PHASE2_ROWS.md edit.
- Jest SIGSEGV on resetRegistry.test.ts is transient; rerun before blaming a change.