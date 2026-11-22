HANDOVER: Lume Phase 3, branch loop/phase3. No files were changed while writing this.

ROW STATUS (PHASE3_ROWS.md, 22 lines, 17 rows)
- BUILT: 1, 2, 3, 4, 7, 8, 9, 10, 12, 15, 16, 17. Row 17 became BUILT this session; gaps 1, 2 and 6 are recorded as owner items.
- PARTIAL: 5, 6, 13, 14.
- DIFFERENT: 11.
- Each row now has exactly one capitalised status word, in its status column.

BUILT THIS SESSION
- Row 17, gap 5: src/app/ai-query.tsx:110 checks answer.trim(). An empty or whitespace-only answer shows aiQueryAnswer.empty (new group in en, es, fr). Tests: aiQueryEmpty.render, aiQueryEmptyAnswer.render.
- Row 14: src/components/food/WeekStrip.tsx. The arrows read the new weekStrip.previousWeek and nextWeek keys; the today chip reuses gymCalendar.todaySuffix. Test: weekStrip.strings.render.
- Row 6 step 1: PERF_BASELINE.md, a code-reading audit. No numbers are measured yet.
- Docs-only cleanups on Rows 8, 13 and 14.

IN PROGRESS
Nothing half-done.

LAST GATES
tsc 0 errors. Full Jest 236 suites and 1,344 tests pass. The files added since add 2 suites and 6 tests.

DECISIONS
- Reuse a key whenever the English and the meaning match. That is why there is no aiQueryEmpty.noAnswer key and no new ", today" key.
- A new test file needs a name that does not differ from an existing one only by case. The macOS file system ignores case, so the new file would overwrite the old one (WeekStrip.render already exists).
- The Row 6 Gym history FlatList was not built. The ScrollView belongs to Screen.tsx, which also draws the page title, and all rows share one Card. A real FlatList would need a styling change.
- Never edit existing tests or snapshots. src/lib/data stays off limits.

WAITING ON ISA
- Row 6 Gym history, one of three options: per-row card pieces, a list mode on Screen, or limiting hydrateGym in hooks.ts:170 (the one I recommend).
- useGoals exposing isLoading, error and refetch (Row 15).
- Row 17 gaps 1, 2 and 6 (hooks.ts, aiBrain.ts).
- Row 8's BUILT status, since its notes say partial.
- es and fr wording review; the Jest baseline.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. Pass Jest paths through xargs.
- findAll matches each Pressable at several wrapper levels, so dedupe labels with a Set.
- hydrationErrorScreens.test.ts says gym/history must not be edited.
- The loop keeps resending Row 17 gap 5, which is closed.

UNFIXED
- backend/internal/gym/schedule_pg.go:765-767 sorts oldest first before LIMIT 30, so the newest progress entries are dropped.
- aiBrain.ts:154: the empty-answer copy can show behind the paywall (Phase 4).
- 49 backend queries use id::text = $1, which bypasses the id index.
- useGym refetches on every mount, and its session read has no limit.
- aiQueryEmpty and aiQueryEmptyAnswer overlap.
- Row 13 notes are out of round order (Round 73 comes after Round 80).
- nutrition.tsx spoken kcal label (needs the snapshot regenerated).