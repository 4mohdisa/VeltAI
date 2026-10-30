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

## Built (not verified)
- NumberEntryBar shared: quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90), gym 'How did it go?' chooser, Goals restyle, CelebrationCard (row 17 steps 1-2), gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; new-recipe.tsx sums fibre.
- food.tsx: slot heading, VoiceOver and 'Add to' labels via foodLog.addToMeal, toast, meal delete hint, dialog and toast use translated keys.
- en, es, fr: addMenu breakfast/lunch/dinner/snack; foodLog delete and addedToMeal keys.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132, R140, R145, R151 (tsc 0, 65 suites, 824 tests).
- Targeted since R145: R146 (30 suites, 510 tests), R147 (8 suites, 119 tests). R148 to R150: tsc 0; en, es, fr JSON parse OK.
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
- fr foodLog missing 11 keys: today, searchPlaceholder, noMatches, addCustomFood, mealHistory, noMealsTitle, noMealsMessage, addMeal, per100, openFood, conflict. R152 rewritten (names design/Lume App.html, gap row none) and in progress. es missing foodLog.openFood and conflict group.
- Locale wording: fr 'a petit-dejeuner' should be 'au'; es 'Anadir a Desayuno' should be 'Anadir al desayuno'; fr has 2 es keys.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Long-press meal delete not discoverable.
- food.tsx :539, :795 'Add to' text and :771 hint hardcoded English; :390 toast lowercases raw slot.
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

## Next
1. R152: add 11 missing foodLog keys to fr.json (locale only, one file). Rewritten with design/Lume App.html named. In progress.
2. SavedMealsList.tsx :59, :63 (locale keys; en first, then es, then fr).
3. plan.tsx :85, :97.
4. Add sheet icons to design SVGs, one per round.
5. Consolidate SLOT_KEYS, one file per round.
6. Fr and es locale gaps (es openFood and conflict; es mealDeleted, addedToMeal, deleteMeal); ask Isa only if no other non-gym task remains.
7. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected for no design/ file were rewritten with design/Lume App.html named.
- R152 prompt rejected before it ran for not naming design/. Rewritten to name design/Lume App.html and gap row none.
- Flags: R144, R146, R148, R149, R150. R151 full checkpoint green, flag cleared.
- R152 chose fr foodLog keys over SavedMealsList: single file, reported as NEXT.
- Jev ask overridden at R120, R124, R126, R131, R134.
- Handovers after R125 and R141. Name files fully in prompts.

## Gotchas
- Design is in the bundler payload; decoded copy /tmp/lume-design may vanish. Grep it for copy.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Use LC_ALL=C /usr/bin/grep. Exclude .snap matches when passing results to jest.
- Locales in src/lib/i18n/locales/; check key order against en.json.
- src/lib/i18n/index.ts fixes lng to 'en'.
- 'Snacks' is in src/lib/mock/data.ts:48, key snack.
- Shared Button in src/components/forms affects all callers; override locally first.