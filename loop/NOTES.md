# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- es voice and describeOutLoud stay until Isa approves removal. es addedToMeal and mealDeleted avoid gender.
- fr savedMeals keeps U+00A0 and U+2019 (native review pending). fr never shown (src/lib/i18n/index.ts:41).
- New keys go to en, es, fr together in src/lib/i18n/locales/.
- Macros: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording identical, record it.
- Flagged reports are cleared by a read-only round before build work. Checkpoint rounds are read-only.
- Load-failure keys: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- gym.tsx may use the react-i18next hook. English unchanged.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip: one row. Drop Longest, Total, Freezes. Keep tap to /gym/streak (accepted deviation).
- Streak footnote: separate plural keys gym.streakSessions_one/_other and gym.streakFreezes_one/_other in en, es, fr, joined with ' · '. Sessions from streak.totalGymDays, freezes from streak.freezesAvailable. Native review pending. Approval still pending per R281 report. Isa must confirm the three decisions before build.
- Training, Apply a streak freeze, Session history: app-only. Keep, wrap later, English unchanged.
- Petit-dejeuner dropped. lastLoggedLabel counts calendar days. No new test suites.
- Defaults: one-tap gym log stays on Summary card; Distance km; no food search chips; Goals extras kept.

## Built (not verified)
- Food: NumberEntryBar, Add sheet, quick add toast, MEAL caption, detent, 52pt pill, compact Meal control, recents macros, recipe fibre sum, slot heading, labels, toast, deleteMealHint, delete dialog.
- Gym: chooser, duration, CelebrationCard (row 17 steps 1-2), streak and summary keys, plural split.
- Gym streak strip (R279): one row, flame, number, dayStreak text. Footnote NOT built. Gap rows ~:393 and ~:420 NOT edited.
- Goals restyle. plan.whyThisPlan. lastLoggedLabel. settings.scanAccuracy (es).
- Macros: nutrition.tsx kicker and title, t() at :79, :86, :89, :95, macrosLoadFailed, caloriesTodayLabel. Snapshot updated.
- Load-failure t(): food.tsx:449, gym.tsx:108, profile/index.tsx:103, food/saved.tsx:85, (tabs)/index.tsx:155.

