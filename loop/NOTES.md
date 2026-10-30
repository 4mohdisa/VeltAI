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
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals, dashboard are manager-written, pending native review.
- es goals.setByLume 'Definida' and fr 'Définie' are feminine, matching the calorie label at src/app/profile/goals.tsx:125.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr, one file per round. One locale group per round. Streak labels are count-based plural keys.
- Flagged reports are cleared by a verification round before a new build task.
- Checkpoint rounds are read-only: tsc and full suite, no file changes.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- Handover notes that say es.json lacks gymLog are older than R208. R208 verification is authoritative.
- Each new locale group sits at its en.json position. Nutrition is being added to fr.json at its en.json position (R215).

## Built (not verified)
- NumberEntryBar shared. Food Add sheet (row 90). Gym chooser. Goals restyle. CelebrationCard (row 17 steps 1-2). Gym duration.
- Quick add toast, MEAL caption, detent, 52pt pill, compact Meal control. Recents macros per 100 g incl. fibre. Recipe fibre sum.
- food.tsx slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- savedMeals keys in en, es, fr. SavedMealsList.tsx uses t(). No hardcoded display text left in SavedMealsList.tsx.
- plan group in en, es, fr. plan.tsx uses it.
- goals: fr (20 keys), es (3 keys: setByLume, tapToEdit, savedAsYouType). gymLog: fr (21), es (21).
- Streak: gymLog.celebration streak_one/_other in en, es, fr (R207). dashboard.dayStreak_one/_other in en (R209) and es (R210).
- fr.json dashboard group, six keys, same order as en.json (R213). Verified structurally by R214.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R211 (read-only): tsc 0, JSON ok x3, dashboard keys ok in en and es, index.tsx:126 single call, 65/65 suites, 824/824 tests, 4/4 snapshots. R209 and R210 flags cleared.
- R212 (read-only checkpoint): tsc 0, 65/65 suites, 824/824 tests, 4/4 snapshots. No changes.
- R214 (read-only): tsc 0, JSON ok x3, fr dashboard keys and order ok, U+2019 ok, placeholders ok, full suite 65/65, 824/824, 4/4 snapshots. R213 flag cleared.
- Unverified: all new strings, plan, saved meal states, toasts, delete dialog, labels, goals, gymLog, streak wording, dashboard fr. No test covers locale files, SavedMealsList, plan.tsx or CelebrationCard.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. (R215, in progress) fr.json nutrition group, at its en.json position. One group, read-only tests not needed beyond tsc. Clears nothing in the gap list directly.
2. fr.json settings.scanAccuracy. One group per round.
3. es.json gymLog check: confirm it exists and is 21 keys in the next verification round. Handover saying it is missing is stale.
4. index.tsx:121 accessibility label is hardcoded English and reads 'Current streak 1 days'. Make it count-based and translated.
5. Other hardcoded streak wording, one file per round: index.tsx:115, gym.tsx:112 and :121, freeze.tsx:48, StreakCounter.tsx:15 default caption.
6. Consolidate SLOT_KEYS (add.tsx, food.tsx).
7. lastLoggedDaysAgo_one is unreachable: days === 1 returns the yesterday string. Fix.
8. 'Why this plan' hardcoded at src/app/dashboard/plan.tsx:120. Move to plan keys.
9. plan.addTitle is display only. entry.title stays English for the route param at plan.tsx:101.
10. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
11. Add sheet icons to design SVGs.
12. Review dashboard.welcome and dashboard.gymBedtime: no callers found in src/app or src/components. Decide keep or remove with Isa's native review.
13. Remaining gap rows, most cleared per task first.
14. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- fr gymLog.celebration.streak gives '1 jours d’affilée': CelebrationCard.tsx:72 puts the number before a fixed label. Needs a count-based key and a log-session.tsx change, affecting all locales.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design writes '14-day streak' with a hyphen; app uses a space. Keep the space.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test needs a new suite.
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.
- entry.title stays English in plan.addTitle ('Añadir a Breakfast'); needed for the slot param at plan.tsx:101.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration (streak 1 and above 1), Summary streak line, delete dialog, VoiceOver, toasts, saved meals (labels, toasts, counts, Log now, empty state), plan (title, empty state, Suggested line), goals, gymLog, VoiceOver Add label.
- Native review fr: savedMeals, plan, goals, gymLog, streak keys, dayStreak, dashboard (incl. 'Créneau de sport' and 'À suivre'). Typography (U+00A0, U+2019, straight apostrophes in goals; fr goals mixes straight and curly). 'enregistrer' meaning both save and log vs 'ajout' for logging. Gender agreement. differentWeights. Whether fr standardises on U+00A0 and U+2019.
- Native review es: plan, savedMeals, goals, gymLog, streak keys, dayStreak. Check 'Registra {{plan}} tal como estaba programado' and 'Bien hecho!'. 'Puede que no coincida', addedToMeal word order, 'elemento', masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.
- Override available: es emptyMessage wording.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show on screen.
- No test covers locale files or SavedMealsList. A passing suite says nothing about them.
- The Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep all output inside the repo. No /tmp, no output redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- Verification rounds after Jest-skipping rounds flag automatically.

## Loop notes
- Handover after R141, R156, R167, R172, R187, R204. Summary in loop/HANDOVER.md.
- Flags R183 to R207 cleared. R209 and R210 flags cleared by R211. R213 flag cleared by R214.
- R211 candidates: verification of R209 and R210, fr dashboard group, index.tsx:121 label. Chose verification.
- R212 candidates: checkpoint, fr dashboard group, index.tsx:121 label. Chose checkpoint per loop note.
- R213 candidates: fr dashboard group, index.tsx:121 label, fr nutrition group. Chose fr dashboard group. Jev 94% run.
- R214 candidates: verify R213, fr nutrition group, index.tsx:121 label. Chose verify R213 to clear the flag. Jev 95% run.
- R215 candidates: fr nutrition group, index.tsx:121 label, fr settings.scanAccuracy. Chose fr nutrition group. Jev 94% run.
- Jev matched on run for R203 to R205, R208 to R211, R213 to R215.
