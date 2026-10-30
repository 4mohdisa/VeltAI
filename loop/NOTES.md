# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding behaviour stabilised. v1 scope locked; extra ideas go to Parked.
- design/Lume App.html is the source of truth. The gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted deviations).
- Isa r39: celebration card approved; row 18 edit cycle dropped (accepted); already-logged routes to the day; Summary card must not call logGymSession() with no args; food detail search shows macros.
- r48: derived gym duration logged when above 0; derived 0 sent as undefined (log-session.tsx save()). r49: keep ?? for template estimate (|| parked). r50: test gate green before any new product task.
- Card variant='elevated' is the repo mapping for the design's white card.
- Session mode state is derived, not set in effects (react-hooks/set-state-in-effect).
- Prompts: one task, one editable source file; one-line status edit to DESIGN_GAP_ANALYSIS.md allowed. Name design/Lume App.html and branch loop/design-match. Checks: tsc, eslint, jest on changed files only. Full suite at checkpoints only. Decode design payload per manager brief if /tmp/lume-design is missing. findRelatedTests finds nothing for screens; name the test file.

## Done (BUILT, not verified)
- Shared NumberEntryBar: food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab with focus=search; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card.
- Gym 'How did it go?' chooser; session modes adjust / ticklist / picker.
- Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() over color.overlay.
- Gym duration honesty (r48-49); gymDurationHonesty.test.ts passing.
- sheetVariant.test.ts fixed (r50); gate green.
- Food data path step 1: detailSubject.ts search variant has optional macro fields.

## In progress
- Food data path step 2: food.tsx pick() passes proteinPer100, carbsPer100, fatPer100.
- Step 3: detail.tsx search branch uses them, drops hardcoded zeros, fixes stale comment near lines 169-170, shows macros.

## Blocked on Isa
- Row 23 (Summary one-tap log). A: route onLog to log-session; edit index.tsx, oneTapGymLog.test.ts and V16 note. B: accepted deviation, doc-only. Asked r43, unanswered. Do not act.
- Row 17 Calories: design needs profile weight (5.5 MET). Shows a dash. Add the formula or accept the dash. Do not invent a number.
- Not yet asked: template estimate 0 with planMinutes above 0 logs no duration under ??. Use || as fallback? Ask only if still open later.

## Next tasks
1. Food data path step 2, then step 3.
2. gymDurationHonesty.test.ts: rename stale 'Not set' title; cover the 0-or-less case.
3. Row 17 step 3: footnote 'Push logged - streak extended' on CelebrationCard.tsx.
4. Row 17: Time shows 0 min on an empty plan; show a dash like Calories.
5. Row 23 per Isa's answer.
6. i18n hardcoded toast copy in index.tsx and log-session.tsx.
7. Doc-only status sync, one row each: Add sheet, Quick add, /gym/session summary, row 18.
8. Checkpoint (full tsc and jest, baseline 65 suites / 823 tests) when the loop note asks.
9. Food Search sheet (pill input, thumbnails, row metrics, no chips): needs a plan first.
10. Remaining gym rows: Isa approval per item.
11. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order and per-set remove; cardio ParameterForm inputs; template editor and dock; kg/lb field; volume shows kg only.
- Row 17: rest-day and /gym/session exits show no card; uppercase labels; spacing and pill differences; ring vs flame; pop-in omitted; possible overflow on device.
- mixHex in GymCalendar.tsx to a shared helper. App-only Stepper/SliderField entries stay.
- goals.tsx hardcoded 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- es/fr locales lack new keys. CONFLICT_KEYWORDS not type-linked. Unused addMenu keys: snapMeal, scanPackage, oneTapReadd, savedFoods.
- router.setParams rewrites history. Dev catalog has calories only, so macro fixes are a no-op in dev.
- Small a11y and copy items: blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx near 761 and 844; labels at add.tsx:70 and log-session.tsx:155; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx or log-session.tsx (test harness lacks SafeAreaProvider).
- Estimated gym duration is logged and the backend derives kcal. Revisit if only measured durations should count.
- Adjust and ticklist arrive checked, so 'Save progress?' fires on an untouched back-out.

## Loop notes
- R1-39: early rejections; data path, i18n and (a)-(e) handled.
- R43: asked Isa on row 23; unanswered. R45: prompt rejected (missing branch rule).
- R50: gate green. R51: notes trimmed under 600 words; food step 2 chosen (Jev run 65%).