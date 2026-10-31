# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap analysis are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Celebration card approved. Already-logged routes to /gym/session. Summary card never calls logGymSession() without args.
- Macros stored unrounded, display rounds. Design keeps macros at 1 decimal place (R56 aligns app to this; precision changed, rounding rule kept). Empty profile floors at 1,500 kcal, never 0.
- Snack slot 'Snacks'. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Hardcoded strings not in design stay English and are recorded.
- Streak strip links to /gym/streak (accepted). Training, freeze, session history are app-only, English.
- Saved foods title 'My dishes'. Card padded={false} plus style padding. Card.tsx untouched.
- TodayCard: already_checked_in before is_rest_day. Rest day = is_rest_day || !template. Logged calories from logged session only. Failure = today === null after loading; hook unchanged.
- Log sheet: rest-day check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again = refetch.
- Header counts derived from the table, never earlier figures.
- Defaults: one-tap gym log kept; Distance km kept; food chips skipped; Goals extras kept.
- Design wins by default on copy and layout disagreements (R56). Isa's Telegram replies override.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'. Factual doc corrections applied without asking.
- Prompts name the design/ file and gap row, even for doc rounds. Say 'no matching tests' when none apply.
- Claude Code must not open or edit loop/NOTES.md or loop/DECISIONS_LOG.md.
- Every prompt must state the loop/design-match branch rule explicitly (rejected R54 and R55 without it).
- Citations: an insertion at line N moves only citations at or after N. Check by content.
- Gap doc 'Reachable UI today?' for log-sheet effort/energy is No (R52). Isa may override.
- Handover NEXT lines can be stale; notes and latest report win.
- Jev is advisory.

## Status
- BUILT (not verified): food entry bar, Add sheet, toast, detent, pill, recents, slot heading, delete dialog; gym chooser, duration, CelebrationCard, streak strip, Goals, plan copy; TodayCard; Macros copy; Burned guard; EnergyBalanceCard strings; i18n setup; Log as planned; log sheet failed-fetch notice; session.tsx 'Add an exercise' label and picked-exercise rest seconds.
- Gap doc corrected: session.tsx citations, Food detail edit-bar lines (994-1005, 1211, 1218), line 962, line 330, line 334 set to No. R55: lines 1213-1214 and 1219-1221 rewritten against NumberEntryBar.tsx and detail.tsx (NumberEntryBar at detail.tsx:690 and quick-add.tsx:190; autofocus, leading-zero strip, 6/5 digit caps).
- Counts (last recorded): 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
- Last checkpoint R48 green: tsc 0, 65 suites, 824 tests.

## Next
1. R56 (in progress): Food detail macros to 1 decimal place in src/app/food/detail.tsx (num calls near 399, 405-407, 599-601), gap rounding sentence at 1219-1221 updated. Stop with BLOCKED if the API or FoodValues rejects decimals.
2. Logged-day sheet: design says 'Add something extra'; empty state says 'Add an exercise'. Default: follow design. Locate the logged-day copy first, then change it.
3. plannedRows omits te.rest_seconds (session.tsx ~193-199). Fix only if clean with no owner input.
4. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze.tsx, StreakCounter, GymPatternsCard, saved.tsx, MuscleChart, session.tsx, gym.tsx, profile/index.tsx, (tabs)/index.tsx, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
5. food.tsx ~445 empty-list copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
6. PlannedValuesForm.tsx:200 'Add exercise': compare to design, decide.
7. summaryNoFabrication.test.ts header: fibre note stale.
8. Trace add.tsx slotKey (~67). Remove unused keys voice, describeOutLoud, snapMeal, scanPackage, oneTapReadd if unused.
9. Volume: /gym/session saves top-set weight for all sets. Fix only if no owner input, else park.
10. Gap lines 1006 onward not rechecked since R52.
11. Gap line 90 empty-status merge into 'Food — My dishes / Saved' still open; record only.
12. Checkpoint: full tsc and app Jest, read-only, only if code landed since R48.
13. No rows remain: stop with 'only owner decisions remain'.

## Blocked on Isa (do not ask again, do not retry)
- Already-logged days: real editing, or change the 'open it to edit' toast. /gym/session writes a second session row (src/lib/data/mutations.ts:173-178).
- Device checks: logged card and failure states offline; possible double notice with gym tab (gym.tsx:107).
- Gap row 90 merge; whether log-sheet row stays BUILT.
- Line 330 Partial or BUILT; line 334 No (Isa may override).
- Food detail differences 1, 2, 4 (lines 1001-1004) may no longer differ; keep numbering; Isa decides ❌ verdicts at 961 and 1210.
- Footnote '23 sessions 2 freezes'; row 89 photo vs text; row 23 one-tap log; row 17 Calories formula.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording.
- Freestyle 'No'; es emptyMessage; es voice and describeOutLoud removal.
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
- Recipe fibre saved as 0; num() rounds for grams and kcal; long-press meal delete hidden.
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

## Round log
- R9-R50: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard, failed-fetch notices, checkpoints R34 and R48 green, session label, rest seconds, gap fixes.
- R51-R54: citation rechecks; doc corrections on the edit bar and number entry. Loop flagged R52 and R54 as partly done.
- R55: doc-only round on gap lines 1213-1221 with branch rule. Done: NumberEntryBar and detail.tsx citations corrected; macro rounding claim found to conflict with design.
- R56: chose Food detail macros at 1 decimal place (queued from R55). Candidates considered: logged-day copy, plannedRows rest_seconds.
