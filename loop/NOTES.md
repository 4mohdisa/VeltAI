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
- en, es, fr: addMenu slots, foodLog, savedMeals (logged, logFailed, lastLoggedToday, lastLoggedYesterday, lastLoggedDaysAgo_one, lastLoggedDaysAgo_other, neverLogged). SavedMealsList toasts use logged and logFailed.
- SavedMealsList lastLoggedLabel takes t and uses savedMeals keys (all four branches, days passed as count). Built in R185, not verified.
- en, es, fr: plan group (suggested, addTitle, title, emptyTitle, emptyMessage). plan.tsx uses them for suggested line, add title, screen title and empty state. R187, not verified.
- en.json only: savedMeals emptyTitle, emptyMessage, itemCount_one, itemCount_other, logNow added. SavedMealsList.tsx lines 85, 86, 102 and 109 call t(). R189, not verified. es.json and fr.json do not have these keys yet.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last green checkpoint: R184 (tsc 0, 65 suites, 824 tests, 4 snapshots; parse en, es, fr 0).
- R185 flagged, cleared by R186 verification (green).
- R187 flagged (tsc 0 and JSON parse OK, full suite not run). R188 verification: tsc 0, 65 suites, 824 tests, 4 snapshots passing; plan.tsx title and empty state use t(); en, es, fr parse and hold plan keys. R187 flag cleared.
- R189 flagged (tsc 0 and en.json parse OK, full suite not run). R190 is a verification round (tsc, full suite, three locale parses, SavedMealsList check, no edits).
- Unverified: add title, slot heading, delete dialog, toasts, 'Add to' labels, saved meal toasts, plan group, plan.tsx title and empty state, lastLoggedLabel, R189 savedMeals strings. No test reads locale files or covers SavedMealsList or plan.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R190: verification round (tsc, full suite, locale parse, SavedMealsList check). No edits. Clears R189 flag.
2. Add the five savedMeals keys (emptyTitle, emptyMessage, itemCount_one, itemCount_other, logNow) to es.json, then fr.json (one file per round). fallbackLng is en, so no raw key shows.
3. Fix SavedMealsList lastLoggedDaysAgo_one: branch is unreachable because days === 1 returns the yesterday string.
4. Locale gaps, one file per round: fr goals, gymLog, dashboard, nutrition, settings.scanAccuracy; es gymLog, settings.scanAccuracy, goals; es still has addMenu.voice and describeOutLoud.
5. 'Why this plan' hardcoded at src/app/dashboard/plan.tsx:120 to plan keys.
6. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
7. plan.addTitle display label. entry.title stays English for the route param at plan.tsx:101.
8. Add sheet icons to design SVGs.
9. Consolidate SLOT_KEYS (add.tsx, food.tsx).
10. Remaining gap rows, most rows cleared per task first.
11. If no non-gym work remains: stop with 'only owner decisions remain'.

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
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver, toasts, saved meal toasts (both states, all four last-logged labels), saved meals empty state and item counts and Log now, plan Suggested and Add label, plan title and empty state.
- Meal delete has no gap row. Macro types for food detail (data model, parked).
- Native review fr: all new savedMeals and plan strings, plain vs no-break spaces, gender agreement, last-logged wording, 'ajout' vs 'Enregistre'. Older French strings use plain spaces; open question.
- Native review es: new plan and savedMeals strings, 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'; es and fr are not on screen.
- zsh: use xargs or --runTestsByPath. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Check code points with node.
- Keep all output inside the repo. No /tmp.
- SavedMealsList has no test file. Slot 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.
- plan.tsx path is src/app/dashboard/plan.tsx, not under (tabs).
- entry.title is English in plan.addTitle under es and fr. It must stay English for the slot route param at plan.tsx:101.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Verification rounds keep being requested after rounds that skip Jest, so the automatic flag may refire.
- Grep of design/Lume App.html found no plan empty-state wording and no saved-meal empty-state wording; the English values are the exact old app text.

## Loop notes
- Handover after R141, R156, R167, R172, R187. Next due around R202.
- R183 flagged, cleared by R184 (green).
- R185 flagged (tests not run). R186 verification green, flag cleared.
- R187 flagged (full suite not run). R188 verification green, flag cleared.
- R189 flagged (full suite not run, tsc and en.json parse ran). R190 verification round assigned.
- Jev R190: run 95%, ask 4%, stop 1%. Risk 1.3/2 noted; kept run. Flag clearance comes first, then the es keys.
- Handover summary's 'fr lacks plan' is stale; fr plan group is present.
- Handover summary's 'fr lacks goals, gymLog, dashboard, nutrition, settings.scanAccuracy' still applies (Next 4).
- Handover summary's 'Recommended next: move remaining SavedMealsList strings' is done (R189).