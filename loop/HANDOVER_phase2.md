Handover — Phase 2, loop/phase2 branch, after row-9 day-boundary fix + PHASE2_ROWS.md audit

Gate status: all 84 rows in PHASE2_ROWS.md are BUILT (0 DIFFERENT/PARTIAL/EXACT); 47 rows still carry "owner check pending" in Notes (all tied to one root cause: sign-in can't run locally against hosted Clerk). Header has 9 pipes; every row now matches.

This session's work, all on row 9 (Gym log) / TodayCard, src/components/gym/TodayCard.tsx:
1. Confirmed the LoggedCard sessions.find gotcha was real: no cached "create response" exists anywhere with real exercises/duration shape (api.gym.createSession's row is only ever used in src/lib/data/mutations.ts to swap an id onto useGymStore's simplified history shape, which lacks exercises). Fixed the silent-null case: when a checked-in session isn't found in the fetched range, TodayCard now shows the existing LoadFailedNotice (with retry) instead of rendering nothing.
2. Widened the day-boundary gap: LoggedCard's useGymRange(1) → useGymRange(2), covering today and yesterday, so a session logged near midnight is still found. Hook lives in src/lib/data/gymRange.ts (not hooks.ts — a recurring task-brief error worth knowing).
3. Tightened a real footgun in src/lib/data/gymSchedule.ts: revalidate's useCallback had deps [fetcher, fallback], both unstable every render — now reads them via useRef with deps []. Both callers (TodayCard.tsx, src/app/(tabs)/gym.tsx) already used empty-deps wrappers, so no caller changes needed.
4. Test coverage added across rounds, all in src/__tests__/render/todayCard.render.test.tsx (now 6 tests) and src/__tests__/gymSchedule.revalidate.test.ts.
5. PHASE2_ROWS.md cleanup: fixed row 5's stray extra pipe cell and row 18's stray "BUILT" word leaking into its Notes cell (both pre-existing structural bugs, unrelated to row 9).

Gotchas flagged but NOT fixed:
- Row 17 (plan.tsx): confirmed via fresh grep — no backend route exists for AI-generated plans; plan.tsx is fully local (planForBuild() in src/lib/data/hooks.ts, mock data in dev, empty array in release). Flagged for Isa, not a Decisions Log item.
- src/app/(tabs)/gym.tsx now has two separate useFocusEffect calls (refetchMonth, revalidate) — not a bug, just a possible future consolidation.
- A session logged outside even the widened 2-day window would still fall back to the retry notice — untested edge, accepted as a known limit.

No feature currently mid-flight; last action was a read-only verification task (row 17 print, status counts, plan-route grep), no files changed.