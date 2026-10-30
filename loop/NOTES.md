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
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement. es savedMeals.emptyMessage translated from en (Isa may override).
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals are manager-written, pending native review.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr, one file per round. savedMeals follows foodLog. gymLog and plan follow savedMeals in es and fr. plan is last in en.
- Flagged reports are cleared by a verification round before a new build task.
- Checkpoint is a read-only verification round. Full suite runs in verification rounds after rounds that skipped Jest.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- Streak labels must be count-based plural keys (R207 decision).

## Built (not verified)
- NumberEntryBar shared (quick add, food detail, gym session, PlannedValuesForm).
- Food Add sheet (row 90). Gym chooser. Goals restyle. CelebrationCard (row 17 steps 1-2). Gym duration.
- Quick add toast, MEAL caption, detent, 52pt pill, compact Meal control.
- Recents macros per 100 g incl. fibre. Recipe fibre sum.
- food.tsx slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- savedMeals keys in en, es, fr. SavedMealsList.tsx uses t() throughout.
- plan group in en, es, fr. plan.tsx uses it.
- goals: fr (20 keys), es (setByLume, tapToEdit, savedAsYouType).
- gymLog: fr (21 keys, R203), es (21 keys, R205). Same order as en.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last full green run: R206 (read-only verification). tsc 0, JSON ok x3, gymLog keys match en in es and fr, 65/65 suites, 824/824 tests, 4/4 snapshots.
- R205 (es gymLog) flag cleared by R206.
- Unverified: all new strings, plan screen, saved meal states, toasts, delete dialog, Add to labels, slot heading, goals, gymLog. No test reads locale files or covers SavedMealsList or plan.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. (R207, in progress) Count-based streak key: CelebrationCard.tsx and log-session.tsx, gymLog.celebration streak_one and streak_other in en, es, fr. Check tsc, JSON, and the touched tests.
2. Verification round after R207 (Jest skipped, so the flag will fire): full suite, JSON x3, key match.
3. dashboard.dayStreak: check for the same number-plus-fixed-label fault and fix in the same style.
4. fr.json dashboard, nutrition, settings.scanAccuracy. One group per round.
5. es.json gymLog check (listed as missing in handover; notes say built R205, confirm once).
6. Consolidate SLOT_KEYS (add.tsx, food.tsx).
7. Fix lastLoggedDaysAgo_one: unreachable, because days === 1 returns the yesterday string.
8. 'Why this plan' hardcoded at src/app/dashboard/plan.tsx:120. Move to plan keys.
9. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
10. plan.addTitle is display only. entry.title stays English for the route param at plan.tsx:101.
11. Add sheet icons to design SVGs.
12. Remaining gap rows, most cleared per task first.
13. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test needs a new suite.
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration, delete dialog, VoiceOver, toasts, saved meals, plan, goals, gymLog.
- Native review fr: savedMeals, plan, goals, gymLog. Typography (U+00A0, U+2019, straight apostrophes in goals). 'enregistrer' vs 'ajout'. Gender agreement. differentWeights.
- Native review es: plan, savedMeals, goals, gymLog. Check 'Registra {{plan}} tal como estaba programado' and 'Bien hecho!'. Also 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.
- Override available: es emptyMessage wording.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show on screen.
- No test covers locale files or SavedMealsList.
- The Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep all output inside the repo. No /tmp, no output redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Prompts with no design file or no branch rule get rejected.
- Verification rounds after Jest-skipping rounds will flag automatically.

## Loop notes
- Handover after R141, R156, R167, R172, R187, R204. Summary in loop/HANDOVER.md.
- Flags R183 to R205 all cleared by R206.
- Jev matched on run for R203, R204, R205.
- R206 (verification, green): chosen over streak fix so the R205 flag clears first.
- R207 candidates: streak key fix, fr dashboard group, SLOT_KEYS consolidation. Chose streak key fix (visible wrong plural, one component plus locale keys).