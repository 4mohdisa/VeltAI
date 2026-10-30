HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified.

BUILT THIS SESSION
- src/app/food/new-recipe.tsx: ingredientFrom scales protein, carbs, fat and fibre by grams; editRow carries them back to per-100 g. Literal \n in comment removed.
- src/app/food/add.tsx: tile grid uses flexGrow 1, flexBasis TILE_BASIS (40%), gap space.md. Title "Add to {meal}" already existed at about line 56 (no code change this session).
- DESIGN_GAP_ANALYSIS.md: count line now 23 DIFFERENT, 15 PARTIAL, 3 BUILT (not verified), 0 EXACT. Add sheet row is BUILT (not verified). Row 87 Quick add is DIFFERENT, single label, with BUILT and still-open lists. FoodNumberEntryBar renamed NumberEntryBar. Food Search has recipe macro status and recents lines. Add sheet correction row updated.

Last checks: full app suite 65 of 65 suites, 824 of 824 tests, before the fibre edit. After it: tsc 0 errors, eslint clean, nine hooks suites 116 of 116. No test covers new-recipe.tsx.

IN PROGRESS: nothing mid-edit.

DECISIONS
- Macros are unrounded: backend stores floats, display rounds. Calories keep Math.round.
- Missing or null macros count as 0, because RecipeIngredient.fibre is a required number.
- Row 87 stays DIFFERENT while open items remain.
- Add sheet summary row is BUILT at Isa's instruction, though its section verdict stays PARTIAL MATCH.
- Recipe builder has no design counterpart, so no gap row applies.

WAITING ON ISA
- Confirm label: Button prop, change bodyBold for all callers, or accept 17/24.
- Device run: recipe flow; Quick add (fit, no collapse, NumberEntryBar, pill, compact chips); Add sheet grid at 320pt and 430pt; celebration card flow.
- Earlier open: Calories column on the card; global + title "Add meal" vs design's default meal.
- Whether the last-hour modified-files check stays: it failed last round (20 files, from earlier rounds and loop writes); a scan limited to the round was empty.

RECOMMENDED NEXT
Add fibre to useFoodSearch recents in src/lib/data/hooks.ts, scaled per 100 g. Keep a missing value missing. Until then recent foods save fibre 0.

NOT FIXED
- totals in new-recipe.tsx omits fibre.
- Add sheet: Search foods destination, SF Symbols vs SVGs, separate scan routes, bottom padding.
- Correction row shows ❌ beside BUILT text.
- Quick add open items are listed in row 87. Meal chip label token vs 600 13/17 unconfirmed.
- es.json lacks addMenu.addToSlot; fr.json lacks addMenu.title and addToSlot.
- Rounded calories can drift in editRow and recents.
- No test names SegmentedField.
- loop/NOTES.md changed 23:18; re-read lines 39, 42, 54.

GOTCHAS
- Decoded design copies are in /tmp/lume-design (entry 71f71ac4 is food) and may vanish.
- Source-reading tests are invisible to --findRelatedTests; grep src/__tests__.
- Grepping "hooks" is loose. Expo docs requirement is in AGENTS.md.
- zsh does not word-split unquoted variables.