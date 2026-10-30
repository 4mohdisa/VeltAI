# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

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
- voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement.
- Plan file is src/app/dashboard/plan.tsx.
- fr plan values are manager-written, pending native review.
- Locale order en, es, fr, one file per round.
- Flagged reports are cleared by a verification round before a new build task.
- savedMeals is its own group after foodLog. plan group sits last in en.json and es.json.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and the gap row or 'none'.

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90). Gym chooser. Goals restyle. CelebrationCard (row 17 steps 1-2). Gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre. Recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- en, es, fr: addMenu slots, foodLog, savedMeals (logged, logFailed). SavedMealsList toasts use logged and logFailed.
- en, es, fr: plan group (suggested, addTitle). plan.tsx lines 87 and 99 use them. fr plan group confirmed present (R184).
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last green checkpoint: R184 (tsc 0, 65 suites, 824 tests, 4 snapshots; parse en, es, fr 0; fr.json plan group present).
- R183 flagged, cleared by R184.
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts, plan group, plan.tsx 87 and 99. No test reads locale files or covers SavedMealsList or plan.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R185: SavedMealsList.tsx lastLoggedLabel (lines 26 to 33) to savedMeals t() keys, with neverLogged and counted plurals. Add any missing keys to en, es, fr in that order. tsc only.
2. plan.tsx screen title and 'No plan yet' (lines 34 to 39) to locale keys.
3. Checkpoint full suite after items 1 and 2.
4. Locale gaps, one file per round: fr goals, gymLog, dashboard, nutrition, settings.scanAccuracy; es gymLog, settings.scanAccuracy, goals.
5. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
6. plan.addTitle display label. entry.title stays English for the route param at plan.tsx:101.
7. Add sheet icons to design SVGs.
8. Consolidate SLOT_KEYS (add.tsx, food.tsx).
9. Remaining gap rows, most rows cleared per task first.
10. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56 in test logs.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test (needs new suite).
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver, toasts, saved meal toasts, plan Suggested and Add label.
- Meal delete has no gap row. Macro types for food detail (data model, parked).
- Native review fr: all new savedMeals and plan strings, plain vs no-break spaces, gender agreement, last-logged wording, 'ajout' vs 'Enregistre'.
- Native review es: new plan and savedMeals strings, 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.

## Gotchas
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Check code points with node.
- Keep all output inside the repo. No /tmp.
- SavedMealsList has no test file. Slot 'Snacks' maps to key snack.
- Handover summary and notes disagree on which savedMeals last-logged keys exist. Check the locale files before editing.

## Loop notes
- Handover after R141, R156, R167, R172. Next due around R187.
- R183 flagged, cleared by R184 (green).
- R185 chosen: SavedMealsList lastLoggedLabel. Jev agrees on run.
- Jev preferred fr.json over checkpoint; taken once the flag was cleared.