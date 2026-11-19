Handover — Phase 2, loop/phase2 branch

Rows now BUILT: row 8 (Saved foods/recipes/meals) and row 7 (Food detail) — every live API call site each row declares has an executed render test, re-checked by reading the actual screen source against the test files, not just source-text grepping. Row 18 (Energy screen) re-checked and confirmed still BUILT. Row 6 (Barcode/label/photo scan) stays PARTIAL: barcode part now has render coverage (barcodeScan.render.test.tsx), label and photo parts still have none.

This session's work (test files touched):
- src/__tests__/render/recipeLog.render.test.tsx — success + failure path for api.recipes.log (RecipesList.tsx).
- src/__tests__/render/savedMealsLog.render.test.tsx — added failure path for api.savedMeals.log (SavedMealsList.tsx).
- src/__tests__/render/foodDetailLogged.render.test.tsx — added "Save to my dishes" (saveFood), "Remove from saved" (unsaveFood, saved mode), and "Delete item" (deleteFoodItem) tests. This file now covers all four of row 7's declared call sites (foodLogs.update/delete, savedFoods.create/delete).
- src/__tests__/render/barcodeScan.render.test.tsx (new) — covers src/app/food/barcode-scan.tsx, mocking lookupBarcodeAsync (@/lib/data/scan.ts, wraps api.foodSearch.barcode) plus stubbing expo-camera's CameraView and @/components/display/LoadingSkeleton (reanimated useReducedMotion crash, same recurring gap).

Decisions worth keeping:
- Row boundaries are strict: search/barcode-mode logMeal and review-mode rename in food/detail.tsx belong to rows 3/6, not row 7 — left untested here, flagged for those rows instead of expanding row 7's scope.
- "Local-only" mutations (editSavedFood — no backend update endpoint) never need an API test.
- Reanimated's useReducedMotion keeps crashing Skeleton/SkeletonList/SkeletonCard/SwipeableRow refs in this render harness — always stub only the broken piece inside the test file, never the screen.
- Dev-only "Simulate scan"/"Unknown code" buttons on barcode-scan.tsx are the right way to drive its onDetected handler in tests — no need to fake the native camera callback.
- lookupBarcodeAsync's real contract never rejects (internal .catch falls back) — the "not found" test resolves null, not a rejection, to match.

Not yet covered: row 6's label and photo scan paths (api.scan.label, api.scan.pipeline/pipelineMulti/confirm/feedback) — no render test exists yet; next natural task.

Unresolved housekeeping: row 8's notes cell is very long and still carries an older contradictory fragment ("savedMeals.log still uncovered" next to several later "render test added" lines) — flagged repeatedly across rounds, never cleaned up (out of scope each time). loop/DECISIONS_LOG.md and loop/NOTES_phase2.md remain untouched by any of this testing work.