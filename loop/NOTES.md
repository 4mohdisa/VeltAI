# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Celebration calories show a dash. Negative margin at add.tsx:68 accepted.
- Snack slot key 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- New keys go to en, es, fr together. Hardcoded string not in design: keep English, record it.
- gym.dayStreak and gym.streakDetailLabel are _one/_other. Pass count, never current.
- Streak strip one row, tap to /gym/streak: accepted deviation. Training, Apply a streak freeze, Session history: app-only, English.
- Saved foods title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding. Shared Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest-day = is_rest_day || !template. No-plan keeps 'Rest' pill.
- /gym/session has several entry points (TodayCard, chooser tiles, empty state, 'It went as planned' pill). Not one way only.
- Logged-day pill: 'It went as planned' only in log sheet when not logged.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc.
- Macros (R14): copy follows design. App-only removals and history chart parked. No ask.
- Macros copy (R15): sub-line, section title and footer follow design. Footer 2,100 is the user's goal value. Footer drops 'no macro history' sentence. Chart parked.
- Snapshot re-record only after full diff read and confirmed key-to-text.

## Status
BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys and strip, Goals, plan.whyThisPlan, lastLoggedLabel, Macros kicker, load-failure t(), gym.loadingSessions, saved.tsx title, TodayCard padding/title/sub-line/rest and branch order, MuscleChart padding, row 295 (Log as planned), /gym/session wording, EnergyBalanceCard wrapped, i18n import in setup, macros snapshot re-recorded.
- Row 113 TodayCard: DIFFERENT (null on schedule fetch failure, gymSchedule.ts:38-40).
- Summary Macros detail: DIFFERENT (chart missing, app-only items). Sub-line, section title and footer copy follow design as of R15 (pending check).
- Keys: en 169, es 171, fr 169, plus six dashboard.energyBalance each.
- Last full run R312 green (65 suites, 824 tests). tsc 0 at R14. Full Jest owed.

## Next
1. R15 (in progress): Macros copy to design in src/app/dashboard/nutrition.tsx, locales (en, es, fr), snapshot re-record after full diff read, gap row 103 text. tsc once, Jest on nutrition and macros tests only.
2. summaryNoFabrication.test.ts:38 cannot fail. Restore a check that can.
3. Logged-day sheet: design hides log sheet once logged; app shows it from + menu. Decide from design/, own round.
4. Gap doc wording: ~280, ~76, ~296-298, row 89, row 113, EnergyBalanceCard line. One round each, tsc once.
5. Gap doc: header counts at line 71 (PARTIAL and BUILT totals wrong) and empty row at line 90. Isa to confirm before editing.
6. TodayCard logged state: sub-line with kcal, green wash pill, 'Logged' via t(), fix null comment TodayCard.tsx:105 and header, chip key ~162, tap target, chevron.
7. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr together.
8. Wrap hardcoded strings, one file per round: gym/freeze.tsx; StreakCounter; GymPatternsCard; saved.tsx; MuscleChart; session.tsx:537; gym.tsx (not Training list); profile/index.tsx; (tabs)/index.tsx.
9. Read and wrap gymRange.ts, GymSessionButton, GymCalendar.
10. Add sheet icons from design SVGs. Empty-list copy food.tsx ~445.
11. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
12. Compare Energy, Week and Training summary detail views with design. Audit row 'Summary detail views' (~line 1471) says not assessed with old line numbers; fix when this is done.
13. Full tsc and Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes'. Row 89 photo vs text. Row 23 one-tap log. Row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs: BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states, row 295 cardio, Macros wording ('260 kcal remaining', '1,840 of 2,100').
- Freestyle row 299 'No' verdict (now ~line 300). Native es/fr review of new strings incl. six dashboard.energyBalance keys and Macros copy strings from R15.
- Group names: food.loadFailed vs foodLog; gym.loadFailed; profile.loadFailed.
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list keep or remove (gym.tsx:153).
- Profile row 94: record Macros and Profile changes in gap file?
- Streak strip deviation wording. Backend GetToday flag: leave?
- Confirm loop script writes loop/NOTES.md and loop/DECISIONS_LOG.md.
- Energy balance: eight literals stay English? Confirm or translate.
- Gap doc header counts (line 71): table has 14 PARTIAL and 4 BUILT, header says 15 and 3. Fix now?
- Gap doc line 90: empty status row, not counted. Remove or give it a verdict?
- PARKED, DO NOT RETRY: gap doc line 284 wording. Retry only in a tsc round after Isa confirms.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type.
- Macros: macro history chart (needs multi-day data; design shows this week's stacked protein, carbs, fat); app-only 'remaining today', 'Calories today' gauge, 'Meals today' list (removal pending device check). Footer no longer explains missing history after R15; revisit with chart.
- Log sheet on failed fetch shows rest day (log-session.tsx:89).
- Server: GetToday clears is_rest_day when template exists.
- fr 'Ajouter a {{slot}}'; plan.addTitle 'Add to' in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info noise.
- Recipe fibre saved as 0; detail num() rounds. Long-press meal delete not discoverable.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- 'Only some of it' (gap ~191): check if stale.
- Energy literals English: 'Energy balance detail' (EnergyBalanceCard 131, 148); error and empty lines 135, 164, 165, 184, 191.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. Render setup imports i18n.
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths. npx jest i18n exits 1 (no tests found).
- Reports can be stale. Locate gap lines by content.
- Design gym markup: asset 7dc211f6; add menu 71f71ac4; macros summary asset 185bb533. Decode in memory only.
- Every prompt: say 'work only on loop/design-match' near the top; name the design/ file and gap row.
- Snapshot re-record: read the full diff to a file first.
- A DONE report without the design file opened or the gap row edited is partly done.
- A CHECKED section without the tsc and Jest results is partly done (R14 flag).

## Round log
- R9: EnergyBalanceCard wrapped; render test failed; flagged.
- R10: i18n added to setup; render 61 of 62; flagged.
- R11: rejected (no design file named); snapshot not re-recorded; summaryNoFabrication guard weakened; flagged.
- R12: rejected (no branch rule); snapshot re-recorded; design file not opened; flagged.
- R13: Macros row did not exist; report added one as DIFFERENT; header count now stale; tsc 0, Jest not run; flagged.
- R14: Jev said ask 88%; kept run because the copy question falls under defaults. Doc fix only, tsc 0. Header counts and line 90 found wrong; Jest not run; flagged.
- R15: Macros copy to design task. Flag from R14 addressed by running tsc and nutrition/macros Jest this round. Jev run 89%.
