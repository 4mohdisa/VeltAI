HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. The Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified)
No DESIGN_GAP_ANALYSIS.md row changed or was edited. None covers this work, and R141, named in an earlier brief, does not exist.
- src/app/(tabs)/food.tsx: VoiceOver labels at lines 539 and 795 use foodLog.addToMeal. Toast at line 390 uses the translated slot. Hint at line 771 uses foodLog.deleteMealHint.
- src/lib/i18n/locales/en.json: added foodLog.deleteMealHint.
- es.json and fr.json: foodLog now has the same 23 keys as en.json, counting nested ones, in the same order.

Last checks: tsc 0 errors; full app suite 65 suites, 824 tests, 4 snapshots, all passing.

IN PROGRESS: nothing mid-edit. Recommended next: a render test for the food tab covering the addToMeal labels, deleteMealHint and the addedToMeal toast. That task must allow a new test file.

DECISIONS
- Toast keeps .toLowerCase() because the brief said keep the casing; add.tsx:67 uses the same pattern.
- es addedToMeal is "Añadido a {{slot}}: {{energy}}" and mealDeleted is "Se ha eliminado {{slot}}", to avoid gender agreement problems.
- The French values for addedToMeal, mealDeleted, the deleteMeal keys and deleteMealHint were supplied in the brief and used exactly.
- Food log "Add to Lunch" keeps its capital, per Isa's earlier brief; the design lowercases.

GOTCHAS
- src/lib/i18n/index.ts fixes lng to 'en', so es and fr are not on screen.
- No food-named test imports or renders add.tsx, (tabs)/food.tsx or src/lib/i18n directly. foodDates and foodDetail only read food.tsx as text. Indirect i18n loading through detail.tsx's components was not traced. Earlier rounds found no test reading locale files.
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- Shell is zsh: unquoted $VAR does not word-split, so use xargs or --runTestsByPath. Shell grep is ugrep; use LC_ALL=C /usr/bin/grep.
- A complex one-liner using array expansion hit a permission check; plain commands pass.
- Grepping test contents for 'add' is loose (42 files). File-name matching gave 4.
- Decoded design is in /tmp/lume-design and may vanish. Only "Search foods" was found there; "Meal history", "No meals yet", "Add custom food" and "May not match" were not.
- The R152 and R153 flag wording was never seen.

NOT FIXED
- SavedMealsList.tsx:59, :63 and dashboard/plan.tsx:85, :97 reported as hardcoded English, not rechecked.
- Long-press meal delete is not discoverable; the hint only reaches VoiceOver users.
- SLOT_KEYS is duplicated in add.tsx and food.tsx.

WAITING ON ISA
- Device runs: Add sheet, delete dialog plurals, header, VoiceOver labels and hint, toast.
- Decisions: "Add to Lunch" capitals, "Delete" versus "Removed", negative margin at add.tsx, "Snacks".
- Native review, French: "Maintenez" without "appuyé", plain spaces before ":", "?" and inside « », "à Petit-déjeuner".
- Native review, Spanish: "Añadir a Desayuno", "elemento", "Puede que no coincida".