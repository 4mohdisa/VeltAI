# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Celebration calories show a dash. add.tsx:68 negative margin accepted.
- Snack slot 'Snacks'. Unknown slot falls back to 'Add meal'. Toast keeps toLowerCase().
- New keys go to en, es, fr together. Hardcoded string not in design: keep English, record it.
- gym.dayStreak and gym.streakDetailLabel are _one/_other; pass count.
- Streak strip one row to /gym/streak: accepted deviation. Training, Apply a streak freeze, Session history: app-only, English.
- Saved foods title 'My dishes' (food.savedTitle).
- Card: padded={false} plus style padding. Shared Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest-day = is_rest_day || !template. No-plan keeps 'Rest'. Final branch deleted (GetToday clears rest only with a template).
- /gym/session has several entry points, not one.
- Logged-day pill 'It went as planned' only in log sheet when not logged.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc.
- Macros copy follows design (R14, R15). Chart and app-only items parked.
- Snapshots re-recorded only after full diff read and key-to-text confirmed.
- R16: guard fix chosen over TodayCard logged state (smallest, no Isa input).

## Status
BUILT (not verified): food entry bar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys and strip, Goals, plan.whyThisPlan, lastLoggedLabel, Macros copy, load-failure t(), saved.tsx title, TodayCard padding/title/sub-line/rest/branch order, MuscleChart padding, row 295, /gym/session wording, EnergyBalanceCard wrapped, i18n in setup, macros snapshot re-recorded.
DIFFERENT: row 113 TodayCard (null on fetch failure, gymSchedule.ts:38-40); Summary Macros detail (no chart, app-only items).
Keys: en 169, es 171, fr 169, plus six dashboard.energyBalance each. Last full run R312 green (65 suites, 824 tests). Full Jest owed at checkpoint.

## Next
1. R16: fix weakened guard summaryNoFabrication.test.ts:38. tsc once, that file only.
2. Check goals.calories when unset. Fix nutrition.tsx footer only if it is 0.
3. Logged-day sheet: design hides it once logged; app shows it from + menu. Own round, decide from design/.
4. TodayCard logged state (one surface): kcal sub-line, green pill, t() 'Logged', comment at TodayCard.tsx:105, chip key ~162, tap target, chevron.
5. Gap doc wording, one round each, tsc once: lines ~280, ~76, ~296-298, rows 89 and 113, EnergyBalanceCard line, /gym/session reachability (264, 269-270, 291).
6. Gap doc header counts (line 71) and empty row (line 90): Isa to confirm first.
7. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr.
8. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard:85, saved.tsx, MuscleChart, session.tsx:537, gym.tsx (not Training list), profile/index.tsx, (tabs)/index.tsx.
9. Read and wrap gymRange.ts, GymSessionButton, GymCalendar.
10. Add sheet icons from design SVGs. Empty-list copy food.tsx ~445.
11. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
12. Compare Energy, Week, Training summary detail views with design; fix audit row ~1471 ('not assessed').
13. Full tsc and Jest at next checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes'. Row 89 photo vs text. Row 23 one-tap log. Row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs; native es/fr review (incl. six energyBalance keys and R15 Macros keys); 'My dishes'; Macros wording.
- Freestyle row ~300 'No' verdict. Override es emptyMessage. Remove es voice and describeOutLoud.
- Group names: food.loadFailed vs foodLog; gym.loadFailed; profile.loadFailed.
- Training list keep or remove (gym.tsx:153). Profile row 94. Streak strip wording. Backend GetToday flag.
- Confirm loop writes loop/NOTES.md and loop/DECISIONS_LOG.md.
- Energy literals stay English? Remaining-calories line removed in R15: acceptable?
- Gap doc line 284 wording: retry only after Isa confirms.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type.
- Macros: history chart; app-only Calories today gauge and Meals today list.
- Log sheet on failed fetch shows rest day (log-session.tsx:89). Server GetToday clears is_rest_day when a template exists.
- fr 'Ajouter a {{slot}}'; plan.addTitle 'Add to' in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info noise.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- 'Only some of it' (gap ~191): check if stale. Energy literals English: EnergyBalanceCard 131, 135, 148, 164, 165, 184, 191.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. Render setup imports i18n.
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths. npx jest i18n exits 1 (no tests).
- Reports can be stale. Locate gap lines by content.
- Design gym asset 7dc211f6; add menu 71f71ac4; macros 185bb533. Decode in memory only.
- Every prompt: say 'work only on loop/design-match' near the top; name the design/ file and gap row.
- DONE without design file opened or gap row edited is partial. CHECKED without tsc and Jest is partial.
- A test that reads source must be checked for whether it can fail.

## Round log
- R9-R10: EnergyBalanceCard and i18n setup; one render failure flagged.
- R11, R12: rejected (no design file named; no branch rule).
- R13: Macros row added. R14: header counts wrong, line 90 empty.
- R15: Macros copy to design; tsc 0; native es/fr review blocked.
- R16: guard fix (Jev 91% run). Report pending.