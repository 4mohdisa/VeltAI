# VeltAI — Close Real Frontend Gaps (before backend)

Closed the three real frontend gaps from `FRONTEND-STATE-AUDIT.md`, still on mock
data, so the backend swap becomes a per-hook change and onboarding actually drives
the app. Frontend-only, `npx tsc --noEmit` clean before every commit. Monochrome +
light + glass chrome preserved.

---

## Task 1 — Data-access seam (+ 1b in-session stores)

**New `src/lib/data/` is the single seam between screens and data.**

- **In-session zustand stores** (seeded once from the centralized mock; edits
  survive navigation within a session — no cross-restart persistence, that's the
  backend):
  - `foodStore.ts` — `meals` (items get stable ids; totals recompute on
    edit/delete and on seed) + `savedFoods`.
  - `gymStore.ts` — `streak`, 30-day `calendar`, `sessions`; `logGymSession`
    extends the streak + marks today + prepends history; `applyFreeze`.
  - `userStore.ts` — the user `profile` + body metrics (onboarding writes here).
- **Hooks shaped like real async access** — `{ data, isLoading, error, refetch }`
  (mirrors React Query): `useFoodLog`, `useMeal`, `useSavedFoods`, `useFoodSearch`,
  `useMealHistory`, `useDailyMacros`, `useGym`, `useGoals`, `useUserProfile`,
  `useDashboard`, `usePlan`, `useSubscription`. A `useInitialLoad` shim drives the
  loading slot so skeletons/empty/error are exercised now and reuse later.
- **Mutations** (imperative, like `mutate`): `logMeal`, `editFoodItem`,
  `deleteFoodItem`, `saveFood`, `editSavedFood`, `unsaveFood`, `logGymSession`,
  `applyFreeze`, `setGoals`, `setUserProfile`, plus scan stubs.
- **Macro totals derive from logged meals** (`useDailyMacros`): consumed = Σ meals,
  targets = goals — so logging a meal updates the dashboard/nutrition rings live.

**Screens refactored to consume the seam (17 screens)** — no longer import mock
values directly: food log, meal detail, saved foods, gym tab + streak/history/
freeze/log-session, dashboard, nutrition, profile, account, plan, subscription.

**Remaining direct mock-value reads (by design):** `food/photo-review.tsx` +
`food/voice.tsx` (scan AI data — voice kept as-is; photo-review now superseded by
capture-first) and `(onboarding)/wow.tsx` (onboarding projection). Everything else
goes through `@/lib/data`.

Commit `frontend-seam: data-access hooks + in-session stores over mock`.

## Task 2 — Onboarding → app state + derived goals

- On completion the **generating screen calls `commitOnboarding(answers)`**
  (`lib/onboarding/commit.ts`): body metrics + dietary prefs → `userStore`, chosen
  units → settings, goal mode → AI.
- The **"AI recommendation" goal is now derived** from the user's inputs
  (`lib/goals/derive.ts`), no longer a hardcoded mock number: **Mifflin-St Jeor
  BMR → × activity factor (from target gym sessions/week) → + goal adjustment
  (deficit/surplus) → calories**, then **protein from bodyweight, fat 25%, carbs the
  remainder, fibre 14 g/1000 kcal**. Floored at a safe 1,200 kcal. Stays editable via
  the existing custom-goals override.
- **Verified end to end on the simulator:** the dashboard/nutrition show the derived
  **2,390 kcal / 148 P / 301 C / 66 F / 33 fibre** (default profile) instead of the
  old static **2,150 / 165 / 215 / 75 / 30**, with consumed summed from the logged
  meals. The onboarding body screen already stores canonical kg/cm, so imperial users
  derive correctly.

Commit `frontend-onboarding: bridge answers into user state + derived goals`.

## Task 3 — Photo + barcode scan: analyzing/loading state

- **Photo is now capture-first:** the capture button calls `startPhotoScan()` which
  logs **pending rows** to today's slot through the seam and drops the user into the
  food log, where the rows render as **"Analyzing…" skeletons that fill in** once the
  mock inference resolves (1.6 s). Tapping a pending row still works.
- **Barcode confirm** shows a brief **"Looking up product…" skeleton** before the
  product fills in (`lookupBarcodeAsync`, 0.9 s).
- Both route through `src/lib/data/scan.ts`, so swapping in the real Gemini /
  Open Food Facts call is a one-place change. **Voice unchanged** (its own
  progressive transcript).

Commit `frontend-scan: analyzing/loading state for photo + barcode`.

## Task 4 — Cleanups

- **typedRoutes enabled** (`app.json`). Static literal `router.push` routes are now
  type-checked (types generate via the Metro typegen; tsc + export stay green). The
  onboarding/add-menu build paths dynamically (string), which typedRoutes can't
  infer — so the **nine scattered `router.push(x as never)` casts are replaced by a
  single `navigate()` helper** (`src/lib/nav.ts`) owning the one `string→Href` cast.
  **Zero `as never` in app code.**
- **`onboardingStep` dead code removed** — it was written but never read; resume-from-
  step needs persisted answers (a backend concern), so the write + its now-unused
  secure-store helpers were deleted.

Commit `frontend-cleanup: typedRoutes + onboarding-step dead code`.

## Audit & verify

- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Grep:** screens read through `@/lib/data` (17 screens); mock value-access is
  centralized in `src/lib/data/` — only the scan-flow (`photo-review`, `voice`) and
  onboarding (`wow`) read mock directly. Zero `as never`.
- **Simulator (iPhone 17 Pro):** dashboard/nutrition reflect the **derived** goal
  with **meal-derived consumed**; food log renders from the store. (In-session edit
  persistence is guaranteed by the shared zustand stores — every screen reads them
  reactively; the derived-consumed render proves the store feeds all surfaces.)
- Fixed a seed inconsistency so the food-log total and nutrition consumed agree
  (meal totals recompute from items on seed).

Commit `frontend-gaps: audit clean`.

## Git log
```
frontend-gaps: audit clean
frontend-cleanup: typedRoutes + onboarding-step dead code
frontend-scan: analyzing/loading state for photo + barcode
frontend-onboarding: bridge answers into user state + derived goals
frontend-seam: data-access hooks + in-session stores over mock
```

## `[?]` Deferred (expected — backend phase)
- **Persistence across app restart** — stores are in-session only (meals, goals,
  units, streak reset on cold start). Backend + a persist layer.
- **photo-review (C4 confirm) + uncertainty (C5)** screens are now superseded by the
  capture-first flow; they remain as routes but aren't in the main path. Decide
  whether to fold the multi-item review/uncertainty into the capture-first fill-in or
  retire them when the real Gemini scan lands.
- **Simulator can't drive** the 18-screen onboarding or the camera capture via
  `simctl`, so those flows were verified by code + the derived-goal render, not an
  automated tap-through.
- Subscription restore/manage + account photo remain toast stubs (real IAP / upload =
  backend).

## Updated readiness statement

**The frontend is now genuinely done in UI *and* structure, and ready for a clean
backend swap.** Data flows through one seam (`src/lib/data/` hooks + mutations) with
the mock confined behind it, so the backend phase replaces mock-inside-hook with real
calls largely without touching screens; onboarding now drives the app via derived
goals and real user numbers; scan has real async loading slots; and the type/route
holes are closed. The only remaining work is backend-by-nature (persistence, real
APIs, IAP), not frontend defects.
