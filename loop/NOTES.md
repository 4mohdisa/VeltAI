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
- New keys go to en, es, fr together (src/lib/i18n/locales/*.json).
- Hardcoded string not in design: keep English, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row, drops Longest, Total, Freezes; tap to /gym/streak is an accepted deviation.
- Training, Apply a streak freeze, Session history: app-only. Keep, English unchanged.
- Checkpoint rounds are read-only. A flagged report is cleared by a read-only round or by the unfinished step, before build work.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding is the existing pattern (gym.tsx:130). Shared Card.tsx stays untouched.
- Every prompt names the design/ file, the gap row and loop/design-match.
- One task per prompt. Gap-file documentation fixes are their own round, never bundled with a component change.
- TodayCard no-plan state: keep the 'Rest' pill (design shows it in this state). Title uses gymLog.restDayTitle; sub-line uses gym.nothingScheduledSub (R313).

## Status
- BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() calls; gym.loadingSessions; saved.tsx title; TodayCard padding 16 on five uses.
- MuscleChart (2 uses): padding 16 BUILT (not verified). R307 done: padded={false} with style padding space.lg at MuscleChart.tsx ~114 and ~141. R308 gap lines 399-401 corrected.
- R311 doc wording done: gap line 458 reads DIFFERENT; line 464 reads five mutually exclusive branches including loading; line 466 says loading and nothing-scheduled differ from the design. Line 298 still says 'four branches' (not named, left alone).
- Row 113 TodayCard: DIFFERENT (header, chips, states).
- R313 (BUILT, not verified): TodayCard no-plan title changed to gymLog.restDayTitle; sub-line changed to gym.nothingScheduledSub; key added to en, es, fr. es and fr text are provisional and need native review.
- Tests: R297 checkpoint green (65 suites, 824 tests). R306 tsc 0, jest gym 37/37. R307 tsc 0, jest gym 37/37. R308 doc-only, no tests run. R309 read-only: tsc 0. R310 read-only: tsc 0, jest gym 6 suites / 37 tests passed. R311 doc-only: tsc 0, Jest not run (flagged). R312 read-only checkpoint: gap lines 458, 464, 466 verified; tsc 0; full app Jest 65/65 suites, 824/824 tests, 4/4 snapshots. R313: tsc 0, jest gym 6/6 suites, 37/37 tests. No test renders TodayCard, so the new state is unexercised.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Flags
- R313 flagged by the loop: DONE says the is_rest_day sub-line was changed, but NEXT says it still reads 'Nothing scheduled today'. Treated as an unfinished step. R314 is a read-only check to clear it before build work.

## Next
1. R314 (current): read-only check of TodayCard no-plan branches, including is_rest_day. Confirm the rendered title and sub-line, grep for the keys, check en/es/fr key presence and counts, run tsc once. No edits. Clears the R313 flag if the branch is correct; if not, the fix becomes the next build round.
2. If R314 shows the is_rest_day branch still wrong: fix that one branch only (TodayCard.tsx), using gym.nothingScheduledSub. Run tsc once and jest gym once.
3. Gap file line 458 marker: heading says PARTIAL MATCH, should match row 113 DIFFERENT (doc-only round).
4. Gap file line 464 comma wording (doc-only round, after step 3).
5. Trace add.tsx slotKey near :67. If unused addMenu keys (voice, describeOutLoud es; snapMeal, scanPackage, oneTapReadd all locales) are safe, remove from en, es, fr together.
6. Move row 89 note into the reason cell.
7. Hardcoded strings to wrap: gym.tsx :56, :102, :114, :123, :151-156, 'My schedule', 'My workouts'; profile/index.tsx :62, :82-83; (tabs)/index.tsx :115, :150 (add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15; TodayCard :110, :174; GymPatternsCard :85; saved.tsx :61-144; MuscleChart.tsx :132, :135, :149, :159.
8. Fix gym.tsx:3-4 'month month' typo. gym.tsx:117 gap 12 to 11.
9. Read and wrap: gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
10. TodayCard code: chip key uses index (:156); header, pill, chip values differ; returns null with no schedule; set schedule link is app-only (confirm first).
11. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~:445-447.
12. Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle vs addMenu.myDishes.
13. Full Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa
- Footnote '23 sessions · 2 freezes': (a) gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count (recommended); (c) separate plural keys. Do not ask again.
- Row 89: photo gallery or text list. Do not ask again.
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros, gym tab title, plurals, streak strip, VoiceOver label, loading line, 'My dishes', TodayCard padding and no-plan state, MuscleChart padding.
- Native es/fr review: gender, NBSP, apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions, food.savedTitle, gym.nothingScheduledSub (es: 'Nada programado — añade lo que hiciste'; fr: 'Rien de prévu — ajoutez ce que vous avez fait').
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip '/gym/streak' accepted-deviation wording: confirm.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- TodayCard: header dot, min-height, gaps, pill and chip type; returns null with no schedule; chip key uses index (:156); 'Set schedule' link (app-only, design has none).
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
- No test renders saved foods, the gym streak card or TodayCard. npx jest i18n finds no tests and exits 1.
- Handover summaries can be stale. Check the files. Gap line numbers move with inserts.
- A report can contradict itself (R313: DONE vs NEXT on the sub-line). Check the file, not the report.
- R312 console blocks (5) not inspected. Check if a round needs it.

## Loop notes
- Prompts must name the design/ file every time.
- Prompts must ask for ONE component or ONE doc change. R307 was rejected for asking two.
- Key counts after R313 (expected): en 168, es 170, fr 168. Recount before any removal.
- Weak checks: hydration test accepts invented reasons; no plural test; no locale parity test; no TodayCard render test.
- Jev overrules R300-R306 and R309 were all flag or unfinished-step ordering. Keep that rule.
- R312 cleared the R311 flag. R313 flagged; R314 is read-only and goes first.