## Verification
- R281 read-only: tsc 0. npx jest gym 6 suites, 37 tests. npx jest hydrationErrorScreens 10/10.
- Last FULL Jest run was R257 (65 suites, 824 tests). Stale. Subset runs since then do not clear it.
- R283 (this round): read-only full checkpoint. Full `npx tsc --noEmit` and full `npx jest`. No edits. Result pending.
- Keys: en 166, fr 166, es 168.
- Snapshots show raw keys. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R283 (this round, checkpoint): read-only full tsc and full jest. Report failures with file and first error line. If red, stop.
2. After a green checkpoint: wrap gym.tsx 'Loading sessions...' (about :53), named in the prompt with design/Lume App.html and the gym row.
3. Streak footnote in src/app/(tabs)/gym.tsx as a third Text in the streak row (about :124). Only after Isa confirms the three decisions. Then set gap rows ~:393 and ~:420 to BUILT.
4. Wrap remaining gym.tsx literals, one per round, re-grep first: other lines from R276. 'My schedule' and 'My workouts' match design wording; wrap them too.
5. food/saved.tsx hardcoded strings: toasts, sheet title, placeholder, labels, empty states, swipe text, rows.
6. profile/index.tsx :62, :82-83; (tabs)/index.tsx :150; add dashboard.streakLoadError to the test key list.
7. EnergyBalanceCard.tsx :131; gym/freeze.tsx :48; StreakCounter.tsx :15.
8. Read and wrap: gymRange.ts (monthSummary, monthTitle), TodayCard, MuscleChart, GymPatternsCard, GymSessionButton, GymCalendar.
9. Add sheet icons to design SVGs. food.tsx about :445-447 empty-list copy.
10. Full Jest run at next checkpoint.
11. Remaining gap rows, most cleared first. If none remain: stop with 'only owner decisions remain'.
12. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame.
- Streak strip: flame pulses, flame greys at 0, artwork differs, row gap 12 vs design 11 (no token).
- fr: 'Ajouter a {{slot}}' reads oddly; gymLog.celebration.streak needs a count key; plan.addTitle means 'Add to' in es and fr.
- Global SegmentedField inset; food search sheet; single scanner; chip padding; '14-day streak' hyphen.
- Gym date line gym.tsx:73-74 uses device locale, not i18n language.
- Session count label: 'Sessions' at /gym/streak:89, 'Total days' at profile/index.tsx:135.
- Footnote session period: design sample shows '23 sessions'. App period used. Native review.
- Code: mixHex; goals.tsx copy; untyped CONFLICT_KEYWORDS; router.setParams; blinking caret; Math.round in draft(); console.warn hooks.ts:56; SLOT_KEYS duplicated.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; 'Snack' vs 'Snacks' in mealNow().
- Unused: dashboard.welcome, gymBedtime. lastLoggedDaysAgo_one unreachable.
- Future-dated saved-meal logs read 'Last logged today'.
- Chart title; Summary detail views; 'Calories today' vs 'Where the calories came from'.
- Duplicate streak copy: gym.dayStreak and gymLog.celebration.streak_*.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: all BUILT surfaces, load-failure messages, Macros kicker and title, gym tab title, plurals, streak strip, VoiceOver label.
- Native review es/fr: gender, U+00A0, U+2019, load-failure strings, caloriesTodayLabel, 'Sport', 'Detail de la serie', 'du repas', 'de la comida', 'de sport', streak footnote plurals.
- Group names: food.loadFailed vs foodLog; gym.loadFailed beside gymLog; profile reuse of gym wording.
- Record Macros and Profile changes in the gap file?
- Override es emptyMessage; remove es voice and describeOutLoud.
- Training list (gym.tsx): app-only row or removed.
- Streak footnote, three decisions (asked in R281, still open): (a) permission to add gym.streakSessions and gym.streakFreezes keys in en, es, fr; (b) streak.totalGymDays as session count; (c) separate plural keys for sessions and freezes.

## Gotchas
- The edit tool writes plain space for U+00A0 and plain apostrophe for U+2019. Use node escapes; check code points.
- No /tmp. Decode the design in memory with node -e. Avoid \u0027 in node -e; use String.fromCharCode(39).
- Render tests have no i18n instance. hydrationErrorScreens reads source and locale text only.
- Plurals use count, not current.
- Handover summaries can be stale. Check them here.
- Grep: LC_ALL=C /usr/bin/grep. Quote zsh paths.
- The streak strip has no render test. Strip tests in gym: GymCalendar only.
- Gap rows :393 and :420 cite old line ranges (gym.tsx now two lines out). Row 82 and section :414 describe the old three-stat strip. Fix when the footnote is built.
- No Saved meals row in the gap file. Closest is Saved foods (~:1447).

## Loop notes
- R283: loop note said the prior prompt was rejected for not naming the design/ file. Rewritten to name design/Lume App.html, DESIGN_GAP_ANALYSIS.md rows and branch loop/design-match.
- R283: Jev ranked Loading sessions wrap at 99%. Kept the full checkpoint. Reason Jev cannot see: last full Jest was R257; R281 and R282 ran only gym and hydrationErrorScreens subsets. A literal wrap would sit on an unverified base. The R282 report's 'flag cleared' covers the subsets only.
- R282: loop note flagged R281 as partly done. Checkpoint chosen over Jev's Loading sessions pick (96%) for the same reason.
- R280 flagged: Jest not run in a read-only round. Cleared by R281 (subsets only).
- Weak checks: hydration test accepts invented reasons; literal check misses message={"..."}, single quotes, template strings; no plural test.
- Rejected prompts lacked the file, row or branch. Name all three every time.

## Handover
- The last handover is stale on gym.tsx line numbers and on Macros and Profile status. Trust the current files and the gap file.
- Handover says 'last full suite before these edits; don't assume green'. Confirm with R283.