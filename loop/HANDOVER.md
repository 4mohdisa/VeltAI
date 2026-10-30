HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT SO FAR (all BUILT, not verified)
DESIGN_GAP_ANALYSIS.md rows at BUILT: 76 Gym log sheet, 86 Food detail, 90 Add sheet. The doc was not edited this session.
This session, locale files only, in src/lib/i18n/locales/:
- es.json: addMenu.addToSlot plus 8 missing keys.
- fr.json: new 16-key addMenu block.
- en.json: addMenu.breakfast, lunch, dinner, snack (value "Snacks"); addMenu now has 20 keys.
No code reads the four slot keys yet.

Last checks: tsc 0 errors, run after the en.json edit. Last full app suite (npm test -- --silent) predates that edit, which was tsc only: 65 suites, 824 tests, 4 snapshots.

IN PROGRESS: Add sheet slot title translation, nothing mid-edit.
1. Add the four keys to es.json.
2. Add them to fr.json (one file per round).
3. Change src/app/food/add.tsx:56 to use them.

DECISIONS
- Key name snack, value "Snacks": Isa's brief fixed the key; the value follows the design's MEALS list, the source of hMeal.
- Keys sit in addMenu, as the brief's first choice.
- French and Spanish are my translations; the design has no French. They use "vous" and "tú", matching each file.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- Earlier, still open: negative margin at add.tsx:68 chosen because SheetContent is shared.

GOTCHAS
- App slot value is 'Snacks' (src/lib/mock/data.ts:48) but the key is snack, so slot.toLowerCase() finds nothing for Snacks; add.tsx needs an explicit mapping.
- Design mealNow() returns singular 'Snack'; MEALS uses 'Snacks'.
- Locale path is src/lib/i18n/locales/, not src/locales/.
- No test reads locale files. sheetVariant and tabbar only mention the food/add route.
- Decoded design is in /tmp/lume-design and may vanish (71f71ac4 is food); raw HTML is compressed.
- Shell grep is ugrep; use LC_ALL=C /usr/bin/grep.

NOT FIXED
- src/app/(tabs)/food.tsx:543 and :965 pass raw slots; :717 and src/components/food/SavedMealsList.tsx:59, :63 are hardcoded English toasts.
- fr.json foodLog has 2 keys; other fr blocks not compared with en.json.
- Add sheet gap is 0pt on no-inset devices; doc omits this.
- French "Ajouter à petit-déjeuner" may need "au".
- Handover items not rechecked: unknown fibre shows "0g fibre"; detail.tsx num() rounds macros, saved-food calls drop fibre; no test for new-recipe.tsx.

WAITING ON ISA
- Native review of Spanish and French; confirm "Snacks".
- Device runs: Add sheet (34pt gap, grid at 320pt and 430pt, long label wrapping), recipe flow and fibre, Quick add, celebration card.
- Decisions: macro types, negative margin, Confirm label, Calories column, global + title, last-hour scan.