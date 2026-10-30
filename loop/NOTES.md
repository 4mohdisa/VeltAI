# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras to Parked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- design/Lume App.html is source of truth; gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args.
- Celebration calories show a dash. Quick add detent fitToContents. Pill height by padding.
- Macros stored unrounded, display rounds. Gym duration logged when above 0. Grid 1fr 1fr, 12pt gap.
- Add sheet row 90 BUILT at Isa's instruction. Negative margin at add.tsx:68 accepted; SheetContent is shared, not edited.
- Slot key snack = 'Snacks'. Add sheet title lowercases translated slot; unknown slot falls back to 'Add meal'.
- Food log 'Add to Lunch' keeps its capital per Isa's brief. Do not lowercase at food.tsx:552 or :975.
- No fallback in the delete toast: slot is typed MealSlot.
- SLOT_KEYS duplicated in add.tsx and food.tsx; share it if a third caller appears.
- Delete button key lives in foodLog; Cancel reuses common.cancel.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- Meal delete toast and dialog use design defaults for casing and wording until Isa overrides.
- French and Spanish slot translations are agent translations ('vous' fr, 'tu' es).
- Prompts: one task, one editable file, name design/ file and gap row (or 'none'). No git. Branch loop/design-match only.
- Checkpoints: full tsc and full app suite, no file changes.
- Locale keys: add to en first, then es, then fr, one file per round.
- Flag rule outranks Jev ranking. Jev 'ask' overridden when the next task needs nothing from Isa.
- Report must show the tsc result and any JSON parse result in CHECKED, so a flag can be cleared from the report alone.

## Built (not verified)
- NumberEntryBar shared: quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet (row 90), gym 'How did it go?' chooser, Goals restyle, CelebrationCard (row 17 steps 1-2), gym duration honesty.
- Quick add: toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre; new-recipe.tsx sums fibre.
- food.tsx: local SLOT_KEYS (line 84); slot heading, VoiceOver, 'Add to' labels (539, 795) using foodLog.addToMeal, toast (390), delete dialog and toast use translated keys.
- food.tsx:771 meal delete hint uses t('foodLog.deleteMealHint', { slot: t(`addMenu.${SLOT_KEYS[slot]}`) }) (R146, unverified).
- en.json: foodLog.deleteMealHint, mealDeleted, deleteMealTitle, deleteMealMessage_one/_other, deleteMealConfirm (unverified).
- es.json: seven foodLog keys added R148 (addedToMeal, mealDeleted, deleteMealTitle, deleteMealMessage_one/_other, deleteMealConfirm, deleteMealHint). Flagged for missing checks; R149 re-checks tsc and JSON parse of es.json and fr.json.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Full checkpoints green: R113, R117, R120, R122, R126, R130, R132, R140, R145 (tsc 0, 65 suites, 824 tests).
- Targeted only since R145: R146 (30 food-referencing suites, 510 tests, passed; no test renders the hint). R147: no file changes; 8 food suites, 119 tests, passed.
- R148: tsc 0 errors; es.json parses; no tests run (no test reads locale files).
- No test renders the add.tsx title, food.tsx slot heading, MealSectionHeader, delete dialog, toast or 'Add to' labels. No test reads locale files.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open (buildable, non-gym)
- SavedMealsList.tsx :59, :63 hardcoded English toasts. plan.tsx :85 'Suggested:', :97 'Add ${entry.title}'.
- fr.json lacks the seven foodLog keys (R149 doing now). es.json lacks foodLog.openFood and the foodLog.conflict group.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Add sheet icons are SF Symbols, not design SVGs.
- Quick add (row 87): no blinking caret; own KAV; hardcoded English; offline toast names no meal; 17/24 vs 17/22.
- Row 17: streak footnote missing; Time dash on empty plan; '0 min' possible; stat overflow.
- Recipe Total shows 0g fibre when unknown. Saved foods drop fibre. detail.tsx num() rounds on save.
- Locales: es voice and describeOutLoud unused; fr foodLog has 2 es keys; fr 'a petit-dejeuner' should be 'au'; es 'Anadir a Desayuno' should be 'Anadir al desayuno'. Native review needed.
- Design mealNow() returns 'Snack'; MEALS uses 'Snacks'.
- Long-press delete not discoverable (design call open).

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation.
- Row 17 Calories: formula or accepted deviation (dash now).
- Search foods tile routing; global + title default.
- Quick add 17/22 vs 17/24.
- Add sheet 0pt gap on no-inset devices: acceptable?
- 'Snacks' English label; 'added to snacks' toast wording.
- Device runs: Add sheet; recipe and fibre; quick add; celebration card; meal delete dialog (singular and plural), 'Removed {{slot}}', header and VoiceOver.
- Meal delete has no gap row: add one?
- Macro types for food detail (data model change, parked).
- Native review of fr and es addMenu and the new es and fr foodLog strings (es: 'Se ha eliminado', 'elemento'; fr: 'Suppression de ... effectuée').
- Remove es voice and describeOutLoud.
- 'Add to Lunch' capitals: confirm or override. Delete and Removed wording: design defaults apply.
- Last-hour modified-files check: keep or round-scoped only.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration logged.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner with modes; compact chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); SLOT_KEYS consolidation.
- Recipe fibre saved as 0.
- Long-press meal delete discoverability.
- No render tests for food.tsx, detail.tsx, quick-add.tsx, log-session.tsx, new-recipe.tsx, add.tsx title, MealSectionHeader. No locale tests. No confirmDeleteMeal test.

