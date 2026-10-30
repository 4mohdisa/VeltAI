# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding. Macros stored unrounded, display rounds. Grid 1fr 1fr, 12pt gap. Gym duration logged when above 0.
- Add sheet row 90 BUILT at Isa's instruction. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Add sheet title lowercases translated slot; unknown slot falls back to 'Add meal'.
- Food log 'Add to Lunch' keeps capital per Isa. Toast keeps toLowerCase().
- No fallback in delete toast (slot typed MealSlot). Meal delete toast and dialog use design defaults until Isa overrides.
- SLOT_KEYS duplicated in add.tsx and food.tsx; share if a third caller appears.
- Delete key lives in foodLog; Cancel reuses common.cancel.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- fr and es slot translations are agent translations. es addedToMeal and mealDeleted avoid gender agreement.
- Food tab render test declined: brief forbids new test suites.
- New savedMeals group sits after foodLog, not inside it (en, es, fr).
- Prompts: one task, one editable file, name design/Lume App.html and gap row (or 'none'). No git. Branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes.
- Locale keys: en first, then es, then fr, one file per round.
- Flagged reports must be cleared by a verification round before a new build task.
- R159 toast: no test can render SavedMealsList. Closed in part at R160; device run stays under Blocked on Isa. Toasts stay BUILT, not verified.

## Built (not verified)
- NumberEntryBar shared: quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90), gym 'How did it go?' chooser, Goals restyle, CelebrationCard (row 17 steps 1-2), gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; new-recipe.tsx sums fibre.
- food.tsx: slot heading, VoiceOver and 'Add to' labels via foodLog.addToMeal, toast with translated slot, hint via foodLog.deleteMealHint, meal delete dialog and toast use translated keys.
- en, es, fr: addMenu slots; foodLog keys (23 each, same order).
- en.json and es.json: savedMeals.logged and savedMeals.logFailed. SavedMealsList.tsx toasts use them (not run on device).
- fr.json: savedMeals group after foodLog with logged and logFailed (R162). Values as supplied; logged uses U+00A0 before the colon, logFailed uses U+2019. tsc 0 at R162. Verification round R163 requested.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132, R140, R145, R151, R156, R158, R160 (tsc 0, 65 suites, 824 tests, 4 snapshots, --ci).
- Targeted: R146, R147, R154.
- Flags R157 and R159 partly cleared (R158, R160).
- R162 flagged (tests not run, by design; tsc 0). Verification round R163 in progress.
- Unverified: no test renders the add title, slot heading, delete dialog, toast, 'Add to' labels or saved meal toasts. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- es.json missing gymLog, settings.scanAccuracy, some goals keys; has addMenu.voice and describeOutLoud.
- fr.json missing goals, gymLog, dashboard, nutrition groups and settings.scanAccuracy (falls back to English; lng is fixed to en anyway).
- SavedMealsList.tsx lastLoggedLabel (lines 26-33) hardcoded English; 'N days ago' needs plurals. Lines :59 and :63 reported hardcoded, not rechecked.
- plan.tsx :85 'Suggested:' and :97 'Add ${entry.title}' hardcoded. Needs en keys first.
- Add sheet icons are SF Symbols, not design SVGs.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Long-press meal delete not discoverable; hint reaches VoiceOver only.
- Locale wording: fr 'a petit-dejeuner' should be 'au'; es 'Anadir a Desayuno' should be 'Anadir al desayuno'.
- fr review: 'Appuyez sur +', 'Pas encore de repas', 'preference vegane/vegetarienne' agreement, plain spaces in noMatches and before : and ? (older strings; savedMeals.logged now uses U+00A0), 'Maintenez' without 'appuye' in deleteMealHint, 'a Petit-dejeuner'.
- es review: 'Puede que no coincida' agreement; addedToMeal word order; 'elemento'; savedMeals 'Registrado:' and 'No se pudo registrar' need native review.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation.
- Row 17 Calories: formula or accepted deviation (dash now).
- Search foods tile routing; global + title default.
- Quick add 17/22 vs 17/24.
- Add sheet 0pt gap on no-inset devices.
- 'Snacks' English label; 'added to snacks' wording.
- Device runs: Add sheet; recipe and fibre; quick add; celebration card; meal delete dialog and header; VoiceOver labels and hint; toast; saved meal toasts.
- Meal delete has no gap row: add one?
- Macro types for food detail (data model, parked).
- Native review of fr and es strings above.
- French spacing: move older fr strings to non-breaking spaces to match savedMeals.logged?
- Remove es voice and describeOutLoud.
- 'Add to Lunch' capitals; 'Delete' versus 'Removed' (design defaults apply).
- Negative margin at add.tsx:68 (accepted; confirm on device).

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0.
- Food tab render test for add labels, hint and toast (needs a new test suite; not allowed).

## Next
1. R163: verification of R162 (fr.json savedMeals). tsc and key parity only, no edits.
2. plan.tsx :85, :97 to locale keys: en keys first, then es, then fr, one file per round.
3. SavedMealsList.tsx lastLoggedLabel to locale keys with plurals (en first).
4. es and fr locale gaps, one file per round.
5. fr and es wording fixes, one file per round.
6. Add sheet icons to design SVGs, one per round.
7. Consolidate SLOT_KEYS, one file per round.
8. Full checkpoint after saved meal and plan work.
9. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Handover after R141, R156. Name files fully in prompts.
- Flags: R144, R146, R148, R149, R150, R152, R153, R155, R157, R159, R162. Cleared: R153, R155, R157. R159 partly cleared by R160.
- Jev ask overridden at R120, R124, R126, R131, R134.
- Jev run 100% at R159 and 97% at R161; both agreed. Jev run 98% at R162 (advisory).

## Gotchas
- Design is in the bundler payload; decoded copy /tmp/lume-design may vanish.
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- 'Snacks' is in src/lib/mock/data.ts:48, key snack. Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- Shared Button in src/components/forms affects all callers; override locally first.
- Quote paths containing parentheses, such as src/app/(tabs)/food.tsx.
- Shell is zsh: unquoted $VAR does not word-split; use xargs or --runTestsByPath. Shell grep is ugrep; use LC_ALL=C /usr/bin/grep. Use npm test -- --ci.
- i18n does not escape values, so apostrophes in meal names show as typed.
- SavedMealsList has no test file; only src/app/food/meals.tsx imports it.
- No food-named test imports or renders add.tsx, (tabs)/food.tsx or src/lib/i18n directly.
- Decoded design: only 'Search foods' found in /tmp/lume-design; 'Meal history', 'No meals yet', 'Add custom food' and 'May not match' not found there.