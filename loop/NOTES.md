# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc authoritative. Accepted deviations go in gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded; draft() rounds to 1 dp on save. Food detail macros and fibre 1 dp. Food day card, Summary, Macros detail, totals stay whole. Seeds unrounded. quickAdd rounds inline (MACRO_PRECISION not exported).
- Quick add logs 100 g until search has serving data.
- Empty profile floors at 1,500 kcal. Slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- TodayCard: already_checked_in before is_rest_day. Rest = is_rest_day || !template. Failure = today === null after loading. Sub-line 'N exercises planned' (R92); minutes dropped; muscle prefix parked.
- Log sheet: rest check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again refetches.
- Header counts derived from table. Rows 15 and 21 removed because other text cites them.
- Citations: insertion at line N moves only citations at or after N; check by content. Deletion inside a line moves nothing.
- Gap-row placement checked against row subject before a reason sentence is added.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'.
- Claude Code never opens or edits loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name branch loop/design-match and forbid git.
- Handover NEXT lines may be stale; latest report and notes win. Jev advisory.
- Tests: tsc once plus tests for changed files. Full suite at checkpoints. 'No related tests found' is not a pass.
- Flagged partial work closed only by finishing it or stating why not.
- Backend-dependent items stay Parked. Gym freeze sheet (src/app/gym/freeze.tsx) kept as built; app-only.
- Nutrition gap row line 103: accepted R82, stays DIFFERENT until macro history chart exists.
- Every prompt names matching design/ file and gap row.
- Locale key gym.plannedExercisesNoDuration kept (R93). Rename parked; no es/fr edits.
- LoadFailedNotice tap target: design has no load-failure notice. minTapTarget={false} kept as accepted deviation (R96, gap row 114).

## Status
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
BUILT, not verified: food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session rest seconds; food detail macros and fibre; saved-food fibre (saved.tsx toEditable and add); citations; macro totals; quick add rounding; nutrition, freeze, StreakCounter, profile and TodayCard strings via t(); TodayCard sub-line (NOT TESTED); LoadFailedNotice 'Try again' label via t() (R95, NOT TESTED).
Last checkpoint R89 green (tsc 0, 65 suites, 824 tests). Next checkpoint not due.
Untested: decimal macros, quickAdd, fibre read-back, saved.tsx toEditable, StreakCounter, profile render, TodayCard (no test references it), R92 locale keys, LoadFailedNotice label and tap target.

## Next (in order)
1. IN PROGRESS (R96): doc-only. Record LoadFailedNotice tap-target accepted deviation at gap row 114. Closes the R95 flag.
2. (tabs)/gym.tsx:153-155 training list and 'Apply a streak freeze' (:155) via t(). Freeze sheet kept as built. Unblocked by decision.
3. Separate rounds: dashboard/week.tsx, dashboard/training.tsx, energy.tsx ('Breakdown').
4. One file per round: GymPatternsCard, saved, MuscleChart, session (untranslated strings), gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
5. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
6. PlannedValuesForm.tsx:200 'Add exercise' vs design.
7. add.tsx slotKey (~67). Remove unused keys if confirmed.
8. Raw item values: (tabs)/food.tsx:852, :895; food/saved.tsx:144. Park if no design decision.
9. Shared macro rounding helper for inline Math.round(x*10)/10. Park if more than one file.
10. MACRO_PRECISION comment omits fibre (doc only).
11. Logged-day 'Add something extra': follow design copy.
12. Gap lines 1014 onward unchecked; line 90 merge; line 1495 stale.
13. /gym/session saves top weight on all sets. Fix or park.
14. summaryDetails.test.ts:65 source-checks 'Breakdown'; replace with render check, own round.
15. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
16. StreakCounter.tsx: stale header comment; colour tokens color.black, gray400, gray500 to color.label, secondaryLabel.
17. Gap line 82: remove stray <br> and misplaced freeze sentence (doc only). StreakCounter wrap has no gap row; add one if needed.
18. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or change toast? /gym/session writes second row (mutations.ts:173-178).
- Device checks: logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line.
- Row 90 merge; log-sheet row BUILT?; line 330 Partial or BUILT; line 334 No.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Footnote '23 sessions 2 freezes'; rows 89, 23, 17.
- Search routing; global + title; quick add first or second serving; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review (profile, nutrition, freeze, StreakCounter, TodayCard, gym.planned*, gym.rest, gym.loggedToday, common.tryAgain). Terms: fr 'Gels', es 'Congelaciones'; 'AI insights'; 'My dishes'; Macros wording; Freestyle 'No'; es emptyMessage; es voice removal.
- Group names food/gym/profile.loadFailed; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line removal.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix, show or accept. Heatmap wording. Calories cell needs backend field.
- Freeze screen: decided as kept (see Decisions). Owner may still override.
- StreakCounter wrap has no row. Gap line 82 freeze sentence kept for now.

## Parked
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood (mutations.ts:157) local only; server sync needs backend.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0, custom exercise route, PlannedValuesForm submit.
- TodayCard muscle-group prefix (needs template data); header dot, min-height, gaps, pill type, grid, stale burn, earliest-session rule, near-midnight mismatch, per-session kcal, '0 exercises planned'.
- Rename gym.plannedExercisesNoDuration to gym.plannedExercises (cosmetic, touches es/fr keys).
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- Freeze sheet: singular counts; toast before server reply; refusal unhandled; old colour tokens; stale params streak.tsx:73.
- Logged card tap target needs day route. Macros history chart. App-only gauge and meals list. Percent-of-target title follows today; design follows picked day.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; SegmentedField inset; single scanner; chip padding; '14-day' hyphen.
- Streak keys go if profile streak cards removed.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds grams and kcal; long-press meal delete hidden. Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500; Math.max NaN if profile field undefined.
- LoadFailedNotice minimum tap target: revisit only if a design failure state appears.
- Test for LoadFailedNotice label and retry size (no test checks them today).

## Accepted limits
Summary guard cannot see spread props. Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0, so a true 0 g food shows no tile. Saved-food edits local only. No test renders profile, StreakCounter or TodayCard. LoadFailedNotice retry button keeps minTapTarget={false}: the design has no failure notice (R96).

## Round log
R9-R82: most surfaces built. Checkpoints R34, R48, R61, R77 green.
R83-R87: freeze strings via t(); gap line 82 annotated, then StreakCounter sentence removed.
R88: profile strings via t(); tsc 0; 21 tests pass.
R89: checkpoint green (tsc 0, 65 suites, 824 tests).
R90-R92: TodayCard strings and sub-line via t(); tsc 0; tests not run or none referencing (flagged).
R93: TodayCard comment fixed; tsc 0; no test references TodayCard (closed as accepted limit).
R94: doc-only citation fix at gap line 297; tsc 0. Flagged: no tests run, type check result unclear.
R95: LoadFailedNotice 'Try again' via t(); tsc 0; 2 suites, 16 tests pass. Tap target unchanged; row 114 stays DIFFERENT. Flagged as partly done.
R96 (this round): doc-only. Tap-target decision recorded as accepted deviation at gap row 114. Closes R95 flag. Freeze screen treated as kept; gym.tsx:155 unblocked.