## Next
1. R149 (now): fr.json, add the seven foodLog keys in en.json order, 'vous' form, skip existing keys. Re-parse es.json and fr.json. tsc only. Gap row: none.
2. SavedMealsList.tsx :59, :63 (locale keys if none fit).
3. plan.tsx :85, :97.
4. Add sheet icons: SF Symbols to design SVGs, one per round.
5. Consolidate SLOT_KEYS, one file per round.
6. Checkpoint: full tsc and full suite.
7. If nothing non-gym remains: stop with 'only owner decisions remain'.

## Loop notes
- Prompts rejected for no design/ file: R89, R99, R117, R125, R139, R146 earlier attempt, R147 prompt. All rewritten with design/Lume App.html named.
- R147 prompt also rejected for no loop/design-match branch line. R148 prompt names both.
- R144 flagged: no suites run. R145 checkpoint ran clean but was flagged again as partly done. R146 finished food.tsx:771 and reported it done.
- R146 flagged as partly done because food.tsx 539 and 795 were listed as hardcoded. R147 reported they already use foodLog.addToMeal (VoiceOver labels). Flag cleared.
- R148 flagged: type check or tests failed or not run. tsc was run (0 errors) but the report did not show the JSON parse as a check. R149 re-runs tsc and the parse explicitly.
- Jev ask overridden at R120, R124, R126, R131, R134.
- Handovers after R125 and R141. Name files fully in prompts.

## Gotchas
- Design is in the bundler payload (gzip+base64). /tmp/lume-design may vanish; decoded copy was at 71f71ac4 (food). Grep the decoded copy for copy such as 'Long press'.
- --findRelatedTests misses source-reading tests; grep src/__tests__.
- Use LC_ALL=C /usr/bin/grep. Shell grep is ugrep. Grep before citing line numbers.
- Exclude the .snap match when passing grep results to jest.
- Locales: src/lib/i18n/locales/. Check key order against en.json.
- src/lib/i18n/index.ts fixes lng to 'en', so es and fr are not on screen.
- Slot 'Snacks' is in src/lib/mock/data.ts:48, key snack. slot.toLowerCase() finds nothing for it.
- Shared Button in src/components/forms affects all callers: override locally first.