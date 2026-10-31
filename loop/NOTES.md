# Lume Loop Notes

## Goal
Match design/Lume App.html through DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Summary card never calls logGymSession() without args.
- Macros stored unrounded; draft() rounds to 1 dp on save. Food detail macros and fibre 1 dp. Food day card, Summary, Macros detail and totals stay whole.
- Quick add logs 100 g until search has serving data.
- Empty profile floors at 1,500 kcal. Slot 'Snacks'; unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- TodayCard: already_checked_in before is_rest_day. Rest = is_rest_day || !template. Failure = today === null after loading.
- Log sheet: rest check keeps planned.length === 0. Failure shows LoadFailedNotice; Try again refetches.
- Header counts derived from the table. Rows 15 and 21 removed because other text cites them.
- Citations: an insertion at line N moves only citations at or after N. Check by content. A deletion inside a line moves nothing.
- Gap-row placement must be checked against the row's subject before a reason sentence is added.
- Checkpoint rounds read-only. Doc-only rounds: tsc only, print 'TSC EXIT <n>'.
- Claude Code never opens or edits loop/NOTES.md or loop/DECISIONS_LOG.md. Every prompt names branch loop/design-match and forbids git.
- Handover NEXT lines may be stale; latest report and notes win. Jev is advisory.
- Tests: tsc once, plus tests for changed files. Full suite at checkpoints. 'No related tests found' is not a pass.
- Flagged partial work is closed only by finishing it or stating why it cannot be finished.
- Macro totals stay whole. One-dp rounding only on Food detail. Backend-dependent items stay Parked.
- Gym freeze sheet (src/app/gym/freeze.tsx) kept as built. App-only; removal is a parked decision.
- Nutrition gap row: DESIGN_GAP_ANALYSIS.md line 103. Accepted R82. Verdict stays DIFFERENT until the macro history chart exists.
- Every prompt names the matching design/ file and the gap row it serves.

## Status
BUILT (not verified): food entry bar and sheets; gym chooser, duration, CelebrationCard, streak strip, Goals; TodayCard; Macros; Burned guard; EnergyBalanceCard; i18n setup; Log as planned; log-sheet failure notice; session rest seconds; food detail macros and fibre at 1 dp; saved-food fibre; citations; macro totals; quick add rounding; nutrition.tsx and gym/freeze.tsx strings via t() (es/fr unreviewed); StreakCounter caption via t() (untested).
Counts: 24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT.
Last checkpoint R77 green. Next checkpoint R91.
Untested: decimal macros, quickAdd, fibre write and read-back, saved.tsx toEditable, StreakCounter render.

## Next (in order)
1. R87 (in progress): doc-only. Remove the StreakCounter sentence from gap line 82; keep the freeze.tsx sentence. tsc only, print 'TSC EXIT <n>'.
2. String wrap, one file per round: profile/index.tsx, GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
3. Separate rounds: dashboard/week.tsx, dashboard/training.tsx, energy.tsx.
4. TodayCard strings: 'Planned', 'Rest', 'Start workout', '+N more', 'Logged today', 'Try again'.
5. (tabs)/gym.tsx:155 'Apply a streak freeze'. Only after Isa confirms the freeze screen stays.
6. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
7. PlannedValuesForm.tsx:200 'Add exercise' vs design.
8. add.tsx slotKey (~67). Remove unused keys if confirmed.
9. Raw item values: (tabs)/food.tsx ~852, ~895; food/saved.tsx ~135-144. Park if no design decision.
10. Shared macro rounding helper for inline Math.round(x*10)/10. Park if it needs more than one file.
11. MACRO_PRECISION comment omits fibre (doc only).
12. Logged-day 'Add something extra': follow design copy.
13. Gap lines 1014 onward unchecked; line 90 merge; line 1495 stale.
14. /gym/session saves top weight on all sets. Fix or park.
15. R91 checkpoint: full tsc and app Jest, read-only.
16. summaryDetails.test.ts:65 source-checks 'Breakdown'; replace with render check, own round.
17. nutrition.tsx:120 '80%' vs '80 %', own round.
18. nutrition.tsx:164 and :180 raw meal.slot, own round.
19. StreakCounter.tsx header comment says Gym tab; fix, own round.
20. StreakCounter colour tokens to color.label and secondaryLabel, own round.
21. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or change toast? /gym/session writes a second row (mutations.ts:173-178).
- Device checks: logged card, offline failure, double notice (gym.tsx:107).
- Row 90 merge; log-sheet row BUILT?; line 330 Partial or BUILT; line 334 No.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Footnote '23 sessions 2 freezes'; rows 89, 23, 17.
- Search routing; global + title; quick add first or second serving (x.serv[1]); add sheet 0pt gap; 'Snacks' label.
- Native es/fr review; 'My dishes'; Macros wording; Freestyle 'No'; es emptyMessage; es voice and describeOutLoud removal.
- Group names food/gym/profile.loadFailed; training list (gym.tsx:153); profile row 94; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals English; remaining-kcal line removal.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix, show or accept. Heatmap wording. Calories cell needs backend field.
- Freeze screen: does gym/freeze.tsx stay? Gates Next item 5.

## Parked
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) has no serving data.
- editSavedFood (mutations.ts:157) local only; server sync needs backend.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, missing macros as 0, custom exercise route, PlannedValuesForm submit.
- Row 17: rest-day exits, pop-in, ring vs flame. Streak: flame pulses, artwork.
- Freeze sheet: singular counts; toast before server reply; refusal not handled; old colour tokens; stale params at streak.tsx:73.
- TodayCard: header dot, min-height, gaps, pill type, 17/24 vs 16/21 grid, grid shift, stale burn, earliest-session rule, near-midnight mismatch, per-session kcal, '0 exercises planned'.
- Logged card tap target needs day route. Macros history chart. App-only gauge and meals list.
- Percent of target card title follows picked day in design; app fixed to today.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; SegmentedField inset; single scanner; chip padding; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18next console.info banner.
- Recipe fibre saved as 0; num() rounds grams and kcal; long-press meal delete hidden. Unused keys: dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens may show 1,500; Math.max NaN if a profile field is undefined.

## Accepted limits
Summary guard cannot see spread props. Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0, so a true 0 g food shows no tile. Saved-food edits local only. Nutrition, freeze and StreakCounter es/fr unreviewed. StreakCounter has no test.

## Round log
R9-R82: most surfaces built. Checkpoints R34, R48, R61, R77 green.
R83: freeze.tsx strings t(); gap line 82 annotated. tsc 0.
R84: rejected (no branch rule). Rewritten. StreakCounter caption t(); sentence put on line 82 in error.
R85: flagged. tsc 0; jest --findRelatedTests found no suite. No edits. Line 82 reported.
R86: prompt rejected (no design/ file named). Report: no files changed; Isa asked about line 82.
R87: doc-only removal of the StreakCounter sentence from gap line 82, decided without Isa (gap-row placement rule). Freeze sentence kept. tsc only.