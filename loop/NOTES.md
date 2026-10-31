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
- Saved foods sheet title is 'My dishes' (design wins). food.savedTitle: en 'My dishes', es 'Mis platos', fr 'Mes plats'. Row 89 stays DIFFERENT until the photo gallery is built.
- addMenu.savedFoods: zero uses. Removed in R293.

## Status
- Built (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, plurals, one-row streak strip (row 82); Goals restyle; plan.whyThisPlan; lastLoggedLabel; Macros kicker and title; load-failure t() at food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155; gym.loadingSessions; saved.tsx title at :76.
- R295 (doc only): row 82 and streak section updated. No checks run.
- Last full suite R283 green (65 suites, 824 tests). Not run since. Run at next checkpoint.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Flags
- R295 flagged: no type check or tests run. Clear with R296 (read-only: tsc, jest food gym hydrationErrorScreens, locale parse). Flag stays until R296 is green.

## Next
1. R296 (current, read-only): clear R295 flag.
2. Fix stale padding claim at gap file lines 399-400 (says '20 all round'; code is 12px 16px).
3. Trace add.tsx:30-70 slotKey. If it only yields breakfast, lunch, dinner, snack, remove addMenu.snapMeal, scanPackage, oneTapReadd from en, es, fr together. Keep es voice and describeOutLoud (blocked). Also trace add.tsx:67 before removal.
4. Move row 89 note (gap file ~line 90) into row 89 reason cell.
5. Re-grep gym.tsx literals :56, :102, :114, :123, 'My schedule', 'My workouts'. Fix gym.tsx:3-4 comment typo 'month month'.
6. Hardcoded: profile/index.tsx :62, :82-83; (tabs)/index.tsx :115, :150 (add dashboard.streakLoadError to test key list); EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15. Gym Training list gym.tsx:151-156 untranslated (app-only, see Blocked).
7. Read and wrap: gymRange.ts, TodayCard, MuscleChart, GymPatternsCard, GymSessionButton, GymCalendar.
8. Add sheet icons to design SVGs. Empty-list copy at src/app/(tabs)/food.tsx ~:445-447.
9. saved.tsx literals :61, :72, :78, :82, :92, :95-96, :106-108, :127, :144; stale comments :1, :5. (Line 83 is the TextField closing />, not a literal.)
10. Full Jest at next checkpoint.
11. If no rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros, gym tab title, plurals, streak strip, VoiceOver label, loading line, 'My dishes'.
- Native review es/fr: gender, NBSP, apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions, food.savedTitle.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile.loadFailed same text as gym.loadFailed (by request).
- Override es emptyMessage; remove es voice and describeOutLoud (needs approval).
- Training list: app-only row or removed.
- Streak footnote '23 sessions · 2 freezes': (a) gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count; (c) separate plural keys. Do not ask again without new information.
- Row 89: photo gallery with 'New dish' tile, or text list. Do not ask again without new information.
- Profile row 94 DIFFERENT: record Macros and Profile changes in gap file?

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork, row gap 12 vs 11.
- fr: 'Ajouter a {{slot}}'; gymLog.celebration.streak needs count key; plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale. 'Sessions' label /gym/streak:89; 'Total days' profile/index.tsx:135.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated (add.tsx:34 and (tabs)/food.tsx:84).
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable. Future-dated logs read 'Last logged today'.
- Duplicate streak copy: gym.dayStreak and gymLog.celebration.streak_*. food.savedTitle duplicates addMenu.myDishes.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes and check code points.
- Decode the design with node -e; use String.fromCharCode(39), not \u0027.
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- Grep with LC_ALL=C /usr/bin/grep. Quote every zsh path, including (tabs).
- lng is fixed to 'en' (src/lib/i18n/index.ts:41); es and fr never show.
- No test renders saved foods or the gym streak card. npx jest saved finds no tests.
- Handover summaries can be stale. Check the files.
- Gap file lines below 90 moved down one after R295; streak citations near 394 and 421.

## Loop notes
- Rejected prompts lacked the design/ file. Name it every time.
- Weak checks: hydration test accepts invented reasons; no plural test; no test renders the gym streak card or saved foods; no locale parity test.
- R294 key counts: report says en 167, fr 167, es 169; handover says en 168, fr 168, es 170. Recount with a script before any removal.
- Jev ranked the streak padding fix first at 87%. Chose the read-only flag clearance instead; the fix is next.
- Notes kept under 600 words; trim Parked first if over.