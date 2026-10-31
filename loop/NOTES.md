# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wins copy and layout disputes unless Isa overrides. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded. Food detail macros and fibre show 1 decimal. Food day card, Summary card, Macros detail and totals stay whole (design uses hMacroCols, gMacroDefs). draft() rounds to 1 decimal on save (R63).
- Empty profile floors at 1,500 kcal.
- Slot 'Snacks'. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- TodayCard: already_checked_in before is_rest_day. Rest = is_rest_day || !template. Failure = today === null after loading.
- Log sheet: rest check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again refetches.
- Header counts derived from the table. Difference numbers kept; 15 and 21 removed because other text cites them.
- Citations: an insertion at line N moves only citations at or after N. Check by content.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'.
- Prompts name the design/ file and gap row; say 'no matching tests' when none apply; state the branch rule.
- Prompts are ONE surface or ONE shared component. A rejected prompt is rewritten to one file.
- Claude Code never opens or edits loop/NOTES.md or loop/DECISIONS_LOG.md.
- Handover NEXT lines may be stale; latest report and notes win. Jev is advisory.
- Tests: a report that skips the tests for changed files is flagged. Run tsc once and the tests for changed files each round; full suite only at checkpoints.

## Status
BUILT (not verified): food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session label and rest seconds (session.tsx :200); food detail macros and fibre 1 decimal typed or picked (R56, R63, R64); citations fixed (R57-R59); macro totals checked, whole (R60); fibre doc lines fixed (R65); food search one-tap add (quickAdd) rounds protein, carbs, fat, fibre to 1 decimal (R70, only type-checked, flagged).
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last checkpoint R61 green (tsc 0, 65 suites, 824 tests). It predates R63 to R71. No test covers decimal macros.

## Next
1. IN PROGRESS (R71): re-run tsc and the tests for food.tsx / quickAdd after the flagged R70 report. Fix only if red, inside src/app/(tabs)/food.tsx.
2. Raw item values: decide display at (tabs)/food.tsx ~895 and ~852; food/saved.tsx ~135. Rows added with + now show decimals (e.g. P 3.1).
3. Shared macro rounding: Math.round(x * 10) / 10 is now inline in detail.tsx, quickAdd, label-scan.tsx:40, onboarding/measurements.tsx:25. Consider one shared helper (new small util, one round). Park if it needs more than one file.
4. Verify detail.tsx seed rounding by read-only grep (search and barcode seeds, around :164-168 and :224). Latest report says fixed, handover says open. Do not edit unless the grep proves it is unfixed.
5. Saved-food fibre: check whether editSavedFood and saveFood in detail.tsx drop draft.fibre on save.
6. MACRO_PRECISION comment at detail.tsx:65 omits fibre (doc-only, low priority).
7. Doc lines 1011 ('2-up inputs'), 1012 ('Fibre is not editable') and 1219 ('Fibre is still rounded as it is typed') are stale. Fix after the code is settled.
8. Logged-day 'Add something extra': follow design copy.
9. Gap lines 1006 onward after 1013 are unchecked. Line 90 merge. Line 1495 'no keyboard bar' is stale.
10. Wrap hardcoded strings, one file per round: nutrition.tsx, gym/freeze, StreakCounter, GymPatternsCard, saved, MuscleChart, session, gym, profile/index, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. TodayCard: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'. session.tsx strings untranslated.
11. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
12. PlannedValuesForm.tsx:200 'Add exercise' vs design.
13. add.tsx slotKey (~67). Remove unused keys if confirmed.
14. Volume: /gym/session saves top weight on all sets. Fix without owner input, else park.
15. Checkpoint: full tsc and app Jest, read-only.
16. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: real editing or change the toast. /gym/session writes a second row (src/lib/data/mutations.ts:173-178).
- Device checks: logged card and failure offline; possible double notice (gym.tsx:107).
- Row 90 merge; log-sheet row BUILT?; line 330 Partial or BUILT; line 334 No.
- Food detail differences 1, 2, 4; ❌ verdicts at lines 961 and 1210.
- Footnote '23 sessions 2 freezes'; rows 89, 23, 17.
- Search routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording; Freestyle 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food/gym/profile.loadFailed; training list (gym.tsx:153); profile row 94; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals English; remaining-kcal line removal.
- Users without body stats see 1,500 kcal goal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume: fix, show when consistent, or accept. Heatmap wording. Calories cell needs backend field.
- Try again hardcoded English, small tap target.

## Parked
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros shown as 0, custom exercise route, PlannedValuesForm submit.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- TodayCard: header dot, min-height, gaps, pill/chip type, grid 17/24 vs 16/21, grid shift after fetch, stale burn, earliest-session rule, near-midnight mismatch, per-session calories, GetToday is_rest_day, '0 exercises planned'.
- Logged card tap target needs day route. Macros history chart. App-only gauge and meals list.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr. SegmentedField inset; single scanner; chip padding; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds grams and kcal; long-press meal delete hidden. Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500 floor; Math.max NaN if a profile field is undefined.
- Accepted limits: summary guard test cannot see spread props; failure paths untested; null-as-failure assumes getToday never returns null for a real response.
- 'What the app does' old-form block lacks a recorded date.

## Gotchas
- Edit tool: node escapes for NBSP and U+2019. i18n lng fixed to 'en' (src/lib/i18n/index.ts:41).
- Grep: LC_ALL=C /usr/bin/grep. Quote (tabs) paths. grep -c returning 0 exits 1.
- Check premises first; named files and line numbers are often wrong. Locate by content.
- Design assets: node -e from __bundler/manifest (gym 7dc211f6, Summary 185bb533, food 71f71ac4).
- zsh: quote globs; avoid echo ==.

## Round log
- R9-R50: EnergyBalanceCard, i18n, Macros, counts, Burned guard, TodayCard, failure notices, checkpoints R34 and R48 green, session label, rest seconds, gap fixes.
- R51-R60: citation and doc fixes; macros 1 decimal (R56); R60 totals checked, whole.
- R61: checkpoint green (tsc 0, 65 suites, 824 tests).
- R62-R64: picked-serving precision; fibre 1 decimal.
- R65: stale fibre doc lines fixed.
- R66: rejected for asking more than one screen. Not built.
- R67: seed fix in detail.tsx. Reported done, but loop flagged as partly done.
- R68: loop flagged R67 as partly done. Handover lists seeds still open.
- R69: reported detail.tsx seeds already fixed (no edits, tsc 0, foodDetail suites 35 tests pass). Not independently confirmed; re-check by grep.
- R70: food tab quickAdd rounds protein, carbs, fat, fibre to 1 decimal (src/app/(tabs)/food.tsx). Reported TSC EXIT 0, no tests run. Loop flagged: tests not run.
- R71: re-check of R70 (tsc and food tests), fix only if red. Prompt issued.
