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
- es goals.setByLume 'Definida' and fr 'Definie' are feminine, matching src/app/profile/goals.tsx:125.
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals, dashboard, nutrition are manager-written, pending native review.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr; one file per round. Streak labels are count-based _one/_other keys. Celebration strings have no {{count}}; dashboard strings do. Each new group sits at its en.json position.
- Line 121 label reads 'N day streak'. Line 115 is the load-failure notice with its own key.
- fr remainingToday 'Il reste {{value}} aujourd’hui'. fr streak strings use 'jours d’affilée' and 'vos'.
- Flagged reports are cleared by a verification round before a new build task. Checkpoint rounds are read-only.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- fr is never shown on screen (src/lib/i18n/index.ts:41 fixes lng to 'en'). Low priority.
- R240: 'a petit-dejeuner' is not in fr.json. R239 dropped.
- Handover notes saying es.json lacks gymLog or scanAccuracy are stale.
- R241: lastLoggedLabel counts calendar days (local dates), not 24-hour periods. Fixes 11pm-to-9am reading 'today'.
- R243 decision: no new test suites, per the manager brief. The planned 11pm-to-9am test is dropped; the case is checked on device by Isa.
- Handover suggestion to remove es addMenu.voice and describeOutLoud is not followed yet: needs Isa approval first.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- R241: lastLoggedLabel calendar-day calculation in src/components/food/SavedMealsList.tsx (Date.UTC day difference, DST-safe). Read-only check at R244 passed (see Verification).
- Streak: gymLog.celebration.streak_one/_other and dashboard.dayStreak_one/_other in en, es, fr.
- dashboard.streakLoading, streakLoadError, summaryTitle in en, es, fr. es settings.scanAccuracy and gymLog group.
- (tabs)/index.tsx lines 102, 109, 115, 121 use t().
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last full checkpoint R242 (read-only): tsc exit 0; Jest 65 suites, 824 tests, 4 snapshots green. This covers the R241 change at the suite level only.
- R241 flagged: tsc exit 0 only. Cleared by R242.
- R242 report flagged by automatic check. R244 was a read-only verification of the R241 lastLoggedLabel code. R244 passed on reading: calendar-day logic, Date.UTC day difference, and all savedMeals keys present in en.json. Nothing was run. R244 report flagged again: type check or tests not run. R245 is a read-only tsc check to clear it.
- Keys: en 149, fr 149, es 151 (extras addMenu.voice, addMenu.describeOutLoud).
- No test covers locale files, SavedMealsList, plan.tsx, CelebrationCard, plural selection or (tabs)/index.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R245: read-only tsc check and re-read of lastLoggedLabel and en.json savedMeals keys. Clears the R244 flag. No Jest run.
2. If it passes: plan.tsx:120 'Why this plan' to t(). One file per round.
3. Then nutrition.tsx:77 'Macros' to t().
4. Then (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
5. Add sheet icons to design SVGs.
6. Remaining gap rows, most cleared per task first.
7. Full Jest checkpoint at R247 (read-only).
8. If no non-gym work remains: stop with 'only owner decisions remain'.
9. Remove es addMenu.voice and describeOutLoud only after Isa approves.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote missing.
- fr gymLog.celebration.streak needs a count-based key and a log-session change.
- fr slot phrasing: 'Ajouter à {{slot}}' with 'Petit-déjeuner' reads oddly. Low priority.
- plan.addTitle: entry.title stays English (plan.tsx:99). fr 'Ajouter à' vs en 'Add'.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design '14-day streak' hyphen; app keeps the space.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds; food tab render test needs a suite.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable in en, es and fr (kept; safe to leave).
- Future-dated saved-meal logs read 'Last logged today' (negative days hit the days <= 0 branch). Left as is. Matters more if the device clock is behind the server.
- Test for the 11pm-to-9am lastLoggedLabel case through a SavedMealsList render. Dropped per R243 decision: no new test suites.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary title and streak, streak loading and failure, celebration (streak 1+), delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan, goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add.
- Native review fr and es: new strings, gender, 'Resumen', 'Résumé', 'Creneau de sport', 'A suivre', U+00A0/U+2019.
- Remove es voice and describeOutLoud: Delete vs Removed wording; negative margin on device.
- Override: es emptyMessage wording. Whether fr standardises on U+00A0 and U+2019.
- Design check for 'breakfast' in the French templates: needs re-running on the decoded manifest assets, not the compressed HTML.

## Gotchas
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- --findRelatedTests on a file with no tests exits 1. Not a failure by itself.
- Check key sets in both directions.
- Prompts with more than one file or screen get rejected. One file per round.
- src/lib/i18n/index.ts:41 fixes lng to 'en', so es and fr never show on screen.
- Handover summaries can be stale on what is built; check against this file.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220, R235, R240 window. Latest in loop/HANDOVER.md.
- Rejected: R236 (more than one screen or component). R238 (prompt did not name design/Lume App.html). Rewritten as R237 and R239.
- R239 flagged: prompt premise false (string absent). Handled by R240 read-only trace.
- R240 read-only report: lastLoggedDaysAgo_one unreachable. Calendar-day bug found; R241 is the fix.
- R241 flagged by automatic check: type check or tests not fully run (Jest not run). R242 is the checkpoint that clears it.
- R243 rejected before it ran: prompt did not name the matching design/ file. Rewritten as the R242 checkpoint prompt.
- R242 report flagged: 'task looks only partly done'. R244 read-only verification passed on reading but did not run tsc. R244 flagged again. R245 clears it with tsc.
- Jev: R240 ask 53%, run 44%; manager chose read-only run.
- Jev: R241 run 90%. Agreed.
- Jev: R242 run 80%. Agreed.
- Jev: R243 run 74%, ask 22%. Agreed.
- Jev: R244 run 50%, ask 44%. Agreed with run: flag must be cleared first; no owner dependency.
- Jev: R245 run 84%, ask 12%. Agreed with run.