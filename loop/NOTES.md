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
- New keys go to en, es, fr together (src/lib/i18n/locales/*.json).
- Macros: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row; drop Longest, Total, Freezes; tap to /gym/streak kept (accepted deviation).
- Training, Apply a streak freeze, Session history: app-only. Keep, wrap later, English unchanged.
- Checkpoint rounds are read-only. Flagged reports are cleared by a read-only round before build work.
- Defaults: one-tap gym log on Summary card; Distance km; no food search chips; Goals extras kept.
- Every prompt names the design/ file, the gap row and loop/design-match.
- Saved foods sheet title 'My dishes' (food.savedTitle). Row 89 stays DIFFERENT until the photo gallery is built.
- addMenu.savedFoods: zero uses. Removed in R293.
- Card: padded={false} with style padding is the existing pattern (gym.tsx:130). Shared Card.tsx stays untouched.
- TodayCard: all five states padded 16 (R302). Still DIFFERENT on other points.

## Status
- Built (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() at food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155; gym.loadingSessions; saved.tsx title at :76.
- TodayCard padding 16 on five Card uses (R302, built not verified).
- R301 read-only: tsc exit 0; jest gym 6 suites, 37 tests.
- R297 checkpoint green: tsc exit 0; full jest 65 suites, 824 tests, 4 snapshots.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).
- Gap file: streak strip and calendar card match design. TodayCard differs on header, chips, states. MuscleChart (2 uses) differs: design 16.

## Flags
- R302 flagged (tests not run; no TodayCard test exists). Clearing with R303 read-only round before build work.

## Next
1. R303 (current): read-only. tsc and gym jest; confirm TodayCard padding; report row 113 text. No edits.
2. Row 113 status to DIFFERENT (all five TodayCard states differ). Gap file only.
3. MuscleChart two Card uses to padding 16, same method. Note any Card state with no design counterpart.
4. Trace add.tsx:30-70 slotKey and add.tsx:67. If the five unused addMenu keys are safe, remove from en, es, fr together. Keep es voice and describeOutLoud.
5. Move row 89 note (gap file, line ~90) into row 89 reason cell.
6. Re-grep gym.tsx literals :56, :102, :114, :123, 'My schedule', 'My workouts'. Fix gym.tsx:3-4 comment typo 'month month'.
7. Hardcoded: profile/index.tsx :62, :82-83; (tabs)/index.tsx :115, :150 (add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15. TodayCard 'Rest day' :110, 'Nothing scheduled' :174.
8. Read and wrap: gymRange.ts, GymPatternsCard, GymSessionButton, GymCalendar.
9. Add sheet icons to design SVGs. Empty-list copy at src/app/(tabs)/food.tsx ~:445-447.
10. saved.tsx literals :61, :72, :78, :82, :92, :95-96, :106-108, :127, :144; stale comments :1, :5.
11. Full Jest at next checkpoint.
12. If no rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa
- Streak footnote '23 sessions · 2 freezes': (a) gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count (recommended); (c) separate plural keys. Do not ask again without new information.
- Row 89: photo gallery with 'New dish' tile, or text list. Do not ask again without new information.
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros, gym tab title, plurals, streak strip, VoiceOver label, loading line, 'My dishes', TodayCard padding.
- Native review es/fr: gender, NBSP, apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions, food.savedTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage; remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?
- Streak strip '/gym/streak tap' accepted-deviation wording: confirm.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- TodayCard: header dot 12 vs 11, header min-height, gaps, pill and chip type; returns null with no schedule (design always shows Rest day).
- fr: 'Ajouter a {{slot}}'; gymLog.celebration.streak needs count key; plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale. 'Sessions' label /gym/streak:89; 'Total days' profile/index.tsx:135.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated (add.tsx:34 and (tabs)/food.tsx:84); inter-card gap 12 vs 14.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable. Future-dated logs read 'Last logged today'.
- Duplicate copy: gym.dayStreak and gymLog.celebration.streak_*. food.savedTitle duplicates addMenu.myDishes.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes and check code points.
- Decode the design with node -e; use String.fromCharCode(39), not \u0027.
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- Grep with LC_ALL=C /usr/bin/grep. Quote every zsh path, including (tabs).
- lng is fixed to 'en' (src/lib/i18n/index.ts:41); es and fr never show.
- No test renders saved foods or the gym streak card. No TodayCard test file exists.
- Handover summaries can be stale. Check the files.
- Gap file line numbers below 90 move with each insert; TodayCard prose now near 400 and 465.

## Loop notes
- Rejected prompts lacked the design/ file. Name it every time.
- Weak checks: hydration test accepts invented reasons; no plural test; no test renders the gym streak card, TodayCard or saved foods; no locale parity test.
- Key counts (last handover): en 168, es 170, fr 168. Recount with a script before any removal.
- Keys: fr U+00A0 4, U+2019 22; en and es 0.
- Jev 90% ask on R300 overruled: flagged report had to be cleared first; padding precedent at gym.tsx:130.
- Jev 66% ask on R302 overruled: R301 cleared the flag; padding precedent exists.
- Jev 97% run on MuscleChart overruled (R303): R302 flagged, so the read-only clearing round comes first.
- Notes kept under 600 words; trim Parked first if over.