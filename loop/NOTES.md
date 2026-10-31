# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations go in the gap doc.
- Cardio: Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Unset calorie goal: no code change; empty profile derives 1,500 kcal floor, never 0.
- Snack slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links to /gym/streak (accepted). Training, freeze, session history: app-only, English.
- Saved foods title 'My dishes'. Card: padded={false} plus style padding; Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template.
- Header counts derived from the table, never from earlier figures.
- Defaults: keep one-tap gym log; keep Distance km; skip food chips; keep Goals extras.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc. Snapshots re-recorded only after a full diff read.
- loop/NOTES.md and loop/DECISIONS_LOG.md are written by the loop script. Claude Code must not open or edit them.
- Jev is advisory.
- A report flagged for no tsc or no tests is partial. Fix before the next build round.
- TodayCard logged: calories from the logged session only, never whole-day figure. Solid green pill kept until Isa decides on a wash token.
- Doc-only rounds: tsc only, no Jest.
- Log sheet failed fetch: LoadFailedNotice with Try again (onRetry = refetch). Not a rest day. No new UI.

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard padding, title, sub-line, rest, logged state; Macros copy; Burned guard; EnergyBalanceCard six strings; i18n setup; Log as planned in notes; log sheet failed-fetch notice with Try again (R28, no failure-path test).
DIFFERENT: TodayCard fetch failure renders nothing (row 114); Summary Macros detail (no chart); gym today's session card.
Header counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT (recount after each row change).

## Next
1. TodayCard fetch failure shows LoadFailedNotice with retry (row 114). In progress.
2. Gap doc doc-only round: merge empty-status line 90 into the Saved foods row above; fix row 113 label; fix stale TodayCard.tsx:168 cite (~266); fix heatmap-only wording (~116, ~457).
3. Add sheet icons from design SVGs.
4. Logged-day sheet: design hides it once logged; app shows it from + menu. Decide from design.
5. Wrap hardcoded strings one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard strings: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today'.
6. Empty-list copy food.tsx ~445. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
7. summaryNoFabrication.test.ts header comment (fibre note stale).
8. Trace add.tsx slotKey (~67); remove unused voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd keys if unused.
9. Full tsc and Jest at checkpoint.
10. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- R28 device check: log sheet with network off shows notice; Try again works. Built, unverified.
- R26 read-only verification of R25 and today's session card row. Parked after two flags. Findings: row, prose and counts agree with design asset 7dc211f6.
- Row 90 empty-status row; footnote '23 sessions · 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row ~300 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (~296): minutes as note text enough for BUILT?
- Energy literals stay English? Remaining-calories line removed: acceptable?
- Users with no body stats see 'your 1,500 kcal calorie goal'? Design uses 2,100 fallback.
- TodayCard logged: solid vs wash pill; whole-day kcal vs session (accept or backend); chevron before tappable (accept?); device check with logged session and no burn.
- Volume: session.tsx saves top-set reps and weight for every set. Fix, show only when consistent, or accept?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid type 17/24 vs 16/21, Chip 11/14 with 8pt gap, grid shift after fetch, stale burn, two sessions in a day shows earliest, device/server date mismatch near midnight. Per-session calories on gym_sessions (backend) for Calories cell and sub-line. 'Try again' label hardcoded English; server GetToday clears is_rest_day only with a template.
- Macros: history chart; app-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Stale check: 'Only some of it' (gap ~191).
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limit: summary guard test cannot see spread props. Failure paths have no tests (type-check only).

## Gotchas
- Edit tool: use node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Check premises first: nutrition.tsx is src/app/dashboard/; Burned is on EnergyBalanceCard; 'It went as planned' pill is not the logged-day control; hook is src/lib/data/gymSchedule.ts.
- Gym tests are in src/__tests__.
- Every prompt names the design/ file and gap row and says 'work only on loop/design-match'.
- DONE without design read or gap row edit is partial. CHECKED without tsc and Jest is partial. Say 'no matching tests' when none apply.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode in memory only.
- Line numbers shift; locate rows by content.

## Round log
- R9-R17: EnergyBalanceCard, i18n, Macros, header counts, Burned guard, unset-goal check.
- R18-R19: header counts corrected.
- R20-R22: TodayCard logged state built; grid and chips built, untested.
- R23-R26: gap-doc prose fixes; checkpoint R24 green (tsc 0, 65 suites, 824 tests); R26 parked.
- R27: failed-fetch notice on log sheet (row 76). Flagged partial: no failure-path test.
- R28: Try again on that notice (onRetry = refetch). Flagged partial; device check parked under Blocked on Isa.
- R29 (this round): TodayCard failure notice with retry (row 114).