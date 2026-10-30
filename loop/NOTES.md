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
- Locale order en, es, fr, one file per round. Streak labels are count-based plural keys.
- Flagged reports are cleared by a verification round before a new build task.
- Checkpoint rounds are read-only: tsc and full suite, no file changes.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- Handover notes that say es.json lacks gymLog are older than R208. R208 verification is authoritative.

## Built (not verified)
- NumberEntryBar shared. Food Add sheet (row 90). Gym chooser. Goals restyle. CelebrationCard (row 17 steps 1-2). Gym duration.
- Quick add toast, MEAL caption, detent, 52pt pill, compact Meal control. Recents macros per 100 g incl. fibre. Recipe fibre sum.
- food.tsx slot heading, 'Add to' and VoiceOver labels, translated toast, deleteMealHint, delete dialog.
- savedMeals keys in en, es, fr. SavedMealsList.tsx uses t().
- plan group in en, es, fr. plan.tsx uses it.
- goals: fr (20 keys), es (3 keys). gymLog: fr (21), es (21).
- Streak: gymLog.celebration streak_one/_other in en, es, fr (R207). dashboard.dayStreak_one/_other in en (R209) and es (R210). fr dashboard group missing.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R211 (read-only): tsc 0, JSON ok x3, dashboard keys ok in en and es, index.tsx:126 single call, 65/65 suites, 824/824 tests, 4/4 snapshots. R209 and R210 flags cleared.
- Unverified: all new strings, plan, saved meal states, toasts, delete dialog, labels, goals, gymLog, streak wording. No test covers locale files, SavedMealsList, plan.tsx or CelebrationCard.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. (R212, in progress) Checkpoint: tsc and full suite, no files changed.
2. fr.json dashboard group: dayStreak_one '{{count}} jour d’affilée', dayStreak_other '{{count}} jours d’affilée'. One group per round.
3. fr.json nutrition, then settings.scanAccuracy. One group per round.
4. index.tsx:121 accessibility label is hardcoded English and reads 'Current streak 1 days'. Make it count-based and translated.
5. Other hardcoded streak wording, one file per round: index.tsx:115, gym.tsx:112 and :121, freeze.tsx:48, StreakCounter.tsx:15 default caption.
6. Consolidate SLOT_KEYS (add.tsx, food.tsx).
7. lastLoggedDaysAgo_one is unreachable: days === 1 returns the yesterday string. Fix.
8. 'Why this plan' hardcoded at src/app/dashboard/plan.tsx:120. Move to plan keys.
9. plan.addTitle is display only. entry.title stays English for the route param at plan.tsx:101.
10. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
11. Add sheet icons to design SVGs.
12. Remaining gap rows, most cleared per task first.
13. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0 across types and totals.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design writes '14-day streak' with a hyphen; app uses a space. Keep the space.
- Code: mixHex helper; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0. Saved foods drop fibre. detail.tsx num() rounds on save. Food tab render test needs a new suite.
- Long-press meal delete not discoverable. mealNow() returns 'Snack' while MEALS uses 'Snacks'.

## Blocked on Isa
- Row 23 one-tap log: route or accepted deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe and fibre, quick add, celebration (streak 1 and above 1), Summary streak line, delete dialog, VoiceOver, toasts, saved meals, plan, goals, gymLog.
- Native review fr: savedMeals, plan, goals, gymLog, streak keys, dayStreak. Typography (U+00A0, U+2019, straight apostrophes in goals). 'enregistrer' vs 'ajout'. Gender agreement. differentWeights.
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
- Flags R183 to R207 cleared. R209 and R210 flags cleared by R211.
- R211 candidates: verification of R209 and R210, fr dashboard group, index.tsx:121 label. Chose verification.
- R212 candidates: checkpoint (tsc and full suite, read-only), fr dashboard group, index.tsx:121 label. Chose checkpoint per loop note. Jev ranked fr dashboard group first at 81%; kept checkpoint because the loop note sets this round's task.
- Jev matched on run for R203 to R205, R208, R209, R210, R211.