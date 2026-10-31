# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Empty profile derives 1,500 kcal floor, never 0.
- Snack slot 'Snacks'. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links to /gym/streak (accepted). Training, freeze, session history: app-only, English.
- Saved foods title 'My dishes'. Card: padded={false} plus style padding. Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template. Logged calories from logged session only. Failure = today === null after loading; hook unchanged.
- Log sheet: rest-day check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again = refetch.
- Header counts derived from the table, never earlier figures.
- Defaults: one-tap gym log kept; Distance km kept; food chips skipped; Goals extras kept.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'. Factual doc corrections applied without asking.
- Prompts name the design/ file and gap row, even for doc rounds. Say 'no matching tests' when none apply.
- Claude Code must not open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Citations: an insertion at line N moves only citations at or after N. Check each by content, never a blanket shift.
- Gap doc 'Reachable UI today?' for log-sheet effort/energy is No (sheet has no such field), R52. Isa may override.
- Handover NEXT lines are stale when they conflict with the latest report; notes win.
- Jev is advisory.

## Status
- BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard; Macros copy; Burned guard; EnergyBalanceCard strings; i18n setup; Log as planned; log sheet failed-fetch notice; session.tsx label 'Add an exercise', picked and planned rest seconds.
- Gap doc citations to session.tsx moved and checked by content (R51, report confirmed).
- R52 doc corrections done: line 94, 962 (partly), 1001, 330 wording, 334 set to No. Session.tsx citations rechecked, none changed.
- Counts (last recorded): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
- Last checkpoint R48 green: tsc 0, 65 suites, 824 tests.
- R52 report was flagged by the loop (type check or tests not run, task partly done). R53 re-runs tsc and states no matching tests.

## Next
1. R53 (doc-only, in progress): correct gap doc lines 995, 1002, 1004, 1005, 1211, 1218 against src/app/food/detail.tsx (tap-to-edit, grams chip at :495-514, boxed fields, 'Done' pill search result). Reword line 962 'a labelled form' to match the macro grid at detail.tsx:597-638. Change no status cells or counts. Then tsc only, print 'TSC EXIT <n>'.
2. Still open in gap doc: row 7 check; 'What the app does' old-form block (restore date only if accurate); line 90 empty-status merge into 'Food - My dishes / Saved'; 'Gym - session logging' status cell (items are partial).
3. plannedRows omits te.rest_seconds (session.tsx about :193-199): fix only if it is a clean code change with no owner input; verify before editing.
4. Logged-day sheet from + menu: 'Add something extra' is in the design, but the session.tsx empty state is 'Add an exercise'. Decide and record.
5. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
6. food.tsx ~445 empty-list copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
7. PlannedValuesForm.tsx:200 'Add exercise': compare to design, then decide.
8. summaryNoFabrication.test.ts header: fibre note stale.
9. Trace add.tsx slotKey (~67). Remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
10. Volume: /gym/session saves top-set weight for all sets. Fix only if no owner input needed, else park.
11. Checkpoint: full tsc and app Jest, read-only, only if code landed since R48.
12. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- Already-logged days: real editing (src/lib/data/mutations.ts:173-178) or change 'open it to edit' copy. /gym/session writes a second session row.
- Device checks: logged card and failure states offline. Possible double notice with gym tab (src/app/(tabs)/gym.tsx:107).
- Gap row 90 merge; whether log-sheet row stays BUILT.
- Line 330 Partial vs BUILT (difference 9 at line 228 records same branch as BUILT).
- Line 334 verdict: set to No in R52, Isa may override.
- Footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle row 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food.loadFailed, gym.loadFailed, profile.loadFailed.
- Training list keep or remove (gym.tsx:153); profile row 94; streak strip wording; backend GetToday flag.
- Log as planned: are minutes as note text enough for BUILT?
- Energy literals English? Remaining-calories line removed: acceptable?
- Users without body stats see 1,500 kcal goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal under session card; chevron before tappable.
- Volume: fix, show only when consistent, or accept?
- Heatmap route wording; calories cell needs gym_sessions.calories_burned from backend. Accept?
- Try again hardcoded English with small tap target.

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route, PlannedValuesForm.tsx:200 submit.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill and chip type, grid 17/24 vs 16/21, Chip 11/14, grid shift after fetch, stale burn, earliest-session rule, near-midnight date mismatch, per-session calories (backend), GetToday clears is_rest_day only with template, '0 exercises planned' sub-line.
- Logged card tap target needs day-detail route.
- Macros history chart; app-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle in es and fr.
- Global SegmentedField inset; single scanner; chip padding; '14-day streak' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds; long-press meal delete hidden.
- Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if profile field undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths untested; null-as-failure assumes api.gym.getToday never returns null for a real response.

## Gotchas
- Edit tool: node escapes for NBSP and U+2019.
- i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths. grep -c returning 0 exits 1.
- Check premises first: nutrition.tsx is src/app/dashboard/; hook is src/lib/data/gymSchedule.ts; gym tests in src/__tests__.
- Design assets decode with node -e from __bundler/manifest: Summary 185bb533, gym 7dc211f6, food 71f71ac4.
- zsh breaks on unquoted globs and echo ==.
- Handover text can be stale; notes win.

## Round log
- R9-R50: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard, failed-fetch notices, checkpoints R34 and R48 green, session label, rest seconds, gap fixes.
- R49-R50: citation shifts were applied wrongly; R51 rechecked them by content.
- R51: doc corrections mostly done (15 citations, difference 11, line 328). Loop note flagged partly done.
- R52: doc-only edit-bar claims corrected at 94, 962, 1001; ExercisePicker line 330 reworded; line 334 set to No; session.tsx citations rechecked; tsc 0. Loop note flagged the report (tsc or tests not run). Latest report lists contradicting Food detail lines 995-1218 as NEXT.
- R53: in progress. Doc-only correction of 995, 1002, 1004, 1005, 1211, 1218 and 962 against detail.tsx; tsc only.
- R54: next, after R53 report.