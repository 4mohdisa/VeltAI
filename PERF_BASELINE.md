# Performance baseline (Phase 3, Row 6)

Step 1 is a code-reading audit only. No code was changed and nothing was measured. Each budget below is a proposed target, not a result.

## Budgets

| Metric | Proposed budget | Measured |
|---|---|---|
| Cold start (tap icon to first frame) | 2.0 s | not measured: needs simulator run |
| Time to first screen (Today tab with data) | 1.5 s after first frame | not measured: needs simulator run |
| Screen transition (push to first content) | 300 ms | not measured: needs simulator run |
| Scroll smoothness, longest list (Food tab day, seeded heavy user) | 58 fps or more, no frame over 32 ms | not measured: needs simulator run |
| Memory (after 5 minutes of tab switching) | 250 MB | not measured: needs simulator run |
| Slowest backend route (local, seeded heavy user) | 200 ms p95 | not measured: needs simulator run |

## Screens read

| Screen | List type | keyExtractor | getItemLayout | Items memoised | Images | Repeat fetch on load |
|---|---|---|---|---|---|---|
| Food tab, `src/app/(tabs)/food.tsx` | SectionList (meal rows and search results) | yes, line 418 | no | by the React Compiler (`app.json:42`), no manual memo | none | 4 hydrations on mount (food log, logged days, insights, search); no repeat in one load |
| Gym history, `src/app/gym/history.tsx` | `sessions.map` inside the Screen ScrollView | `key={session.id}` | n/a | React Compiler | none | 1 (`useGym`), refetched on every mount |
| Exercise search, `src/components/gym/ExercisePicker.tsx` | FlatList, `initialNumToRender={12}` | yes, line 163 | no | React Compiler | none | 1 (`useExercises`) |

Data layer (`src/lib/data/hooks.ts`): there is no React Query and no staleTime. `useHydration` (lines 53-93) calls the API on every mount, and the zustand store is the only cache.

## Backend list routes read

| Route | SQL filter | Index |
|---|---|---|
| GET /api/food/logs | `user_id`, optional `date` (`food/pg.go:41-47`) | `food_logs_user_date_idx (user_id, date)` |
| GET /api/food/days | `user_id`, optional date range, DISTINCT (`food/pg.go:174-179`) | `food_logs_user_date_idx` |
| GET /api/food/summary | `user_id`, `date`, `status` (`food/pg.go:159`) | `food_logs_user_date_idx` |
| GET /api/food/saved | `user_id` (`food/pg.go:205-207`) | `saved_foods_user_idx` |
| GET /api/gym/sessions | `user_id`, optional date range, no LIMIT (`gym/pg.go:52-56`) | `gym_sessions_user_date_idx (user_id, date)` |
| Session exercises | `session_id = ANY(...)` (`gym/pg.go:93-95`) | `gym_exercises_session_idx` |
| GET /api/gym/progress/{name} | `gs.user_id`, `ge.name ILIKE` (`gym/schedule_pg.go:760-767`) | user and session covered; `name ILIKE` has no index |
| GET /api/gym/exercises | filters, LIMIT 200 (`gym/schedule_pg.go:54`) | not checked against the exercise_library indexes |

## Hotspots

- `src/lib/data/hooks.ts:170`: `hydrateGym` calls `api.gym.listSessions()` with no date range, and `gym/pg.go:52-56` has no LIMIT, so every gym load returns the user's full session history and its exercises. Planned fix: a bounded range or a page size on the history read. Needs Isa, because `src/lib/data` is off limits.
- `src/lib/data/hooks.ts:53-93`: `useHydration` has no freshness window, so each of the 6 `useGym()` screens (gym tab, profile, freeze, streak, history, log-session) refetches sessions and streak on every mount. Planned fix: skip the refetch when the store was hydrated in the last N seconds. Needs Isa (`src/lib/data`).
- `src/app/gym/history.tsx:41`: all sessions render through `.map` inside a ScrollView, with no virtualisation. Combined with the unbounded read above, the heavy user mounts every row. Planned fix: a FlatList with `keyExtractor`, keeping the current card look.
- `src/app/(tabs)/food.tsx:416`: the SectionList has no `getItemLayout`. The rows vary in height, so it is likely not worth adding. Planned fix: none until the scroll fps is measured.
- Backend, 49 queries: these use `WHERE id::text = $1` (for example `food/pg.go:66`, `gym/pg.go:143`). Casting the uuid column to text stops the primary-key index from being used, so each lookup by id is a sequential scan. Planned fix: compare `id = $1::uuid`, with a test, once a slow route is measured.
- `gym/schedule_pg.go:764`: `ge.name ILIKE $2` has no index on `gym_exercises.name`. Rows are first narrowed by the user's sessions, so the expected cost is low. Planned fix: measure before adding an index.
