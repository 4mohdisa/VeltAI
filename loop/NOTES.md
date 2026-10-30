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
- es voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement. es savedMeals.emptyMessage translated from en (Isa may override).
- es goals.setByLume 'Definida' and fr 'Definie' are feminine, matching src/app/profile/goals.tsx:125.
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals, dashboard, nutrition are manager-written, pending native review.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr; one file per round. Streak labels are count-based _one/_other. Celebration strings have no {{count}}; dashboard strings do. New groups sit at their en.json position.
- Line 121 reads 'N day streak'. Line 115 is the load-failure notice with its own key.
- fr remainingToday 'Il reste {{value}} aujourd’hui'. fr streak strings use 'jours d’affilée' and 'vos'.
- fr is never shown on screen (src/lib/i18n/index.ts:41 fixes lng to 'en'). Low priority.
- R240: 'a petit-dejeuner' is not in fr.json. R239 dropped.
- R241: lastLoggedLabel counts calendar days (local dates), not 24-hour periods.
- R243: no new test suites. The 11pm-to-9am case is checked on device by Isa.
- Flagged reports are cleared by a verification round before a new build task. Checkpoint rounds are read-only.
- Handover suggestion to remove es addMenu.voice and describeOutLoud is not followed until Isa approves.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel calendar-day logic in src/components/food/SavedMealsList.tsx (Date.UTC day difference, DST-safe).
- Streak keys: gymLog.celebration.streak_one/_other; dashboard.dayStreak_one/_other, streakLoading, streakLoadError, summaryTitle in en, es, fr. es settings.scanAccuracy and gymLog group.
- (tabs)/index.tsx lines 102, 109, 115, 121 use t().
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R242 full checkpoint: tsc exit 0; Jest 65 suites, 824 tests, 4 snapshots green. This covers the R241 change at suite level only.
- R244, R245, R246 read-only checks: lastLoggedLabel and savedMeals keys re-read. Jest not run since R242.
- Keys: en 149, fr 149, es 151 (extras addMenu.voice, addMenu.describeOutLoud).
- No test covers locale files, SavedMealsList, plan.tsx, CelebrationCard, plural selection or (tabs)/index.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R246: read-only tsc and full Jest. Clears the flag. No edits.
2. plan.tsx:120 'Why this plan' to t().
3. nutrition.tsx:77 'Macros' to t().
4. (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
5. Add sheet icons to design SVGs.
6. Remaining gap rows, most cleared first.
7. Full Jest checkpoint every 5 rounds (read-only).
8. If no non-gym work remains: stop with 'only owner decisions remain'.
9. Remove es addMenu.voice and describeOutLoud only after Isa approves.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote missing.
- fr gymLog.celebration.streak needs a count-based key and a log-session change.
- fr slot phrasing 'Ajouter à {{slot}}' with 'Petit-déjeuner' reads oddly.
- plan.addTitle: entry.title stays English (plan.tsx:99).
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design '14-day streak' hyphen; app keeps the space.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds; food tab render test needs a suite.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable (kept).
- Future-dated saved-meal logs read 'Last logged today'. Matters if device clock is behind.
- Render test for 11pm-to-9am lastLoggedLabel. Dropped per R243.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary title and streak, streak loading and failure, celebration (streak 1+), delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan, goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add.
- Native review fr and es: new strings, gender, 'Resumen', 'Résumé', 'Creneau de sport', 'A suivre', U+00A0/U+2019.
- Remove es voice and describeOutLoud: Delete vs Removed wording; negative margin on device.
- Override: es emptyMessage wording. Whether fr standardises on U+00A0 and U+2019.
- Design check for 'breakfast' in French templates: re-run on decoded manifest assets.

## Gotchas
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- --findRelatedTests on a file with no tests exits 1. Not a failure by itself.
- Check key sets in both directions.
- Prompts with more than one file or screen get rejected. One file per round.
- Handover summaries can be stale on what is built; check against this file.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220, R235, R240. Latest in loop/HANDOVER.md.
- Rejected: R236 (more than one screen), R238 (no design file named), R243 (no design file named). Rewritten as R237, R239 and the R242 checkpoint.
- Flags R239, R241, R242, R244, R245: cleared by read-only verification rounds.
- R246: flagged on the type check only. Cleared by full Jest in this round.
- Jev: R240 ask 53%, run 44%; manager chose read-only run. R241 to R245 run favoured; agreed each time. R246 run 85%; agreed.