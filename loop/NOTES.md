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
- No new test suites. No food tab render test (handover suggestion rejected, R167, R168 and R169 checkpoint).
- Plan file is src/app/dashboard/plan.tsx (only plan.tsx under src; (tabs) path does not exist).
- Locale order: en, es, fr, one file per round.
- Flagged reports are cleared by a verification round before a new build task.
- Prompts: one task, one file, name design file and gap row or 'none'. Prompts must name loop/design-match and forbid git commands.

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90); gym chooser; Goals restyle; CelebrationCard (row 17 steps 1-2); gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- en, es, fr: addMenu slots; foodLog (23 keys each); savedMeals logged and logFailed. SavedMealsList toasts use them.
- en.json: plan group with suggested and addTitle (R167). Not yet used by plan.tsx.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Checkpoints green: R113 to R164, R166 and R168 (tsc 0, 65 suites, 824 tests, 4 snapshots; en, es and fr JSON parse).
- Flags R144 to R163 cleared or partly cleared. R165 flagged (wrong path); cleared by R166 checkpoint.
- R167 flag cleared by R168 verification round (latest report: tsc 0, full suite and three locale parses pass).
- R169: checkpoint round requested by loop note (tsc and full app suite, no edits). Result pending.
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts, plan group. No test reads locale files. plan keys are not used by any code yet.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- plan.tsx :85 'Suggested:' and :97 'Add ${title}' hardcoded. en.json keys plan.suggested and plan.addTitle exist. Next: plan.tsx uses them (keep literal space after the label on :85), then es, then fr. entry.title is an English slot name, so addTitle still reads partly English in es and fr; translate the slot name too.
- SavedMealsList.tsx lastLoggedLabel lines 26-33 hardcoded; 'N days ago' needs plurals. Lines :59 and :63 unchecked.
- es.json lacks plan, gymLog, settings.scanAccuracy, some goals keys. Has addMenu.voice and describeOutLoud.
- fr.json lacks plan, goals, gymLog, dashboard, nutrition, settings.scanAccuracy.
- Add sheet icons are SF Symbols, not design SVGs.
- Quick add (row 87): no caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
- SLOT_KEYS duplicated in add.tsx and food.tsx (not yet consolidated).
- Long-press meal delete not discoverable; hint reaches VoiceOver only.

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
1. R169: checkpoint (tsc, full app suite, no edits). Result pending.
2. Then plan.tsx uses plan.suggested (line 85, keep space) and plan.addTitle (line 97).
3. plan group to es, then fr (one file per round).
4. SavedMealsList.tsx lastLoggedLabel to locale keys with plurals (en, es, fr).
5. es and fr locale gaps, one file per round.
6. fr and es wording fixes, one file per round.
7. Add sheet icons to design SVGs.
8. Consolidate SLOT_KEYS.
9. Full checkpoint after plan and saved meal work.
10. If no non-gym work remains: stop with 'only owner decisions remain'.

## Loop notes
- Handover after R141, R156 and R167 session. Name files fully in prompts.
- R168 verification passed; R167 flag cleared.
- R169 is a checkpoint round per loop note. Make the task one thing: tsc and full app suite, no file changes.
- Jev run signals favoured running at R159 to R168; agreed each time. R169: Jev run 99%, agreed.

## Gotchas
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Quote paths with parentheses. i18n does not escape values.
- SavedMealsList has no test file; only src/app/food/meals.tsx imports it.
- No food-named test imports or renders add.tsx, (tabs)/food.tsx or src/lib/i18n directly.
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- Decoded design in /tmp/lume-design may vanish. Only 'Search foods' was found there.
- Claude Code may have tried writing to /tmp (R166). Keep all output inside the repo.