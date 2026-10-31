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
- TodayCard: already_checked_in before is_rest_day. Rest-day = is_rest_day || !template.
- Header counts derived from the table, never from earlier figures.
- Defaults: keep one-tap gym log; keep Distance km; skip food chips; keep Goals extras.
- Checkpoint rounds read-only. Gap-doc fixes get their own round with tsc. Snapshots re-recorded only after a full diff read.
- loop/NOTES.md and loop/DECISIONS_LOG.md are written by the loop script. Claude Code must not open or edit them.
- Jev is advisory.
- A report flagged for no tsc or no tests is partial. Fix before the next build round.
- TodayCard logged: calories come from the logged session only, never the whole-day figure. Solid green pill kept until Isa decides on a wash token.
- Doc-only rounds: tsc only, no Jest.
- Log sheet failed fetch: shows LoadFailedNotice with Try again (onRetry = refetch). Not a rest day. No new UI.

## Status
BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard padding, title, sub-line, rest, logged state (green pill, Logged label, kcal sub-line, chevron, 3-up grid Duration/Volume/Sets and exercise chips from logged session); Macros copy; Burned guard; EnergyBalanceCard six strings; i18n setup; Log as planned minutes in notes; log sheet failed fetch shows notice, not rest day (R27, row 76).
No test covers the TodayCard grid or chips, or the log sheet failure path.
DIFFERENT: TodayCard fetch failure renders nothing (row 114, no message); Summary Macros detail (no chart, line 103); gym today's session card.
Row 113 is 'Gym — "My schedule" screen'. There is no TodayCard fetch failure row.
Header counts (line 71): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Table has 43 rows; line 90 is empty-status.
R25 flag cleared by R26 (tsc exit 0 on final doc text).

## Next
1. R28 (this round): log sheet failed fetch offers Try again (log-session.tsx, onRetry = refetch from useToday). Row 76. tsc once; Jest only for the four log-session files.
2. Gap doc: add a TodayCard fetch failure row (row 114 area) and fix the row 113 label. Doc-only round, tsc only.
3. Add sheet icons from design SVGs (food add sheet).
4. Logged card open items: wash pill token (Isa); chevron on non-tappable card; tap target (needs day-detail route); 4-up grid needs per-session calories (backend, recommended next backend item).
5. Logged-day sheet: design hides it once logged; app shows it from + menu. Decide from design/Lume App.html.
6. Gap doc: merge line 90 empty-status row into the Saved foods row above.
7. Gap doc wording, one round each, tsc once: lines ~76, ~281, ~296-298, rows 89 and 113, EnergyBalanceCard line (eight literals remain English), audit rows ~1460 and ~1471. Also line 266 'TodayCard.tsx:168' is stale; lines 116 and 457 wrongly call the heatmap the only route into day detail.
8. summaryNoFabrication.test.ts header comment (says fibre not built).
9. Trace add.tsx slotKey (~67). If unused, remove voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd keys.
10. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', planned sub-line, '+N more', 'Logged today' fallback. EnergyBalanceCard once Isa confirms. Log sheet 'Try again' label too.
11. Empty-list copy food.tsx ~445.
12. Dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes. Compare Energy, Week, Training views with design.
13. Full tsc and Jest at checkpoint.
14. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again)
- R26 read-only verification of R25 and the today's session card row. Flagged twice for tsc or tests not run. Parked, not retried. Findings kept: row, prose and header counts agree with design asset 7dc211f6.
- Row 90 empty-status row (see Next 6). Footnote '23 sessions · 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Device runs (include: log sheet with network off shows the notice and Try again works); native es/fr review; 'My dishes'; Macros wording.
- Freestyle row ~300 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned (line 296): minutes as note text enough for BUILT?
- Energy literals stay English? Remaining-calories line removed: acceptable?
- Users with no body stats see 'your 1,500 kcal calorie goal'? Design uses 2,100 fallback.
- TodayCard logged: solid vs wash pill; kcal is whole-day burn, not session (accept, or park for backend per-session figure); chevron before tappable (accept?); device check with logged session and no burn.
- Volume: session.tsx saves top-set reps and weight for every set, so Volume overstates when weights vary. Fix the save, show Volume only when consistent, or accept?

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid type 17/24 vs 16/21, Chip 11/14 with 8pt gap, grid layout shift after fetch, stale burn (energy fetched on mount only), two sessions in a day shows earliest only, device/server date mismatch near midnight. Per-session calories field on gym_sessions (backend) to enable Calories cell and session sub-line. TodayCard fetch failure shows nothing (row 114).
- Macros: history chart; app-only gauge and meals list.
- Log sheet failed fetch: 'Try again' label hardcoded English. Server GetToday clears is_rest_day only with a template.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Stale check: 'Only some of it' (gap ~191).
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limit: summary guard test cannot see spread props. Log sheet failure path has no test (type-check only).

## Gotchas
- Edit tool: use node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths.
- Check premises: nutrition.tsx is src/app/dashboard/; Burned is on EnergyBalanceCard; 'It went as planned' pill is not the logged-day control; day-detail tap target has no route; row 113 is My schedule, not TodayCard failure.
- Gym tests are in src/__tests__.
- Every prompt names the design/ file and gap row and says 'work only on loop/design-match'.
- DONE without design read or gap row edit is partial. CHECKED without tsc and Jest is partial. No matching tests must be said. Doc-only rounds: tsc only, no Jest, and say so.
- Design assets: 185bb533 Summary, 7dc211f6 gym, 71f71ac4 food. Decode in memory only.
- Line numbers shift; locate rows by content.

## Round log
- R9-R17: EnergyBalanceCard, i18n, Macros, header counts, Macros copy, Burned guard, unset-goal check.
- R18-R19: header counts corrected; checkpoint rejected once, still owed.
- R20-R21: TodayCard logged state built; mismatches found; stays BUILT.
- R22: 3-up logged grid and chips built, no tests cover them; flagged partial.
- R23: gap-doc prose for today's session card. tsc exit 0, no tests (doc only). Flagged by loop.
- R24: read-only checkpoint. tsc exit 0; app Jest 65 suites, 824 tests passing.
- R25: gap-doc fix of stale today's session card summary row. Doc only. Flagged partial, then cleared.
- R26: read-only verification of R25. tsc exit 0, counts match (24/14/4/0). Flagged twice for tests not run; parked under Blocked on Isa.
- R27: failed today fetch on log sheet shows LoadFailedNotice, not rest day (log-session.tsx, row 76). tsc exit 0; 4 suites, 29 tests passing. Flagged partial: row 113 was the wrong row; no failure-path test.
- R28 (this round): Try again on the failed-fetch notice (onRetry = refetch). Clears the R27 dead end. Row 76.