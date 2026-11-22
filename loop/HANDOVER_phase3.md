HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
No row became BUILT this session. Row 15 (empty states and copy) is still PARTIAL, and nothing has been checked on a device. Last full gates: 186 suites, 1149 tests and 4 snapshots passing; tsc 0 errors. Later rounds ran single test files only.

BUILT THIS SESSION (Row 15)
- New shared helper src/lib/mealSlotName.ts exports mealSlotName(t, slot). It maps the four slots to their addMenu keys (Snacks uses "snack").
- These now use the helper, and their local slot maps are deleted:
  - src/app/(tabs)/food.tsx
  - src/app/dashboard/nutrition.tsx: row title and spoken label
  - src/app/food/quick-add.tsx
  - src/app/food/add.tsx: sheet title, checked against SLOTS from src/lib/data/mappers.ts
- New tests, all passing:
  - src/__tests__/mealSlotName.test.ts
  - src/__tests__/render/dashboardNutrition.locale.render.test.tsx (en, es, fr)
  - src/__tests__/render/foodAddTitle.render.test.tsx
- Row 15 notes record all of the above except the quick-add switch.

IN PROGRESS
Nothing half-done.

DECISIONS
- Render tests live in src/__tests__/render/ and end .render.test.tsx. Expo Router turns any file under src/app into a route, so tests never go there.
- An unknown slot passed to the helper returns the raw key addMenu.undefined, as the old maps did. Screens that take outside input guard first (add.tsx checks SLOTS).
- No empty-week guard in nutrition.tsx: useWeeklyMacros (src/lib/data/hooks.ts:386) always returns 7 days.
- Jest mock factories may only reference variables named mock*.
- To test with route params, override expo-router in the test, as exerciseProgress.render.test.tsx does.
- A broken existing test or snapshot is never edited. The change is backed out and reported.

BLOCKED (Isa)
- src/app/food/detail.tsx holds the last slot map (line 53). Its picker at line 677 falls back to foodLog.addMeal for an unknown slot, so it needs a decision before switching to the helper.
- addMenu.snack is still "Snacks" in es.json:114 and fr.json:112. Needs a wording review.
- Earlier blockers are still open: the useGoals loading and error states, Goals persistence, and the wording questions in Row 15.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first.
- No git, Prettier or Maestro. Read .git/HEAD for the branch.
- zsh rejects grep --include globs.
- Locales live in src/lib/i18n/locales. Use npx jest --ci.

UNFIXED
- Row 15 notes do not yet mention the quick-add switch to the helper.
- InsightCard.tsx:77 still uses the 120-character toggle rule.
- week.tsx draws flat bars when every day has 0 kcal.
- BrainProfileCard numbers are not formatted for the language and always use kcal.
- Profile screens hard-code English titles and eyebrows.
- goals.tsx hard-codes "g", "%" and the comma join.

NEXT
Get Isa's decision on the detail.tsx fallback, then switch it to mealSlotName.