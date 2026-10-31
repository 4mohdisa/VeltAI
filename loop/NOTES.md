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
- Streak strip: one row; tap to /gym/streak is accepted deviation.
- Training, Apply a streak freeze, Session history: app-only, English unchanged.
- Saved foods sheet title 'My dishes' (food.savedTitle). addMenu.savedFoods removed.
- Card: padded={false} plus style padding. Shared Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest-day = is_rest_day || !template. No-plan keeps 'Rest' pill.
- /gym/session has several entry points (TodayCard, chooser tiles, empty state, 'It went as planned' pill). Do not describe it as one way only.
- Logged-day pill: design shows 'It went as planned' only in the log sheet when not logged. Do not call it the logged-day control.
- Log as planned (row 295) BUILT round 7. Cardio planned minutes go to notes.
- Checkpoint rounds are read-only. Gap-doc fixes get their own round with tsc. One task per prompt.
- R11: snapshot re-record approved by default, since the R10 diff is key text versus real text. Re-record only after the full diff is read and confirmed as key-to-text changes only.

## Status
BUILT (not verified): food NumberEntryBar, Add sheet, toast, MEAL caption, detent, pill, Meal control, recents, recipe fibre, slot heading, labels, delete dialog; gym chooser, duration, CelebrationCard, streak keys, one-row streak strip, Goals, plan.whyThisPlan, lastLoggedLabel, Macros kicker, load-failure t() calls, gym.loadingSessions, saved.tsx title, TodayCard padding/title/sub-line/rest and branch order, MuscleChart padding, row 295, /gym/session wording, EnergyBalanceCard wrapped (R9), i18n import in render setup (R10).
- Row 113 TodayCard: DIFFERENT. Null on schedule fetch failure with no error copy (gymSchedule.ts:38-40).
- Keys: en 169, es 171, fr 169, plus six dashboard.energyBalance in each.
- Last full run R312 green (65 suites, 824 tests). tsc exit 0 after R10. Round 8 checkpoint result unknown: full tsc and Jest owed.
- Render suite: 61 of 62 after R10. The macros snapshot is the one failure, and it stores key names.

## Next
1. IN PROGRESS (R12): re-record detailChrome macros snapshot under the key-to-text diff gate. Prompt names branch rule, design/Lume App.html and the Macros row. Check the report: DONE should list only the snapshot file. If the gate failed, park it under Blocked and move on.
2. summaryNoFabrication.test.ts:38 checks label="Burned" then target=, which no longer exists, so it cannot fail. Restore a check that can fail.
3. Review render tests that match key names by luck (energyBalanceCard 'deficit').
4. Logged-day sheet: design hides log sheet once logged; app shows it from + menu. Decide from design/, own round.
5. Gap doc (~280, ~76, ~296-298, row 89, row 113, EnergyBalanceCard line): wording fixes, one round each, tsc once. Also correct /gym/session reachability claims at ~264, ~269-270, ~291 (re-read ~260). log-session.tsx:103-104 also routes there, called from :111, :146, :173.
6. TodayCard logged state: sub-line 'Logged today · N kcal burned'; green wash pill; hardcode 'Logged' into t(); fix null comment at TodayCard.tsx:105 and header; key index ~162; pill, chip values, tap target, chevron.
7. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd from en, es, fr together. Recount first. Voice and describeOutLoud wait on Isa.
8. Wrap hardcoded strings, one file per round: gym/freeze.tsx; StreakCounter.tsx; GymPatternsCard; saved.tsx; MuscleChart; session.tsx:537; gym.tsx (not Training list); profile/index.tsx; (tabs)/index.tsx.
9. Read and wrap gymRange.ts, GymSessionButton, GymCalendar.
10. Add sheet icons to design SVGs. Empty-list copy at food.tsx ~445.
11. Dedupe SLOT_KEYS (tabs)/food.tsx and food/add.tsx. Resolve food.savedTitle vs addMenu.myDishes.
12. Full tsc and Jest at next checkpoint.
13. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- Footnote '23 sessions · 2 freezes'. Row 89 photo gallery or text list. Row 23 one-tap log. Row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs: all BUILT surfaces, load-failure messages, plurals, streak strip, 'My dishes', TodayCard states, row 295 with planned cardio.
- Freestyle row 299: whether 'No' stays. Native es/fr review of all new strings.
- Group names: food.loadFailed vs foodLog; gym.loadFailed; profile.loadFailed.
- Override es emptyMessage. Remove es voice and describeOutLoud.
- Training list keep or remove (gym.tsx:153 only link to /gym/schedule).
- Profile row 94: record Macros and Profile changes in gap file?
- Streak strip deviation wording. Backend GetToday flag: leave as is?
- Confirm loop script writes loop/NOTES.md and loop/DECISIONS_LOG.md.
- Energy balance: eight literals stay English? Confirm or translate.
- PARKED, DO NOT RETRY: gap doc line 284 wording. Retry only in a tsc round after Isa confirms.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type.
- Log sheet on failed fetch shows rest day (log-session.tsx:89). Behaviour change.
- Server: GetToday clears is_rest_day when a template exists.
- fr: 'Ajouter a {{slot}}'; plan.addTitle 'Add to' in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56.
- Recipe fibre saved as 0; detail num() rounds. Long-press meal delete not discoverable.
- Unused: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- 'Only some of it' (gap ~191): check if stale.
- Energy literals kept English: 'Energy balance detail' (EnergyBalanceCard 131, 148); error and empty lines at 135, 164, 165, 184, 191.

## Gotchas
- Edit tool writes plain space for NBSP and plain apostrophe for U+2019. Use node escapes.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. Render setup imports i18n (setup.ts line 1).
- Grep with LC_ALL=C /usr/bin/grep. Quote (tabs) paths. npx jest i18n finds no tests and exits 1.
- Reports can be stale. Locate gap lines by content.
- Design gym markup: asset 7dc211f6; add menu 71f71ac4. Decode in memory only.
- Loop note rule: a prompt must name the matching design/ file and the gap row. Check this before sending.
- Every Claude Code prompt must state 'work only on loop/design-match' near the top. R11 was rejected without it.
- Snapshot re-record: read the full diff to a file first, never a cut-off part.

## Round log
- R9: EnergyBalanceCard wrapped. Render test failed (no i18n). Flagged.
- R10: i18n import added to setup.ts. tsc 0. Render 61 of 62; macros snapshot stores key names. Flagged.
- R11: prompt rejected for not naming design/ file. Rewritten: names design/Lume App.html and the Macros row, adds diff-read gate. Report: 21-line diff, read only the first 70 lines, judged key-to-text. Snapshot not yet re-recorded. Flagged: summaryNoFabrication guard can no longer fail.
- R12: prompt rejected for missing branch rule (loop note). Rewritten: branch rule at top, full-diff gate, single snapshot, tsc once, no full suite. Sent as the re-record round.