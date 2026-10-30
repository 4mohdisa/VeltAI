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
- Prompts name loop/design-match, forbid git, and name the design file and gap row or 'none'.
- fr plan values are manager-written, pending native review.

## Built (not verified)
- NumberEntryBar shared: quick add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90); gym chooser; Goals restyle; CelebrationCard (row 17 steps 1-2); gym duration.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; recipe fibre sum.
- food.tsx: slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- en, es, fr: addMenu slots, foodLog, savedMeals (logged, logFailed); SavedMealsList toasts use them.
- en, es, fr: plan group (suggested, addTitle); plan.tsx lines 87 and 99 use them.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Checkpoints green: R113 to R164, R166, R168, R169.
- Flags: R165 cleared by R166; R167 by R168; R170 by R171; R173 flagged (tests not run), R174 to clear.
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts, plan group, plan.tsx lines 87 and 99. No test reads locale files or covers SavedMealsList or plan.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- plan.addTitle: entry.title is English, so es and fr read partly English. It must stay English for the route param at plan.tsx:101. Needs a separate display label.
- plan.tsx screen title and 'No plan yet' empty state (lines 34 to 39) hardcoded.
- SavedMealsList.tsx lastLoggedLabel (lines 26 to 33) hardcoded; 'N days ago' needs plurals. Lines 59 and 63 unchecked.
- fr.json lacks goals, gymLog, dashboard, nutrition, settings.scanAccuracy.
- es.json lacks gymLog, settings.scanAccuracy, some goals keys. Has addMenu.voice and describeOutLoud.
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
- Native review fr: all new savedMeals and plan strings, 'Appuyez sur +', 'Pas encore de repas', vegane/vegetarienne agreement, spacing before : ? and in noMatches, 'Maintenez', 'a Petit-dejeuner'. Plain vs no-break spaces.
- Native review es: new plan and savedMeals strings, 'Puede que no coincida', addedToMeal word order, 'elemento'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin confirm on device.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0. Food tab render test (needs new suite).

## Next
1. R174: verification round (current). Read-only: tsc, full suite checkpoint, locale parse. Clears R173 flag.
2. SavedMealsList.tsx lastLoggedLabel to locale keys with plurals (en, es, fr), one file per round.
3. plan.tsx title and empty state to locale keys.
4. Locale gaps, one file per round: fr goals, gymLog, dashboard, nutrition, settings.scanAccuracy; es gymLog, settings.scanAccuracy, goals.
5. Locale wording fixes, one file per round.
6. Add sheet icons to design SVGs.
7. Consolidate SLOT_KEYS.
8. If no non-gym work remains: stop with 'only owner decisions remain'.

## Loop notes
- Handover after R141, R156, R167, R172. Name files fully in prompts.
- R174 prompt rejected: did not name design/Lume App.html. Rewritten with design file and gap row none. Notes cut to under 600 words.
- R172 chose es plan group over SavedMealsList and fr plan.

## Gotchas
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Quote paths with parentheses. i18n does not escape values.
- Edit tool may write a plain space for U+00A0. Check code points with node.
- SavedMealsList has no test file; only src/app/food/meals.tsx imports it.
- No test imports plan.tsx or reads locale files.
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- Keep all output inside the repo. No /tmp.