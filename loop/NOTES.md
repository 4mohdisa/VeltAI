# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Celebration calories show a dash. Negative margin at add.tsx:68 accepted.
- Snack slot key 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- Meal delete uses design defaults. es voice and describeOutLoud stay until Isa approves removal.
- fr savedMeals keeps NBSP and U+2019. fr never shown.
- New keys go to en, es, fr together. Hardcoded string not in design: keep English, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row, drops Longest, Total, Freezes; tap to /gym/streak is an accepted deviation.
- Training, Apply a streak freeze, Session history: app-only. Keep, English unchanged.
- Checkpoint rounds are read-only. A flag is cleared by a read-only round or by the unfinished step, before build work.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding (gym.tsx:130 pattern). Shared Card.tsx untouched.
- Every prompt names the design/ file, the gap row and loop/design-match. One task per prompt. Gap-file doc fixes are their own round.
- TodayCard no-plan: keep 'Rest' pill; title gymLog.restDayTitle; sub-line gym.nothingScheduledSub.
- TodayCard branch order: already_checked_in above is_rest_day (server sets both flags). Fallback title gymLog.freestyleTitle.

## Status
- BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() calls; gym.loadingSessions; saved.tsx title; TodayCard padding 16, no-plan title and sub-line, is_rest_day strings via t(), branch reorder and freestyle fallback (latest report); MuscleChart padding 16.
- Row 113 TodayCard: DIFFERENT. All five states still differ.
- Server: backend/internal/gym/schedule_pg.go:459-485. IsRestDay starts true and is cleared only when a template is found. AlreadyCheckedIn comes from any gym_sessions row for today.
- Gap doc: R308 and R311 corrections done. Line 458 heading still says PARTIAL MATCH (should be DIFFERENT).
- Key counts after latest report: en 169, es 171, fr 169. Recount before any removal.
- Tests: last full run R312 green (65 suites, 824 tests). Since then tsc and jest gym are green. No test renders TodayCard, saved foods or the streak card.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Flags
- None. Latest report is DONE.

## Next
1. (current) Read-only trace, no edits: does useToday or the Go handler change GetToday's flags? Is the final 'Nothing scheduled' branch in TodayCard (~187-198) reachable? Record the result.
2. Gap doc line 458 heading to DIFFERENT (doc-only).
3. Gap doc wording, one round each: line 464 comma; line 466 'matching the design' is loose; lines 468-475 rest-day copy; row 113 'app-only' wording; row 89 note into reason cell.
4. Trace add.tsx slotKey (~67). If unused addMenu keys are safe (voice, describeOutLoud in es; snapMeal, scanPackage, oneTapReadd in all), remove from en, es, fr together.
5. Logged state in TodayCard: sub-line 'Logged today · N kcal burned' per design; green wash pill; hardcoded 'Logged' and 'Logged today'.
6. Wrap hardcoded strings, one file per round: gym.tsx (56, 102, 114, 123, 151-156, 'My schedule', 'My workouts'); profile/index.tsx (62, 82-83); (tabs)/index.tsx (115, 150; add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx 131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx 48; StreakCounter.tsx 15; TodayCard 110, 174; GymPatternsCard 85; saved.tsx 61-144; MuscleChart 132, 135, 149, 159.
7. gym.tsx lines 3-4 'month month' typo; gym.tsx 117 gap 12 to 11.
8. Read and wrap gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
9. session.tsx:537 hardcoded 'Nothing scheduled': compare with design.
10. TodayCard: chip index key (~158, ~164), header, pill, chip values, null with no schedule (~107), 'Set schedule' link (ask Isa only if step 1 says reachable).
11. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~445-447.
12. Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle vs addMenu.myDishes.
13. Full Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes': keys, streak.totalGymDays as session count (recommended), plural keys.
- Row 89: photo gallery or text list.
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states and padding, MuscleChart padding.
- Native es/fr review: gender, NBSP, apostrophe, load-failure strings, 'Sport', streak plurals, gym.loadingSessions, food.savedTitle, gym.nothingScheduledSub, gymLog.freestyleTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip '/gym/streak' accepted-deviation wording: confirm.
- TodayCard 'Set schedule' link: keep app-only or remove (only if step 1 shows the branch is reachable).

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- TodayCard: header dot, min-height, gaps, pill and chip type; 'Set schedule' link (app-only). Server: GetToday sets both is_rest_day and already_checked_in; a backend fix to clear the rest flag is parked.
- fr: 'Ajouter a {{slot}}'; gymLog.celebration.streak needs count key; plan.addTitle reads 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale. 'Sessions' label /gym/streak:89; 'Total days' profile/index.tsx:135.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; inter-card gap 12 vs 14.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable. Future-dated logs read 'Last logged today'.
- Duplicate copy: gym.dayStreak and gymLog.celebration.streak_*.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes and check code points.
- Decode the design with node -e; use String.fromCharCode(39), not \u0027.
- Render tests have no i18n instance. lng is fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep with LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- npx jest i18n finds no tests and exits 1.
- Handover summaries and reports can be stale or contradict themselves. Check the file.
- Gap line numbers move with inserts.

## Loop notes
- Every prompt names the design/ file, the gap row and loop/design-match.
- One component or one doc change per prompt.
- Jev: flag and unfinished-step ordering rule stands. Keep it.