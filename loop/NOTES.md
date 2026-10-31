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
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row, drops Longest, Total, Freezes; tap to /gym/streak is accepted deviation (wording to confirm).
- Training, Apply a streak freeze, Session history: app-only, English unchanged.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding. Shared Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Fallback title gymLog.freestyleTitle. No-plan keeps 'Rest' pill, title gymLog.restDayTitle, sub-line gym.nothingScheduledSub. Rest-day condition is is_rest_day || !template. GetToday clears is_rest_day only when a template is set (backend/internal/gym/schedule_pg.go:462-473).
- /gym/session has several entry points: TodayCard Start workout, log-session.tsx chooser tiles, empty-state action, 'It went as planned' pill when already logged. Do not describe it as one way only.
- Checkpoint rounds are read-only. Gap-file doc fixes get their own round, and that round must also run tsc once. One task per prompt.
- Log as planned (row 295) BUILT round 7 (not verified). Cardio planned minutes go to notes. If Isa says structure or calories are required, it goes back to DIFFERENT.

## Status
BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys and plurals, one-row streak strip, Goals restyle, plan.whyThisPlan, lastLoggedLabel, Macros kicker and title, load-failure t() calls, gym.loadingSessions, saved.tsx title, TodayCard padding, title, sub-line, rest and branch order, MuscleChart padding 16, row 295, /gym/session reachability wording.
- Row 113 TodayCard: DIFFERENT. Logged, rest and planned states differ. Null on schedule fetch failure with no error copy (gymSchedule.ts:38-40).
- Keys: en 169, es 171, fr 169. Recount before any removal.
- Last full run R312 green (65 suites, 824 tests). Since then: tsc exit 0, gym Jest 37 of 37.
- Round 8 checkpoint: result not in any report. Full tsc and Jest owed at next checkpoint.
- Round 9: gap-doc line 284 edit made. Report flagged as no tsc or Jest run. Same blocker came back twice, so the task is parked. See Blocked on Isa.

## Next
1. IN PROGRESS (round 9): EnergyBalanceCard.tsx hardcoded strings wrapped in t(); en, es, fr keys added together.
2. Logged-day sheet: design hides the log sheet once logged; app shows it from the + menu. Decide from design/ and build in its own round.
3. Gap doc ~280: 'not a reachable logging flow' heading conflicts with rows. Fix. Run tsc once in that round.
4. Gym log sheet row ~76: add cardio exception to BUILT note. Run tsc once in that round.
5. Gap doc ~296-298: 'No edit bar' vs docked number bar in session.tsx. Picker wording: Something else opens picker directly. Run tsc once in that round.
6. Gap doc: row 89 note into reason cell; row 113 app-only wording. Run tsc once in that round.
7. TodayCard logged state: sub-line 'Logged today · N kcal burned'; green wash pill; hardcode 'Logged' into t(); fix null comment at TodayCard.tsx:105 and header; index key ~162; pill, chip values, tap target, chevron.
8. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr together. Recount first. Voice and describeOutLoud removal waits on Isa (see Blocked).
9. Wrap hardcoded strings, one file per round: gym/freeze.tsx; StreakCounter.tsx; GymPatternsCard; saved.tsx; MuscleChart; session.tsx:537; gym.tsx (except the Training list, which waits on Isa); profile/index.tsx; (tabs)/index.tsx (add dashboard.streakLoadError to test list).
10. Read and wrap gymRange.ts, GymSessionButton, GymCalendar.
11. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~445.
12. Duplicates: SLOT_KEYS (tabs)/food.tsx and food/add.tsx, one shared constant. food.savedTitle vs addMenu.myDishes.
13. Full tsc and Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes': keys and plurals.
- Row 89: photo gallery or text list. Row 23 one-tap log. Row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs: all BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states, row 295 with a planned cardio exercise.
- Freestyle row 299: whether 'No' stays.
- Native es/fr review of all new strings.
- Group names: food.loadFailed vs foodLog; gym.loadFailed; profile.loadFailed.
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: keep or remove (only link to /gym/schedule, gym.tsx:153). Its hardcoded strings at gym.tsx:151-156 wait on this.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip /gym/streak deviation wording. Backend GetToday flag: leave as is?
- Confirm loop script writes loop/NOTES.md and loop/DECISIONS_LOG.md.
- PARKED, DO NOT RETRY: gap doc line 284 wording (partial completion goes through logGymSession, mutations.ts:193, /complete). Two rounds flagged the report for no tsc or Jest run. Retry only inside a round that runs tsc, after Isa confirms the wording.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type.
- Log sheet on failed fetch shows rest day (log-session.tsx:89). Behaviour change.
- Server: GetToday clears is_rest_day when a template exists.
- fr: 'Ajouter a {{slot}}'; plan.addTitle reads 'Add to' in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56.
- Recipe fibre saved as 0; detail num() rounds.
- Long-press meal delete not discoverable.
- Unused: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- 'Only some of it' (gap doc line ~191): check whether the row is stale, since the tile opens /gym/session in ticklist mode and that screen sends a completion rate.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes and check code points.
- Render tests have no i18n instance; lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep with LC_ALL=C /usr/bin/grep. Quote (tabs) paths. npx jest i18n finds no tests and exits 1.
- Reports can be stale. Check the file. Gap line numbers move; locate by content.
- Design gym markup: asset 7dc211f6; add menu: 71f71ac4. Decode in memory only.
- Checkpoint rounds are read-only.
- Logged-day pill: the design shows the 'It went as planned' control only in the log sheet, and only when not logged. The app shows the pill on a logged day from the + menu. Do not call it the logged-day control in any prompt.

## Round log
- R9: EnergyBalanceCard wrap chosen over gym/freeze.tsx and SLOT_KEYS dedupe. Reason: smallest unblocked code task that runs tsc and Jest. Jev rated the next action as ask at 68%, but a clean unblocked task exists, so run was kept.