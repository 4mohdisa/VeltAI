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

## Status
- BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() calls; gym.loadingSessions; saved.tsx title; TodayCard padding 16 on five uses.
- MuscleChart (2 uses): padding 16 BUILT (not verified). R307 done: padded={false} with style padding space.lg at MuscleChart.tsx ~114 and ~141.
- Row 113 TodayCard: DIFFERENT (header, chips, states).
- Tests: R297 checkpoint green (65 suites, 824 tests). R306 tsc 0, jest gym 37/37. R307 tsc 0, jest gym 37/37.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Flags
- None. R307 clean.

## Next
1. R308 (current): gap file lines 399-401 only. Add missing comma at end of 399. Line 401: record MuscleChart BUILT (not verified) at padding 16.
2. R309: gap file wording only. Line 458 'PARTIAL MATCH' to 'DIFFERENT'. Line 464 'four branches' to five with loading. Line 466 wording.
3. Trace add.tsx slotKey near :67. If unused addMenu keys (voice, describeOutLoud es; snapMeal, scanPackage, oneTapReadd all locales) are safe, remove from en, es, fr together.
4. Move row 89 note into the reason cell.
5. Hardcoded strings to wrap: gym.tsx :56, :102, :114, :123, :151-156, 'My schedule', 'My workouts'; profile/index.tsx :62, :82-83; (tabs)/index.tsx :115, :150 (add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15; TodayCard :110, :174; GymPatternsCard :85; saved.tsx :61-144.
6. Fix gym.tsx:3-4 'month month' typo. gym.tsx:117 gap 12 to 11.
7. Read and wrap: gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
8. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~:445-447.
9. Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle vs addMenu.myDishes.
10. Full Jest at next checkpoint.
11. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa
- Footnote '23 sessions · 2 freezes': (a) gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count (recommended); (c) separate plural keys. Do not ask again.
- Row 89: photo gallery or text list. Do not ask again.
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros, gym tab title, plurals, streak strip, VoiceOver label, loading line, 'My dishes', TodayCard padding, MuscleChart padding.
- Native es/fr review: gender, NBSP, apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions, food.savedTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip '/gym/streak' accepted-deviation wording: confirm.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- TodayCard: header dot, min-height, gaps, pill and chip type; returns null with no schedule; 'Rest' pill on Nothing scheduled (:176); chip key uses index (:156).
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

## Loop notes
- Prompts must name the design/ file every time.
- Prompts must ask for ONE component or ONE doc change. R307 was rejected for asking two (R307 was then redone as one component).
- Key counts R305: en 167, es 169, fr 167. Recount before any removal.
- Weak checks: hydration test accepts invented reasons; no plural test; no locale parity test.
- Jev overrules R300-R306 were all flag or unfinished-step ordering. Keep that rule.