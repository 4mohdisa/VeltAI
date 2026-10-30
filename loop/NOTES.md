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
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals, dashboard, nutrition are manager-written, pending native review.
- es goals.setByLume 'Definida' and fr 'Definie' are feminine, matching the calorie label at src/app/profile/goals.tsx:125.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr, one file per round, one locale group per round. Streak labels are count-based plural keys.
- Each new group sits at its en.json position.
- Flagged reports are cleared by a verification round before a new build task. Checkpoint rounds are read-only.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- Handover notes that say es.json lacks gymLog are stale. R208 is authoritative.

## Built (not verified)
- NumberEntryBar, food Add sheet (row 90), gym chooser, goals restyle, CelebrationCard (row 17 steps 1-2), gym duration, quick add toast, MEAL caption, detent, 52pt pill, compact Meal control, recents macros, recipe fibre sum, food.tsx slot heading, labels, toast, deleteMealHint, delete dialog.
- savedMeals keys in en, es, fr. SavedMealsList.tsx uses t().
- plan group in en, es, fr. plan.tsx uses it.
- goals: fr 20 keys, es 3 keys. gymLog: en, es, fr (21 keys each).
- Streak: gymLog.celebration streak_one/_other in en, es, fr. dashboard.dayStreak_one/_other in en, es.
- fr dashboard (6 keys, R213). fr nutrition (7 keys, R215).
- fr settings.scanAccuracy ('Précision du scan'), R217. Verified read-only in R218 (value and position OK).
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R216 verified fr nutrition and cleared the R215 flag.
- R214 verified fr dashboard. R211 verified en and es dashboard keys.
- R212 checkpoint: tsc 0, 65/65 suites, 824/824 tests, 4/4 snapshots.
- R217 flagged (tsc run, Jest not run). R218 was read-only: tsc 0, JSON parses, fr value confirmed, but Jest skipped, so R218 is flagged too.
- R219 is a read-only verification round: tsc plus the full Jest suite once. It clears the R218 flag.
- No test covers locale files, SavedMealsList, plan.tsx or CelebrationCard. A passing suite says nothing about them.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R219: read-only verification, tsc and full Jest suite, clears R218.
2. es.json settings.scanAccuracy after goals (same position as en.json). It is the last key missing from any locale. src/app/profile/index.tsx:147 uses it.
3. index.tsx:121 streak accessibility label: count-based and translated.
4. Other hardcoded streak wording, one file per round: index.tsx:115, gym.tsx:112 and :121, freeze.tsx:48, StreakCounter.tsx:15 default caption.
5. Consolidate SLOT_KEYS (add.tsx, food.tsx).
6. lastLoggedDaysAgo_one unreachable: days === 1 returns the yesterday string. Fix.
7. Hardcoded 'Why this plan' at src/app/dashboard/plan.tsx:120: move to plan keys.
8. Hardcoded 'Macros' kicker at src/app/dashboard/nutrition.tsx:77: move to nutrition keys.
9. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
10. Add sheet icons to design SVGs.
11. dashboard.welcome and dashboard.gymBedtime have no callers. Keep or remove after Isa's native review.
12. Remaining gap rows, most cleared per task first.
13. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- fr gymLog.celebration.streak gives '1 jours d'affilee': CelebrationCard.tsx:72 puts the number before a fixed label. Needs a count-based key and a log-session.tsx change across all locales.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design writes '14-day streak' with a hyphen; app uses a space. Keep the space.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test needs a new suite.
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.
- entry.title stays English in plan.addTitle; needed for the slot param at plan.tsx:101.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration (streak 1 and above 1), Summary streak line, delete dialog, VoiceOver, toasts, saved meals (labels, toasts, counts, Log now, empty state), plan (title, empty state, Suggested line), goals, gymLog, nutrition, VoiceOver Add label.
- Native review fr: savedMeals, plan, goals, gymLog, nutrition, streak, dayStreak, dashboard ('Creneau de sport', 'A suivre'), settings.scanAccuracy. Whether fr standardises on U+00A0 and U+2019. Straight versus curly apostrophes in fr goals. 'enregistrer' (save and log) versus 'ajout' for logging. Gender agreement. differentWeights.
- Native review es: plan, savedMeals, goals, gymLog, streak, dayStreak. Check 'Registra {{plan}} tal como estaba programado', 'Bien hecho!', 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' versus 'Removed'; negative margin on device.
- Override available: es emptyMessage wording.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show on screen.
- The Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep all output inside the repo. No /tmp, no output redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Verification rounds after Jest-skipping rounds flag automatically.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204. Latest summary in loop/HANDOVER.md.
- Flags cleared through R216. R217 flagged (tsc run, Jest not run). R218 flagged (tsc run, Jest skipped). R219 clears both with a full suite run.
- Jev matched on run for R203 to R205, R208 to R211, R213 to R216.
- R217 candidates: fr settings.scanAccuracy, index.tsx:121 label, lastLoggedDaysAgo_one fix. Chose fr settings.scanAccuracy. Jev 86% run.
- R218: Jev ranked es settings.scanAccuracy first (91%). Kept verification of R217 instead, because the flagged report must be cleared before a new build task.
- R219: Jev ranked es settings.scanAccuracy first (87%) after the loop note. Kept verification of R218 for the same reason. R218 skipped Jest, and i18n can reach Jest indirectly, so a full run is the clean clear. Next round builds es settings.scanAccuracy.