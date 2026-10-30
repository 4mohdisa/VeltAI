HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT SO FAR (all BUILT, not verified)
Rows at BUILT: 76 Gym log sheet, 86 Food detail, 90 Add sheet. Row 90 gained "Slot title uses addMenu slot keys." No row covers meal delete.
- src/lib/i18n/locales/: en, es and fr have addMenu breakfast, lunch, dinner, snack. en.json foodLog also has mealDeleted and deleteMealTitle, deleteMealMessage_one/_other, deleteMealConfirm.
- src/app/food/add.tsx: title uses SLOT_KEYS, lowercased to match the design; unknown slot gets the generic title.
- src/app/(tabs)/food.tsx: local SLOT_KEYS (line 83). Lines 539, 552, 770, 771, 774, 795, 975 use translated slot names. confirmDeleteMeal (line 713) takes t; its dialog and toast use locale keys.

Last checks: tsc 0 errors and 30 food-related suites, 510 tests, after the final edit. Last full run, one edit earlier: 65 suites, 824 tests, 4 snapshots.

IN PROGRESS: nothing mid-edit. Recommended next: use foodLog.addToMeal at food.tsx:539 and :795, as line 975 does.

DECISIONS
- Food log "Add to Lunch" keeps its capital, per Isa's brief; the design lowercases.
- No fallback in the delete toast: slot is typed MealSlot, and a fallback would read "Removed Add meal".
- SLOT_KEYS is duplicated in add.tsx and food.tsx, as instructed; share it if a third caller appears.
- Delete button key lives in foodLog because common has no delete key; Cancel reuses common.cancel.
- voice and describeOutLoud stay in es.json until Isa approves removal.

GOTCHAS
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- src/lib/i18n/index.ts fixes lng to 'en', so es and fr are not on screen.
- No test renders the Add sheet title, delete dialog, toast or MealSectionHeader. No test reads locale files.
- Shell grep is ugrep; use LC_ALL=C /usr/bin/grep. Exclude the .snap match when passing grep results to jest.
- Decoded design is in /tmp/lume-design and may vanish (71f71ac4 is food).

NOT FIXED
- food.tsx:771 hint and the "Add to" text at :539, :795 are hardcoded English; :390 toast lowercases the raw slot.
- es and fr lack foodLog.mealDeleted, addedToMeal and the deleteMeal keys.
- SavedMealsList.tsx:59, :63 and dashboard/plan.tsx:85, :97 are hardcoded English (not rechecked).
- Long-press meal delete is not discoverable.
- Add sheet gap is 0pt on no-inset devices. French "à petit-déjeuner" and Spanish "a Desayuno" need native review.

WAITING ON ISA
- Device runs: Add sheet, delete dialog plurals, header and VoiceOver.
- Decisions: "Add to Lunch" capitals, "Delete" versus "Removed", negative margin at add.tsx.
- Native review of Spanish and French; confirm "Snacks".