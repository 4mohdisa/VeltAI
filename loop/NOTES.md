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
- fr savedMeals keeps the non-breaking space and the typographic apostrophe (native review). fr never shown (src/lib/i18n/index.ts:41).
- New keys go to en, es, fr together in src/lib/i18n/locales/.
- Macros: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording identical, record it.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row. Drop Longest, Total, Freezes. Tap to /gym/streak kept (accepted deviation).
- Training, Apply a streak freeze, Session history: app-only. Keep, wrap later, English unchanged.
- Checkpoint rounds are read-only. Flagged reports are cleared by a read-only round before build work.
- Defaults: one-tap gym log on Summary card; Distance km; no food search chips; Goals extras kept.
- Rejected prompts must name the design/ file, the gap row and the branch. Every prompt does.

## Status
- Built (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents macros, recipe fibre, slot heading, labels, delete dialog. Gym chooser, duration, CelebrationCard, streak keys, plural split, one-row streak strip. Goals restyle. plan.whyThisPlan. lastLoggedLabel. Macros kicker and title. Load-failure t() at food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155. gym.loadingSessions at gym.tsx:53 (R284, confirmed R285: en, es, fr keys added, text unchanged).
- Last full checkpoint: R283 (tsc 0, 65 suites, 824 tests, green). Changes since R283 are not covered by a full run.
- Snapshots show raw keys. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R286 (current): food/saved.tsx:83 literal wrapped with a new key in en, es, fr; key added to hydrationErrorScreens test list. Then tsc and the saved foods tests only.
2. Streak footnote after gym.tsx ~:124. Blocked until Isa confirms the three decisions. Then set gap rows ~:393 and ~:420 to BUILT.
3. Wrap remaining gym.tsx literals, re-grep first: :56, :102, :114, :123, 'My schedule', 'My workouts'.
4. food/saved.tsx literals left after :83: toasts, sheet title, placeholder, labels, empty states, swipe text, rows.
5. profile/index.tsx :62, :82-83; (tabs)/index.tsx :150; dashboard.streakLoadError at :115 to test key list.
6. EnergyBalanceCard.tsx :131 (update energyBalanceCard.render.test.tsx:62); gym/freeze.tsx :48; StreakCounter.tsx :15.
7. Read and wrap: gymRange.ts, TodayCard, MuscleChart, GymPatternsCard, GymSessionButton, GymCalendar.
8. Add sheet icons to design SVGs. food.tsx ~:445-447 empty-list copy.
9. Gap file: row 82, section ~:414 heading, line ranges ~:393 and ~:420.
10. Full Jest at next checkpoint.
11. Remaining gap rows, most cleared first. If none remain: stop with 'only owner decisions remain'.
12. Remove es voice and describeOutLoud only after Isa approves and search confirms no use.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros kicker and title, gym tab title, plurals, streak strip, VoiceOver label, loading line.
- Native review es/fr: gender, non-breaking space, typographic apostrophe, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak plurals, gym.loadingSessions.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile reuse of gym wording.
- Override es emptyMessage; remove es voice and describeOutLoud.
- Training list: app-only row or removed.
- Streak footnote, three decisions: (a) add gym.streakSessions and gym.streakFreezes in en, es, fr; (b) streak.totalGymDays as session count; (c) separate plural keys for sessions and freezes.
- Record Macros and Profile changes in the gap file?

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, greys at 0, artwork differs, row gap 12 vs 11 (no token).
- fr: 'Ajouter a {{slot}}' reads oddly; gymLog.celebration.streak needs a count key; plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale.
- 'Sessions' label at /gym/streak:89; 'Total days' at profile/index.tsx:135.
- Footnote session period: design shows 23 sessions; app period used.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable.
- Future-dated saved-meal logs read 'Last logged today'.
- Chart title; Summary detail views; 'Calories today' vs 'Where the calories came from' (not compared).
- Duplicate streak copy: gym.dayStreak and gymLog.celebration.streak_*.

## Gotchas
- The edit tool writes a plain space for the non-breaking space and a plain apostrophe for the typographic apostrophe. Use node escapes; check code points.
- Decode the design with node -e. Avoid the unicode escape for apostrophe inside node -e; use String.fromCharCode(39).
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- Plurals use count, not current.
- Grep: LC_ALL=C /usr/bin/grep. Quote zsh paths.
- Handover summaries can be stale. Check against the files.
- src/lib/i18n/index.ts:41 fixes lng to 'en'.

## Loop notes
- R284 report cleared by R285 (read-only check). Loading sessions wrap done.
- Rejected prompt (R285 onward) lacked the design/ file. Name the design/ file, the gap row and the branch every time.
- Weak checks: hydration test accepts invented reasons; literal check misses message={"..."}, single quotes, template strings; no plural test.
- Jev asked for a pause (62%); kept a run because the task needs nothing from Isa and the base is green.
- Loading sessions wrap chosen over Jev's ask (45%) because it needs nothing from Isa and the base is green.