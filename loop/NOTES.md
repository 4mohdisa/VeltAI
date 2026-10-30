# Lume Loop Notes

## Goal
Match design/Lume App.html across DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

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
- Plan file is src/app/dashboard/plan.tsx.
- Locale order en, es, fr, one file per round.
- Flagged reports are cleared by a verification round before a new build task.
- Prompts name loop/design-match, forbid git, name the design file (design/Lume App.html) and the gap row or 'none'. Rejected prompts are rewritten with every point fixed.
- fr plan values are manager-written, pending native review.
- lastLoggedLabel: en keys, then es, then fr, then component swap (one file per round).
- savedMeals is its own group after foodLog. plan group sits last in en.json and es.json.

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90); gym chooser; Goals restyle; CelebrationCard (row 17 steps 1-2); gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- en, es, fr: addMenu slots, foodLog, savedMeals (logged, logFailed); SavedMealsList toasts use them.
- en, es, fr: plan group (suggested, addTitle); plan.tsx lines 87 and 99 use them.
- en: savedMeals lastLoggedToday, lastLoggedYesterday, lastLoggedDaysAgo_one, lastLoggedDaysAgo_other, neverLogged. Not on screen yet.
- es: savedMeals last-logged keys and neverLogged added in R181 (native review pending). Not on screen yet.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Checkpoints green: R113 to R164, R166, R168, R169, R174, R180 (tsc 0, 65 suites, 824 tests, 4 snapshots; parse en, es, fr 0).
- Flags: R165 cleared by R166; R167 by R168; R170 by R171; R173 cleared by R174.
- R175 flagged, cleared by R176. R176 flagged, R177 added neverLogged. R177 flagged, cleared by R178.
- R178 flagged by automatic check. R179 verification round (no Jest) flagged again. R180 full checkpoint run cleared the flag.
- R181 flagged by automatic check (type check or tests not run). R182 is a checkpoint: full tsc and suite, no edits.
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts, plan group, plan.tsx lines 87 and 99, en and es savedMeals last-logged keys. No test reads locale files or covers SavedMealsList or plan.tsx.
- Locale top-level key mismatch: es missing gymLog; fr missing goals, gymLog, dashboard, nutrition. Known, not on screen.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- SavedMealsList.tsx lastLoggedLabel (lines 26 to 33) still hardcoded. Returns 'Never logged' at lines 27 and 29 with no key. Switch to t() keys is a later round.
- plan.addTitle: entry.title is English, so es and fr read partly English. It must stay English for the route param at plan.tsx:101. Needs a separate display label.
- plan.tsx screen title and 'No plan yet' empty state (lines 34 to 39) hardcoded.
- SavedMealsList.tsx lines 59 and 63 unchecked.
- fr.json lacks plan, goals, gymLog, dashboard, nutrition, settings.scanAccuracy. fr also lacks the five savedMeals last-logged keys and neverLogged.
- es.json lacks gymLog, settings.scanAccuracy, some goals keys. Has addMenu.voice and describeOutLoud. Last-logged keys and neverLogged added in R181.
- Add sheet icons are SF Symbols, not design SVGs.
- Quick add (row 87): no caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Long-press meal delete not discoverable.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver labels and hint, toasts, saved meal toasts, plan Suggested and Add label.
- Meal delete has no gap row: add one? Macro types for food detail (data model, parked).
- Native review fr: all new savedMeals and plan strings, 'Appuyez sur +', 'Pas encore de repas', vegane/vegetarienne agreement, spacing before : ? and in noMatches, 'Maintenez', 'a Petit-dejeuner'. Plain vs no-break spaces. 'Suggere :' and 'Ajouter a {{title}}' pending. 'Registrado' gender agreement with saved meal names.
- Native review es: new plan and savedMeals strings (including last-logged keys from R181), 'Puede que no coincida', addedToMeal word order, 'elemento'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin confirm on device.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); test log noise from hooks.ts:56 console.warn.
- Recipe fibre saved as 0. Food tab render test (needs new suite).

## Next
1. R182: checkpoint. Full tsc and app suite, parse en, es, fr, no edits. In progress.
2. fr.json: the five savedMeals last-logged keys and neverLogged (native review pending).
3. SavedMealsList.tsx lastLoggedLabel switched to t() keys, including neverLogged; then one checkpoint run of the full suite.
4. plan.tsx title and empty state to locale keys.
5. Locale gaps, one file per round: fr plan, goals, gymLog, dashboard, nutrition, settings.scanAccuracy; es gymLog, settings.scanAccuracy, goals.
6. Locale wording fixes, one file per round.
7. Add sheet icons to design SVGs.
8. Consolidate SLOT_KEYS.
9. If no non-gym work remains: stop with 'only owner decisions remain'.

## Loop notes
- Handover after R141, R156, R167, R172. Next handover due around R187. Name files fully in prompts.
- R175 prompt rejected for not naming the design/ file. Rewritten with design/Lume App.html and gap row 'none'.
- R172 chose es plan group over SavedMealsList and fr plan.
- R178 flagged by automatic check. R179 verification round, no edits.
- R179 flagged again (Jest not run). R180 full checkpoint run cleared the flag. Jev preferred es.json (88%); es.json taken in R181.
- R181 es.json five keys BUILT, tsc 0, parse 0. Flagged by automatic check. R182 checkpoint chosen over fr.json until the flag is cleared.

## Gotchas
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Quote paths with parentheses. i18n does not escape values.
- Edit tool may write a plain space for U+00A0. Check code points with node.
- SavedMealsList has no test file; only src/app/food/meals.tsx imports it.
- No test imports plan.tsx or reads locale files.
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- Keep all output inside the repo. No /tmp.