# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults. es voice and describeOutLoud stay until Isa approves removal.
- fr savedMeals keeps non-breaking space and typographic apostrophe. fr never shown.
- New keys go to en, es, fr together (.json files in src/lib/i18n/locales/).
- Macros: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row; drop Longest, Total, Freezes; tap to /gym/streak kept (accepted deviation).
- Training, Apply a streak freeze, Session history: app-only. Keep, wrap later, English unchanged.
- Checkpoint rounds are read-only. Flagged reports are cleared by a read-only round before build work.
- Defaults: one-tap gym log on Summary card; Distance km; no food search chips; Goals extras kept.
- Every prompt names the design/ file, the gap row and loop/design-match.
- Saved foods sheet title is 'My dishes' (design wins). food.savedTitle: en 'My dishes', es 'Mis platos', fr 'Mes plats'. Row 89 status stays until the photo gallery is built.

## Status
- Built (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip; Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() at food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155; gym.loadingSessions; saved.tsx sheet title (R288).
- Last full checkpoint R283 green (tsc 0, 65 suites, 824 tests). Later changes not covered. Do not assume green.
- Snapshots show raw keys. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Flags
- R288 flagged as partly done. Row 89 note added as a table row with empty cells (may break the table). saved.tsx lines 1 and 5 have stale 'Saved foods' comments. On-screen text still says 'Search saved', 'No saved foods yet', 'Removed from saved.', 'Unsave'.

## Next
1. R289 (current): read-only check of R288 (tsc, hydrationErrorScreens, row 89 table, saved.tsx:76, key values). No edits.
2. Fix row 89 note format and saved.tsx comments only if the check finds a fault. One file per round.
3. Isa decides row 89: text list or photo gallery. Until then, no more saved.tsx strings.
4. Re-grep gym.tsx literals: :56, :102, :114, :123, 'My schedule', 'My workouts'.
5. profile/index.tsx :62, :82-83; (tabs)/index.tsx :150 and :115 (add dashboard.streakLoadError to test key list).
6. EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15.
7. Read and wrap: gymRange.ts, TodayCard, MuscleChart, GymPatternsCard, GymSessionButton, GymCalendar.
8. Add sheet icons to design SVGs. food.tsx ~:445-447 empty-list copy.
9. Gap file: row 82, heading ~:414, ranges ~:393 and ~:420 (now two lines out).
10. Full Jest at next checkpoint.
11. Remove es voice and describeOutLoud only after Isa approves and search confirms no use.
12. If no rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros, gym tab title, plurals, streak strip, VoiceOver label, loading line, 'My dishes'.
- Native review es/fr: gender, NBSP, apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions, food.savedTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage; remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Streak footnote: (a) add gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count; (c) separate plural keys.
- Record Macros and Profile changes in gap file? (Profile row 94 DIFFERENT.)
- Row 89: photo gallery with 'New dish' tile, or keep text list?
- food.savedTitle and addMenu.myDishes share text in all three locales. Update both if wording changes. addMenu.savedFoods looks unused.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- fr: 'Ajouter a {{slot}}'; gymLog.celebration.streak needs count key; plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale. 'Sessions' label /gym/streak:89; 'Total days' profile/index.tsx:135.
- Footnote session period (design 23 sessions; app period used).
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable. Future-dated logs read 'Last logged today'.
- Chart title; Summary detail views; 'Calories today' vs 'Where the calories came from'.
- Duplicate streak copy: gym.dayStreak and gymLog.celebration.streak_*.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes; check code points.
- Decode the design with node -e; use String.fromCharCode(39), not \u0027.
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- Plurals use count. Grep: LC_ALL=C /usr/bin/grep. Quote zsh paths.
- Handover summaries can be stale. Check the files.
- lng fixed to 'en' (src/lib/i18n/index.ts:41); es and fr never show.
- fr apostrophes mixed. saved.tsx has no dedicated render test.

## Loop notes
- R284, R286, R287 flags cleared by read-only checks. R287: tsc 0; fallback suites 5 suites, 133 tests passing.
- Rejected prompts lacked the design/ file. Name it every time.
- Weak checks: hydration test accepts invented reasons; literal check misses template strings and single quotes; no plural test.
- R288: Jev asked (66%) on row 89. Kept run: the title is a copy change the design settles.