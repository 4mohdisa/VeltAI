# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative. Design decides verdicts unless Isa's decision says otherwise.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Celebration calories show a dash. Negative margin at add.tsx:68 accepted.
- Snack slot key 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- Meal delete uses design defaults. fr savedMeals keeps NBSP and U+2019. fr never shown.
- New keys go to en, es, fr together. Hardcoded string not in design: keep English, record it.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row, drops Longest, Total, Freezes; tap to /gym/streak is accepted deviation (wording to confirm).
- Training, Apply a streak freeze, Session history: app-only, English unchanged.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding (gym.tsx:130 pattern). Shared Card.tsx untouched.
- TodayCard: already_checked_in checked before is_rest_day. Fallback title gymLog.freestyleTitle. No-plan keeps 'Rest' pill, title gymLog.restDayTitle, sub-line gym.nothingScheduledSub. Unreachable 'Nothing scheduled' branch and 'Set schedule' link removed. Rest-day condition is is_rest_day || !template. Final branch deleted; GetToday clears is_rest_day only when a template is set (backend/internal/gym/schedule_pg.go:462-473).
- /gym/session has several entry points: TodayCard Start workout, log-session.tsx chooser tiles, empty-state action, and the 'It went as planned' pill when already logged. Do not describe it as reachable one way only.
- Checkpoint rounds are read-only. Gap-file doc fixes get their own round. One task per prompt.
- Log as planned (gap row 295) is BUILT as of round 7 (not verified). Cardio planned minutes go to notes via inputFor. Isa's device run decides whether this stands. If he says structure or calories are required, it goes back to DIFFERENT.

## Status
BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip, Goals restyle, plan.whyThisPlan, lastLoggedLabel, Macros kicker and title, load-failure t() calls, gym.loadingSessions, saved.tsx title, TodayCard padding, title, sub-line, rest and branch order, MuscleChart padding 16 (both Cards), gap doc rounds 1-5, row 295 Log as planned (round 7).
- Row 113 TodayCard: DIFFERENT. Logged, rest and planned states still differ. Renders null on schedule fetch failure with no error copy (gymSchedule.ts:38-40).
- Key counts: en 169, es 171, fr 169. Recount before any removal.
- Last full run R312 green (65 suites, 824 tests). Since then: tsc green (round 7), gym Jest 6 of 6 suites, 37 of 37 tests on real paths. Full suite is due at the next checkpoint.

## Flags
- None open.

## Next
1. (current, doc only) Correct /gym/session reachability claims in DESIGN_GAP_ANALYSIS.md, located by content near lines 260-291.
2. Gym log sheet row (~76): add the cardio exception (planned minutes go to notes) to the BUILT note, or correct the status.
3. Logged-day pill: design hides the log sheet once the day is logged. App shows it from the + menu, where the pill opens /gym/session and does not commit. Decide the fix from design/ and build it.
4. Gap doc: Freestyle row (~299) verdict from evidence; 'No edit bar' (~296) vs docked number bar in session.tsx; picker wording (~298) should say Something else opens the picker directly. Check heading ~280 and claim ~284.
5. Gap doc: row 89 note into reason cell; row 113 app-only wording.
6. TodayCard logged state: sub-line 'Logged today · N kcal burned'; green wash pill; hardcoded 'Logged' and 'Logged today' into t(); fix null comment at TodayCard.tsx:105 and header; chip key ~162 (index key); pill, chip values, tap target, chevron.
7. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr together.
8. Wrap hardcoded strings, one file per round: gym.tsx (56, 102, 114, 123, 151-156, 'My schedule', 'My workouts', 'month month' typo at 3-4, gap 12 to 11 at 117); profile/index.tsx (62, 82-83); (tabs)/index.tsx (115, 150; add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx 131 (update test at :62); gym/freeze.tsx 48; StreakCounter.tsx 15; GymPatternsCard 85; saved.tsx 61-144; MuscleChart 132, 135, 149, 159; session.tsx:537.
9. Read and wrap gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
10. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~445-447.
11. Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle vs addMenu.myDishes.
12. Full Jest at next checkpoint.
13. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes': keys, streak.totalGymDays as session count (recommended), plurals.
- Row 89: photo gallery or text list. Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states and padding, MuscleChart padding, row 295 'It went as planned' with a planned cardio exercise (do minutes show in history, and are calories missing? Does minutes-as-notes count as BUILT?).
- Native es/fr review: gender, NBSP, apostrophe, load-failure strings, 'Sport', streak plurals, gym.loadingSessions, food.savedTitle, gym.nothingScheduledSub, gymLog.freestyleTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text (by request).
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: keep or remove (only link to /gym/schedule, gym.tsx:153).
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip /gym/streak deviation wording. Backend GetToday flag: leave as is?
- Stray loop/NOTES.md and loop/DECISIONS_LOG.md: confirm loop script writes them.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork, row gap 12 vs 11.
- TodayCard: header dot, min-height, gaps, pill and chip type.
- Log sheet on failed fetch shows rest day (log-session.tsx:89). Behaviour change.
- Server: GetToday clears is_rest_day when a template exists.
- fr: 'Ajouter a {{slot}}'; gymLog.celebration.streak needs count key; plan.addTitle reads 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line uses device locale. 'Sessions' at /gym/streak:89; 'Total days' at profile:135.
- Code: mixHex; goals copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; gap 12 vs 14.
- Recipe fibre saved as 0; saved foods drop fibre; detail num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one. Future-dated logs read 'Last logged today'. Duplicate copy: gym.dayStreak and gymLog.celebration.streak_*.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes and check code points.
- Render tests have no i18n instance; lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep with LC_ALL=C /usr/bin/grep. Quote (tabs) and src/app/(tabs) paths. npx jest i18n finds no tests and exits 1. Gym tests live in src/__tests__ (not src/components/gym). No test is known to render TodayCard.
- Reports and handovers can be stale. Check the file. Gap line numbers move; locate by content.
- Design gym markup: asset 7dc211f6; add menu: 71f71ac4. Decode in memory only.
- Repeat the no-git rule in every prompt.
- Round 7: TodayCard and log-session edits passed tsc and gym Jest. Gap doc reachability fix is text-only.