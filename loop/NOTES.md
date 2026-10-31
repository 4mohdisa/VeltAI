# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Accepted deviations go in the gap doc.
- Cardio uses Distance km. No food search chips. Goals as built. Freeze sheet kept, app-only.
- Macros stored unrounded, rounded to 1 dp on save. Day card, Summary and totals stay whole.
- Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English and are recorded.
- Rows stay DIFFERENT while other differences remain.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds read-only. Doc-only rounds: tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Every prompt names the matching design/ file and gap row.
- Tests: tsc once, plus tests for changed files. 'No related tests found' is not a pass.
- Backend-dependent items stay Parked.
- LoadFailedNotice has no design counterpart. minTapTarget={false} kept (row 114).
- LoadFailedNotice message is required; no default copy (R98).

## Status
24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT (recheck header). Last checkpoint R89 green (tsc 0, 65 suites, 824 tests).
R99 built, tsc 0, locale tests not yet run. R100 issued to clear this flag.
Untested: TodayCard, freeze, StreakCounter, profile render, LoadFailedNotice label and size, R92 keys, R98 required message, R99 label.

## Next
1. R100 ISSUED: clear the flagged R99 check. Run tsc and the tests that load the locale files, confirm gym.applyStreakFreeze in en, es, fr, fix only a single missing key. Report without claiming verified.
2. 'Breakdown' on dashboard/week.tsx, training.tsx, energy.tsx via t().
3. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
4. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
5. PlannedValuesForm.tsx:200 'Add exercise' vs design.
6. add.tsx slotKey (~67). Remove unused keys if confirmed.
7. Raw item values: food.tsx:852, :895; food/saved.tsx:144. Park if no design decision.
8. Doc only: gap line 82 stray br (R99 text appended, stray br removed); line 76 record Try again change; MACRO_PRECISION comment; lines 1014 on unchecked; line 90 merge; line 1495 stale.
9. LoadFailedNotice.tsx lines 4-5 header comment: remove the 'we could not load the latest' wording (default removed R98).
10. /gym/session saves top weight on all sets. Fix or park.
11. summaryDetails.test.ts:65 source-checks 'Breakdown'. Replace with a render check, own round.
12. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
13. StreakCounter.tsx: stale comment; colour tokens to color.label and secondaryLabel.
14. Freeze strings at count 1 read wrongly.
15. Gym screen hardcoded strings 'Training', 'My schedule', 'My workouts', 'Session history' (gym.tsx ~151-156): decide per row, or record as English-only.
16. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? /gym/session second row (mutations.ts:173-178).
- Device checks: logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: Gels, Congelaciones, AI insights, My dishes, Macros wording, new gym.applyStreakFreeze es/fr.
- fr 'congélation' (new gym.applyStreakFreeze) vs existing 'gel' in gym.freeze strings. Recommended: 'Appliquer un gel de série'. Kept as written.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename gym.plannedExercisesNoDuration to plannedExercises? Which row records the StreakCounter wrap? 'Start workout' wording is not in the design.
- Should the freeze screen stay (design has none), and the freeze sentence on line 82?

## Parked
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood (mutations.ts:157) local only; server sync needs backend.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix (needs a data field).
- Row 17 rest-day exits, pop-in, ring vs flame. Streak flame pulses, artwork.
- Freeze sheet: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title follows today.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56.
- Recipe fibre saved as 0; num() rounds; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one.
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- LoadFailedNotice tap target: revisit only if a design failure state appears.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard or freeze. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Round log
R9-R82: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R96: TodayCard, freeze, profile, StreakCounter, LoadFailedNotice strings via t(). Row 114 accepted deviation recorded.
R97: LoadFailedNotice default message via t(); tsc and its tests run. Flagged as partly done: default unreachable.
R98: DONE. Default removed, message required at all 9 usages, common.loadFailedDefault deleted from en, es, fr. tsc 0. Built, not verified.
R99: 'Apply a streak freeze' in (tabs)/gym.tsx via t(gym.applyStreakFreeze). Keys added to en, es, fr. Row 82 reason cell line added. tsc 0. Locale tests not run, so the report was flagged.
R100: issued after a rejected prompt (design file not named). Reissued as verification-only: tsc, locale-file tests, key check. Matching design file design/Lume App.html, gap row 82.
