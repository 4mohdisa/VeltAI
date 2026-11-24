Handover: Lume Phase 4, branch loop/phase4

Built so far
- Row 1 (Foundation) is BUILT. Node 22.23.5 comes from nvm (the shell default is 24, so put v22 first on PATH). backend/.env is git ignored. Local PostgreSQL 17.10 runs on localhost:5432 as a brew service. lume_test_local has all 18 supabase/migrations applied, and all 21 TestPG tests pass. Baseline: tsc 0 errors; Jest was 242 suites and 1,397 tests at baseline and 1,400 tests at the last full run; Go 34 packages ok. Details are in BASELINE_phase4.md.
- Row 2 is PARTIAL. It has sub-steps 2.1 to 2.5, named that way so they don't clash with rows 2b to 2d. No other row is built.

Row 2.1 so far
- hydrateGym (src/lib/data/hooks.ts) now asks for at most GYM_SESSION_HYDRATE_LIMIT = 200 sessions. GET /api/gym/sessions accepts an optional limit (backend/internal/gym/gym.go and pg.go). With 1,000 sessions seeded, reads went from 1,000 to 200.
- GET /api/gym/streak now returns total_days: COUNT(DISTINCT date) over all of the user's sessions, never capped. The query uses a LEFT JOIN from a one-row source because imported sessions can exist without a streak row.
- The app's GymStreak type (src/lib/api.ts) has total_days. streakFromApi(row) in src/lib/data/mappers.ts is now one-argument and takes the Total from row.total_days.

In progress: stale test mocks
- These still lack total_days: freeze.render, gymStreakStripFootnote.render, dashboardSummary.render, hydrationErrorState.render and summaryHydration.render (all in src/__tests__/render/), plus src/__tests__/productionReadiness.test.ts. Fix them 3 files per round.
- The tests pass, but in these mocks the tile value is undefined. When all are fixed, Row 2's note says 2.1 is done.

Decisions and why
- The session list is capped because it was unbounded and also loaded every exercise.
- The total is computed on the server so the cap doesn't shrink the Total tile.
- A request without a limit still returns everything, so other callers keep working.

Gotchas
- 127.0.0.1:55432 is an unidentified ssh tunnel. Never connect to it. The AFCD owner check in OWNER_CHECKS_phase4.md uses that port, so Isa must confirm what it reaches.
- zsh doesn't split unquoted variables. Pass Jest file lists with printf '%s\0' and xargs -0, and quote --include globs.
- The task brief named a mockStreak in useApiHarness.ts, but there is no streak mock there. The one in src/lib/mock/data.ts uses the app's field names, not the API's.
- The status words (DIFFERENT, PARTIAL, BUILT, EXACT) go only in the status column. Never edit loop/DECISIONS_LOG.md or loop/NOTES_phase4.md, and only append to OWNER_CHECKS_phase4.md.
- Pass LUME_TEST_DATABASE_URL only inline in the shell, and never print it.

Not fixed
- src/app/food/history.tsx:66 reads every session with no limit.
- hooks.ts:400 has a react-hooks/set-state-in-effect lint error, which belongs to Row 2.2.
- KNOWN_ISSUES.md line 40 still says 20 TestPG tests skip; there are 21 and they run.
- Deploy the backend before the app, or the Total tile shows undefined.
- The Jest output has act() warnings from ScanReviewCard.