HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified. Expo docs requirement is in AGENTS.md.

BUILT THIS SESSION (all BUILT, not verified)
- src/lib/data/hooks.ts: useFoodSearch recents carry fibre per 100 g; unknown stays undefined.
- src/app/food/new-recipe.tsx: totals sum fibre; Total line ends "· Xg fibre"; fibre added to the all-zero check.
- src/app/food/add.tsx: marginBottom -space.xl on the tile grid cancels SheetContent's 20pt, leaving the 34pt inset (design: 34px).
- DESIGN_GAP_ANALYSIS.md: Food Search line 1046 updated (status stays DIFFERENT). Add sheet row 90, section and correction row 1445 updated; add.tsx:56 reference fixed. Count line unchanged: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (not verified), 0 EXACT. BUILT rows: 76 Gym log sheet, 86 Food detail, 90 Add sheet.

Last checks: tsc 0 errors at the add.tsx edit; sheetVariant and tabbar 22 of 22. Last full app suite, 65 suites, 824 tests, predates the recipe totals and add.tsx edits.

IN PROGRESS: nothing mid-edit.

DECISIONS
- Food detail "missing macros stay undefined": no edit made. Protein, carbs and fat are required numbers on FoodItem, NewFoodItem, DetailItem and logInputFromItem; a cast gives NaN totals; display-only would show a dash but log 0. Recommended: widen types across files, count missing as 0 in sums. FoodLog response requires them; backend storage unchecked.
- Negative margin chosen because only add.tsx was in scope and SheetContent is shared.
- Recipe missing fibre saves 0 (RecipeIngredient.fibre required). Macros unrounded; calories rounded.
- Recipe builder has no design counterpart.

WAITING ON ISA
- Macro types decision; accept or replace the negative margin.
- Device runs: Add sheet (34pt on 34pt-inset iPhone; grid at 320pt and 430pt); recipe flow and fibre; Quick add; celebration card.
- Confirm label; Calories column; global + title; whether the last-hour scan stays.

NOT FIXED
- Unknown fibre shows "0g fibre" in recipe Total.
- Add sheet gap is 0pt on no-inset devices; doc doesn't say so.
- Cell 1445 "This pass" now holds a build status, unlike other rows.
- detail.tsx: num() rounds macros on save; saved-food calls drop fibre.
- Add sheet: Search foods destination, SF Symbols vs SVGs, scan routes.
- No test for new-recipe.tsx or SegmentedField. Calories drift in editRow and recents. Row 87 open items. Meal chip token unconfirmed.
- es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot.
- loop/NOTES.md lines 39, 42, 54 need re-reading.

GOTCHAS
- --findRelatedTests hooks.ts gives 5 suites, 33 tests; the "9 suites, 116" figure means nine named suites (R94 list). Source-reading tests are invisible to it, including foodDetail, fibrePipeline, sheetVariant and foodMealMove for detail.tsx.
- Decoded design is in /tmp/lume-design (71f71ac4 is food) and may vanish; the raw HTML is compressed.
- Shell grep is ugrep; long context patterns can error. Use /usr/bin/grep with LC_ALL=C.