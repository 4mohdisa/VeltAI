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
- es addedToMeal and mealDeleted avoid gender. es goals.setByLume feminine, matching goals.tsx:125.
- fr savedMeals keeps U+00A0 and U+2019 (accepted, pending native review).
- fr is never shown on screen (src/lib/i18n/index.ts:41 fixes lng to 'en'). Low priority.
- Locale order en, es, fr; one file per round. New groups sit at their en.json position.
- R240: 'a petit-dejeuner' not in fr.json, dropped. R241: lastLoggedLabel counts calendar days.
- R243 and R247: no new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- R249: es plan.whyThisPlan follows English wording; native review pending.
- Flagged reports are cleared by a read-only verification round before a new build task. Checkpoint rounds are read-only.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel in src/components/food/SavedMealsList.tsx (calendar days, DST-safe).
- Streak and summary keys (gymLog.celebration, dashboard.dayStreak_one/_other, streakLoading, streakLoadError, summaryTitle) in en, es, fr. settings.scanAccuracy in es.
- (tabs)/index.tsx lines 102, 109, 115, 121 use t(). plan.tsx:120 uses t('plan.whyThisPlan'), in all three locales (fr added R251).
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R242 checkpoint green. R246, R248, R250, R252 read-only green (R252: tsc exit 0; 65 suites, 824 tests, 4 snapshots passing; en 150, fr 150, es 152 with extras addMenu.voice and addMenu.describeOutLoud).
- R247, R249, R251 flagged, Jest not run. R252 cleared the R251 flag.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).
- No test covers locales, SavedMealsList, plan.tsx, CelebrationCard, plural selection or (tabs)/index.tsx.

## Next
1. R253: nutrition.tsx:77 'Macros' to t(). Running now (no gap row; hardcoded English fix).
2. (tabs)/gym.tsx:112 and :121 to t().
3. gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
4. Add sheet icons to design SVGs.
5. Remaining gap rows, most cleared first.
6. Full Jest checkpoint every 5 rounds, read-only. Next checkpoint R255.
7. If no non-gym work remains: stop with 'only owner decisions remain'.
8. Remove es addMenu.voice and describeOutLoud only after Isa approves.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote missing.
- fr gymLog.celebration.streak needs a count-based key and a log-session change.
- fr 'Ajouter à {{slot}}' reads oddly with 'Petit-déjeuner'. plan.addTitle: entry.title stays English; 'Ajouter à' and 'Añadir a' differ from 'Add'.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design '14-day streak' hyphen; app keeps the space.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56; SLOT_KEYS duplicated in add.tsx and food.tsx.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds; food tab render test needs a suite.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable (kept).
- Future-dated saved-meal logs read 'Last logged today'.
- Hardcoded English still open: nutrition.tsx:77 (in progress R253); (tabs)/gym.tsx:112, :121; gym/freeze.tsx:48; StreakCounter.tsx:15.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary title and streak, streak loading and failure, celebration (streak 1+), delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan (incl. 'Why this plan'), goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add.
- Native review fr and es: new strings, gender, 'Resumen', 'Résumé', 'Creneau de sport', 'A suivre', U+00A0 and U+2019.
- Remove es voice and describeOutLoud: Delete vs Removed wording; negative margin on device.
- Override: es emptyMessage wording; whether fr standardises on U+00A0 and U+2019.
- Design check for 'breakfast' in French templates.

## Gotchas
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- --findRelatedTests on a file with no tests exits 1. Not a failure by itself.
- Check key sets in both directions.
- One file per round where possible. Handover summaries can be stale on built items and key counts; check against this file.
- src/lib/i18n/index.ts:41 fixes lng to 'en'.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220, R235, R240, latest in loop/HANDOVER.md.
- Rejected: R236 (more than one screen), R238 and R243 (no design file named).
- Flags cleared: R239, R241, R242, R244, R245, R246, R248, R250, R251 (cleared by R252).
- Jev: R251 and R252 run favoured; agreed. R253 run chosen, same as candidate 1.