# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Celebration calories show a dash. Negative margin at add.tsx:68 accepted.
- Snack slot key 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- Meal delete uses design defaults. fr savedMeals keeps NBSP and U+2019. fr never shown.
- New keys go to en, es, fr together. Hardcoded string not in design: keep English, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row; drops Longest, Total, Freezes; tap to /gym/streak is an accepted deviation (wording to confirm).
- Training, Apply a streak freeze, Session history: app-only, English unchanged.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding (gym.tsx:130 pattern). Shared Card.tsx untouched.
- TodayCard: already_checked_in above is_rest_day. Fallback title gymLog.freestyleTitle. No-plan keeps 'Rest' pill, title gymLog.restDayTitle, sub-line gym.nothingScheduledSub. Final 'Nothing scheduled' branch and 'Set schedule' link removed (unreachable, read-only trace). Rest-day condition is is_rest_day || !template. Plan-branch wrapper removed to clear TS2366; content unchanged.
- Checkpoint rounds are read-only. A flag is cleared by a read-only round or the unfinished step, before build work.
- Every prompt names the design/ file, gap row and loop/design-match. One task per prompt. Gap-file doc fixes get their own round.

## Status
BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() calls; gym.loadingSessions; saved.tsx title; TodayCard padding, no-plan title and sub-line, is_rest_day strings via t(), branch reorder, freestyle fallback, unreachable branch removed; MuscleChart padding 16.
- Row 113 TodayCard: DIFFERENT. Renders null only on schedule fetch failure (src/lib/data/gymSchedule.ts:38-40), no error copy. Logged, rest and planned states still differ.
- Server: GetToday sets is_rest_day and already_checked_in together. No backend fix needed (Isa to confirm).
- Key counts: en 167, es 169, fr 167. Recount before any removal.
- Tests: last full run R312 green (65 suites, 824 tests). Since then tsc and jest gym green. No test renders TodayCard, saved foods or the streak card.

## Flags
- None. The earlier type-check flag was cleared: tsc exited 0 before the last gap-doc edits. Re-run tsc once in this round.

## Next
1. (current) Gap doc round 2: line 458 status to DIFFERENT; line 470 null means fetch failure; line 476 delete 'Session' vs 'Freestyle session'; lines 264-267 citation to TodayCard.tsx:168 and branch order; lines 399-400 comma (doc-only).
2. Gap doc round: row 89 note into reason cell; row 113 app-only wording check.
3. TodayCard logged state: sub-line 'Logged today · N kcal burned'; green wash pill; hardcoded 'Logged' and 'Logged today' into t().
4. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr together.
5. Wrap hardcoded strings, one file per round: gym.tsx (56, 102, 114, 123, 151-156, 'My schedule', 'My workouts'); profile/index.tsx (62, 82-83); (tabs)/index.tsx (115, 150; add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx 131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx 48; StreakCounter.tsx 15; TodayCard 110, 174; GymPatternsCard 85; saved.tsx 61-144; MuscleChart 132, 135, 149, 159.
6. gym.tsx lines 3-4 'month month' typo; gym.tsx 117 gap 12 to 11.
7. Read and wrap gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
8. session.tsx:537 hardcoded 'Nothing scheduled': compare with design.
9. TodayCard: chip index key (~168), header, pill, chip values, tap target, chevron.
10. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~445-447.
11. Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle vs addMenu.myDishes.
12. Full Jest at next checkpoint.
13. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes': keys, streak.totalGymDays as session count (recommended), plural keys.
- Row 89: photo gallery or text list.
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states and padding, MuscleChart padding.
- Native es/fr review: gender, NBSP, apostrophe, load-failure strings, 'Sport', streak plurals, gym.loadingSessions, food.savedTitle, gym.nothingScheduledSub, gymLog.freestyleTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: keep or remove. It is the only link to /gym/schedule (gym.tsx:153); removing it orphans that screen.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip '/gym/streak' accepted-deviation wording: confirm.
- Backend GetToday flag: leave as is?

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- TodayCard: header dot, min-height, gaps, pill and chip type. Returns null on load failure with no error copy.
- Server: GetToday clears is_rest_day when there is a template.
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
- Decode design with node -e; use String.fromCharCode(39).
- Render tests have no i18n instance; lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep with LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- npx jest i18n finds no tests and exits 1.
- Handover summaries and reports can be stale. Check the file. The handover NEXT of MuscleChart padding was stale (already BUILT).
- Gap line numbers move with inserts. Locate by content.
- Design gym markup: asset 7dc211f6; add menu: 71f71ac4.

## Loop notes
- One component or one doc change per prompt.
- Jev: flag and unfinished-step ordering rule stands.
- Round after the TodayCard doc edit: gap doc round 2 chosen (Jev 87% run, accepted). Reason: the gap file still has false claims that contradict row 113; it is doc-only with one tsc run and clears the state before build work.
- Gap doc round 1 completed with an unclear report: lines 458, 470, 476 and 264-267 still contain false claims. Handled in gap doc round 2.