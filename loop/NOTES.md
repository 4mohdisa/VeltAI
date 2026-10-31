# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- es voice and describeOutLoud stay until Isa approves removal. es addedToMeal and mealDeleted avoid gender. es goals.setByLume feminine.
- fr savedMeals keeps U+00A0 and U+2019 (pending native review). fr is never shown (src/lib/i18n/index.ts:41).
- New keys go to en, es, fr together, in src/lib/i18n/locales/.
- Macros screen: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording identical and record it.
- Flagged reports are cleared by a read-only round before new build work. Checkpoint rounds are read-only.
- Petit-dejeuner dropped. lastLoggedLabel counts calendar days.
- No new test suites. 11pm-to-9am case checked on device by Isa.
- Load-failure keys per screen: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.tsx may use the react-i18next hook. Literals are wrapped, English unchanged.
- hydrationErrorScreens key list derives from LoadFailedNotice callers. String-literal check stays.
- gym.dayStreak and gym.streakDetailLabel are _one/_other in en, es, fr. Pass count, never current.
- Streak strip (R277): follow design layout, one row, footnote from streakSub. Drop Longest, Total, Freezes. Keep the tap to /gym/streak as an accepted deviation.
- Training, Apply a streak freeze, Session history: app-only, no design match. Keep, wrap in t() later, English unchanged.

## Built (not verified)
- Food: NumberEntryBar, Add sheet, quick add toast, MEAL caption, detent, 52pt pill, compact Meal control, recents macros, recipe fibre sum, slot heading, labels, toast, deleteMealHint, delete dialog.
- Gym: chooser, duration, CelebrationCard (row 17 steps 1-2), streak and summary keys, plural split, gym.tsx literals monthLoadFailed, title, streakDetailLabel, dayStreak.
- Goals restyle. plan.whyThisPlan. lastLoggedLabel. settings.scanAccuracy (es).
- Macros: nutrition.tsx kicker and title, t() at :79, :86, :89, :95, macrosLoadFailed, caloriesTodayLabel. Snapshot updated.
- Load-failure t(): food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155.
- Gap count before R269: 23 DIFFERENT, 15 PARTIAL, 3 BUILT. Profile row DIFFERENT. Macros has no gap row.

## Verification
- Last full Jest run R257: tsc 0, 65 suites, 824 tests. Stale. Run at next checkpoint.
- Since then: tsc 0 (R276, R278); gym 6 suites, 37 tests; hydrationErrorScreens 10/10.
- Keys: en 166, fr 166, es 168.
- Plural forms checked by a one-off Node script only.
- Snapshots show raw keys. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R279 (this round): rebuild the gym streak strip in src/app/(tabs)/gym.tsx lines 111-138 to the design (design/Lume App.html), remove Longest, Total, Freezes (lines 127-131). Update DESIGN_GAP_ANALYSIS.md rows at about :393 and :420 to BUILT in the same round.
2. Wrap the remaining gym.tsx literals still in use: 'Loading sessions...' (54), 'Training' (163), 'Apply a streak freeze' (167), 'Session history' (168). One row per round. 'My schedule' (165) and 'My workouts' (166) already match design wording; wrap them too.
3. food/saved.tsx hardcoded strings: toasts, sheet title, placeholder, labels, empty states, swipe text, rows.
4. profile/index.tsx :62, :82-83; (tabs)/index.tsx :150; add dashboard.streakLoadError to the test key list.
5. EnergyBalanceCard.tsx :131; gym/freeze.tsx :48; StreakCounter.tsx :15.
6. Read and wrap text in gymRange.ts (monthSummary, monthTitle at lines 57 and 144), TodayCard, MuscleChart, GymPatternsCard, GymSessionButton, GymCalendar. Not yet read.
7. Add sheet icons to design SVGs. food.tsx :445-447 empty-list copy.
8. Full Jest run at next checkpoint.
9. Remaining gap rows, most cleared first. If none remain: stop with 'only owner decisions remain'.
10. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame, footnote.
- fr: 'Ajouter a {{slot}}' reads oddly; gymLog.celebration.streak needs a count key. plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:74 uses device locale, not i18n language. Matters only once es or fr show.
- Gym session-count period in streak footnote: design sample only shows '23 sessions'. Using app's own period. Needs a decision before es or fr copy is final.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable.
- Future-dated saved-meal logs read 'Last logged today'.
- Re-run 'breakfast' search on decoded assets. Check fr U+00A0.
- Chart title; Summary detail views; 'Calories today' vs 'Where the calories came from'.
- No per-meal petit-dejeuner strings in fr.json.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros kicker and title, gym tab title, plurals.
- Native review es/fr: gender, U+00A0, U+2019, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport'.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; whether profile reuses gym wording.
- Record Macros and Profile changes in the gap file?
- Remove es voice and describeOutLoud; override es emptyMessage.
- Whether Training list (gym.tsx:163) stays as an app-only row or is removed.
- Training list (gym.tsx:163): stays or removed? Needed before its key is written.

## Gotchas
- The edit tool writes plain space for U+00A0 and plain apostrophe for U+2019. Use node escapes and check code points.
- No /tmp. Decode the design in memory. Old decoded files remain in /tmp/lume-design, do not rely on them.
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- fr apostrophes are mixed: plain in foodLog and food, U+2019 elsewhere.
- Plurals use count, not current.
- Handover summaries can be stale. Check them here.
- Quote zsh paths. Grep: LC_ALL=C /usr/bin/grep.
- Avoid \u0027 inside node -e; use String.fromCharCode(39).
- src/lib/i18n/index.ts:41 fixes lng to 'en'; es and fr never show.

## Loop notes
- R275 flagged as partly done (gym literals). R276 read-only, reported 9 literals. R278 read-only clarified the strip and cleared the flag.
- R276 nine literals in gym.tsx: 54, 127, 128, 131, 163, 165, 166, 167, 168. Lines 165-166 match design wording; 163, 167, 168 are app-only.
- Weak checks: hydration test accepts invented es/fr reasons; literal check misses message={"..."}, single quotes, template strings; no plural test; no hydration key-count check.
- Stale gap refs: DESIGN_GAP_ANALYSIS.md :393, :420. Gym list now ends at line 170.
- Duplicate streak copy: gym.dayStreak and gymLog.celebration.streak_*.
- No Saved meals row in the gap file. Closest is Saved foods (~line 1447).
- Rejected prompts lacked the file, row or branch. Name all three every time. R279 rejection was: missing matching design/ file. Fixed by naming design/Lume App.html.

## Handover
- Last handover summary still says gym.tsx:56, :102, :114, :123 are hardcoded. R276 found different line numbers (54, 127-131, 163-168). Trust R276 for gym.tsx.
- Last handover is stale on Macros-screen and Profile status; check the gap file before relying on it.