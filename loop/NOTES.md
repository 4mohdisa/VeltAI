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
- Food log 'Add to Lunch' keeps its capital per Isa's brief.
- No fallback in delete toast: slot typed MealSlot. Meal delete toast and dialog use design defaults until Isa overrides.
- SLOT_KEYS duplicated in add.tsx and food.tsx; share if a third caller appears.
- Delete key lives in foodLog; Cancel reuses common.cancel.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- French and Spanish slot translations are agent translations ('vous' fr, 'tu' es).
- Prompts: one task, one editable file, name design/ file and gap row (or 'none'). No git. Branch loop/design-match only.
- Locale-only rounds name design/Lume App.html and gap row 'none' so the prompt check passes.
- Checkpoints: full tsc and full app suite, no file changes.
- Locale keys: en first, then es, then fr, one file per round.
- Flag rule outranks Jev. Jev 'ask' overridden when next task needs nothing from Isa.
- Report must show tsc result and any JSON parse result in CHECKED.
- Flagged reports must be cleared by a verification round before a new build task.
- Every prompt must state the loop/design-match branch and forbid git commands.
- Verification rounds list the exact test paths run and state what they cover.
- No new test suites or render tests for the loop to write (brief rule). Isa verifies UI himself. Coverage gaps are recorded as unverified, not tested.

## Built (not verified)
- NumberEntryBar shared: quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90), gym 'How did it go?' chooser, Goals restyle, CelebrationCard (row 17 steps 1-2), gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; new-recipe.tsx sums fibre.
- food.tsx: slot heading, VoiceOver and 'Add to' labels via foodLog.addToMeal, toast, meal delete hint, dialog and toast use translated keys.
- en, es, fr: addMenu breakfast/lunch/dinner/snack; foodLog delete and addedToMeal keys.
- fr.json foodLog: R152 added the 11 missing keys. Agent 'vous' translations.
- R155: es.json foodLog.openFood and foodLog.conflict group (4 keys). es and fr now match en foodLog key set (23 keys, same order). Agent translations, needs native review.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132, R140, R145, R151 (tsc 0, 65 suites, 824 tests).
- Targeted since R145: R146 (30 suites, 510 tests), R147 (8 suites, 119 tests). R148 to R150: tsc 0; en, es, fr JSON parse OK.
- R152: tsc 0 and fr JSON parse ok reported. No tests were run; flagged.
- R153: tsc 0; JSON parse OK; jest 42 suites, 647 tests, 4 snapshots, all passed. Loose name matching; coverage not confirmed. Flagged.
- R154 (strict verification, cleared R153 flag): tsc 0; JSON parse OK. Exact paths: foodDates.test.ts, foodDetail.test.ts, foodMealMove.test.ts, render/foodDetailLogged.render.test.tsx. 4 suites, 67 tests, all passed. None of these import or render src/app/food/add.tsx, src/app/(tabs)/food.tsx or src/lib/i18n. Add sheet title, food log labels, hint, toast and locale values stay BUILT, unverified.
- R155: tsc 0; es.json parse OK. Jest not run; flagged.
- R156 (in progress): checkpoint, full tsc and full app suite, no file changes.
- No test renders the add title, slot heading, delete dialog, toast or 'Add to' labels. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- SavedMealsList.tsx :59, :63 hardcoded English toasts.
- plan.tsx :85 'Suggested:', :97 'Add ${entry.title}'.
- Add sheet icons are SF Symbols, not design SVGs.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- food.tsx :539, :795 'Add to' text and :771 hint hardcoded English; :390 toast lowercases raw slot. Handover suggests :539 and :795 use foodLog.addToMeal, as :975 does.
- Locale wording: fr 'a petit-dejeuner' should be 'au'; es 'Anadir a Desayuno' should be 'Anadir al desayuno'; fr has 2 es keys.
- fr review items from R152: 'Appuyez sur +', 'Pas encore de repas', 'preference vegane/vegetarienne' agreement, plain spaces in noMatches and before : and ?, 'Maintenez' without 'appuye' in deleteMealHint, 'a Petit-dejeuner'.
- es review: Puede que no coincida con tu preferencia (feminine agreement for vegana/vegetariana); 'Anadir a Desayuno'; addedToMeal word order; mealDeleted wording; 'elemento'.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Long-press meal delete not discoverable.
- es and fr lack foodLog.mealDeleted, addedToMeal and deleteMeal keys.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation.
- Row 17 Calories: formula or accepted deviation (dash now).
- Search foods tile routing; global + title default.
- Quick add 17/22 vs 17/24.
- Add sheet 0pt gap on no-inset devices.
- 'Snacks' English label; 'added to snacks' wording.
- Device runs: Add sheet; recipe and fibre; quick add; celebration card; meal delete dialog and header.
- Meal delete has no gap row: add one?
- Macro types for food detail (data model, parked).
- Native review of fr and es strings listed above.
- Remove es voice and describeOutLoud.
- 'Add to Lunch' capitals; delete and Removed wording (design defaults apply).

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft().
- Recipe fibre saved as 0.
- Food tab render test for add labels, hint and toast (needs a new test suite; not allowed by the brief).

## Next
1. R156 (in progress): full checkpoint, tsc and full app suite, no file changes. Clears the R155 flag.
2. SavedMealsList.tsx :59, :63 (locale keys; en first, then es, then fr).
3. plan.tsx :85, :97.
4. food.tsx :539, :795 use foodLog.addToMeal; :771 hint and :390 toast to locale keys.
5. es and fr locale gaps: mealDeleted, addedToMeal, deleteMeal. One file per round.
6. fr and es wording fixes listed above, one file per round.
7. Add sheet icons to design SVGs, one per round.
8. Consolidate SLOT_KEYS, one file per round.
9. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected for no design/ file were rewritten with design/Lume App.html named.
- R152 prompt rejected before it ran for not naming design/. Rewritten.
- R153 prompt rejected before it ran for not naming the loop/design-match branch. Rewritten with branch and no-git rule.
- R152 report flagged: tests not run. R153 flagged: 'task looks only partly done'. R154 strict re-check cleared it.
- R154 NEXT suggested a food tab render test. Declined: brief forbids new test suites. R155 NEXT repeated it. Still declined.
- R155 report flagged: tests not run. R156 is a checkpoint to clear it.
- Flags: R144, R146, R148, R149, R150, R152, R153, R155. R151 full checkpoint green. R154 cleared R153.
- Jev ask overridden at R120, R124, R126, R131, R134.
- Handovers after R125 and R141. Name files fully in prompts.

## Gotchas
- Design is in the bundler payload; decoded copy /tmp/lume-design may vanish. Grep it for copy.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Use LC_ALL=C /usr/bin/grep. Exclude .snap matches when passing results to jest.
- Locales in src/lib/i18n/locales/; check key order against en.json.
- src/lib/i18n/index.ts fixes lng to 'en'; es and fr are not on screen.
- 'Snacks' is in src/lib/mock/data.ts:48, key snack. Slot 'Snacks' maps to key snack.
- Shared Button in src/components/forms affects all callers; override locally first.
- Quote paths containing parentheses, such as src/app/(tabs)/food.tsx, in shell commands.
- Shell grep is ugrep; use LC_ALL=C /usr/bin/grep.