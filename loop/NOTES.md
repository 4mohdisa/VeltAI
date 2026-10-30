# Lume Loop Notes

## Goal
Match design/Lume App.html across the DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Add sheet row 90 BUILT. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'.
- 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- SLOT_KEYS duplicated in add.tsx and food.tsx; share if a third caller appears.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement.
- No new test suites. No food tab render test.
- Plan file is src/app/dashboard/plan.tsx (only plan.tsx under src; (tabs) path does not exist).
- Locale order: en, es, fr, one file per round.
- Flagged reports are cleared by a verification round before a new build task.
- Prompts: one task, one file, name design file and gap row or 'none'.

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90); gym chooser; Goals restyle; CelebrationCard (row 17 steps 1-2); gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- en, es, fr: addMenu slots; foodLog (23 keys each); savedMeals logged and logFailed. SavedMealsList toasts use them.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Checkpoints green: R113 to R164 (tsc 0, 65 suites, 824 tests, 4 snapshots).
- Flags R144 to R163 cleared or partly cleared. R165 flagged (not run, wrong path); cleared by R166 checkpoint.
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- plan.tsx :85 'Suggested:' and :97 'Add ${title}' hardcoded.
- SavedMealsList.tsx lastLoggedLabel lines 26-33 hardcoded; 'N days ago' needs plurals. Lines :59 and :63 unchecked.
- es.json lacks gymLog, settings.scanAccuracy, some goals keys. Has addMenu.voice and describeOutLoud.
- fr.json lacks goals, gymLog, dashboard, nutrition, settings.scanAccuracy.
- Add sheet icons are SF Symbols, not design SVGs.
- Quick add (row 87): no caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver labels and hint, toasts, saved meal toasts.
- Meal delete has no gap row: add one? Macro types for food detail (data model, parked).
- Native review fr: 'Appuyez sur +', 'Pas encore de repas', vegane/vegetarienne agreement, spacing before : and ? and in noMatches, 'Maintenez' without 'appuye', 'a Petit-dejeuner'.
- Native review es: 'Puede que no coincida', addedToMeal word order, 'elemento', savedMeals 'Registrado:' and 'No se pudo registrar'.
- French non-breaking spaces for older strings? Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin confirm on device.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0. Food tab render test (needs new suite). Long-press meal delete not discoverable.

## Next
1. R166: verification checkpoint, tsc and full suite, no edits.
2. plan.tsx :85 and :97 en keys; then plan.tsx uses them; then es; then fr.
3. SavedMealsList.tsx lastLoggedLabel to locale keys with plurals (en, es, fr).
4. es and fr locale gaps, one file per round.
5. fr and es wording fixes, one file per round.
6. Add sheet icons to design SVGs.
7. Consolidate SLOT_KEYS.
8. Full checkpoint after plan and saved meal work.
9. If no non-gym work remains: stop with 'only owner decisions remain'.

## Loop notes
- Handover after R141 and R156. Name files fully in prompts.
- Jev run signals favoured running at R159 to R164; both agreed when run.

## Gotchas
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Quote paths with parentheses. i18n does not escape values.
- SavedMealsList has no test file; only src/app/food/meals.tsx imports it.
- Decoded design in /tmp/lume-design may vanish.
