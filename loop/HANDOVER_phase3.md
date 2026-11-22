HANDOVER: Lume Phase 3, branch loop/phase3

ROWS (PHASE3_ROWS.md)
No new rows were built this session. Rows 1 to 4 are built. Row 5 is partial and needs Isa for its Maestro part. Row 12 is done and waits for Isa to approve "built". Row 13 (Food log) stays PARTIAL; its notes cell has one line per round, up to round 69.

ROW 13 DONE SO FAR
- Food tab past-day copy, tested.
- SavedMealsList, RecipesList and the Saved screen show ErrorState with Retry on a failed load with no data.
- Translated in en, es, fr: RecipesList (recipesList block), meals.tsx (meals block), new-recipe.tsx (newRecipe block), history.tsx (history block).
- history.tsx dates follow i18n.language.
Last checkpoint (round 58): tsc 0 errors, 150 suites, 1038 tests passing.

IN PROGRESS
Nothing is half-done.

KEY FILES
- src/app/food/history.tsx, new-recipe.tsx, meals.tsx, saved.tsx
- src/components/food/RecipesList.tsx, SavedMealsList.tsx
- src/lib/i18n/locales/en.json, es.json, fr.json
- Tests in src/__tests__/render: history.strings, newRecipe.strings, mealsScreen.strings, recipesList, savedMealsList, savedScreen, foodTab.emptyStates

DECISIONS
- Error states use ErrorState's default copy (errorState.*), so no new keys are needed. A failed refresh keeps rows already loaded on screen.
- saved.tsx keeps a literal "loadError ?" and LoadFailedNotice, because hydrationErrorScreens.test.ts pins both.
- Locale blocks are inserted as text, because a JSON rewrite reformats en.json and fr.json. French uses a no-break space before ":" and "?".
- Existing keys with the same text are reused (food.title, foodLog.today, savedMeals.logFailed and others).
- String tests read the expected text from en.json and switch to Spanish with i18n.changeLanguage, then reset to English.

BLOCKED (needs Isa)
- useLoggedDays (src/lib/data/foodDays.ts) returns no error, so the calendar and WeekStrip can't show a failed read. Changing this shared hook needs approval. The suggested fix is LoadFailedNotice above the grid.
- Review of the es and fr wording of all new blocks.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, no Prettier.
- In zsh, pass multi-file jest lists through xargs, because $(...) does not split.
- Render tests need:
  - their own expo-router mock with useFocusEffect;
  - LoadingSkeleton stubbed;
  - SafeAreaProvider when a BottomSheet or Screen mounts.
- jest.requireActual('@/lib/api').api is undefined inside the mock factory, so don't read nested fields from it.
- Toast text lives in useToastStore, not the screen tree.
- Text split into several children renders as an array; match with includes.

UNFIXED / NEXT
- Next row task: translate calendar.tsx (strings only).
- formatWeekdayDate and formatMonthYear use the device locale; formatRelativeDate returns hardcoded English.
- No test covers app-language dates or en, es and fr key parity.
- Stale header comments: saved.tsx "(mock)" and meals.tsx "(Task 4)".
- "New Recipe" (recipesList.newRecipe) and "New recipe" (meals.newRecipeLabel) differ only in capitalization.
- Older items: no Retry on useInsights errors, allText crash, analytics defaults to on, seed script has no host guard.