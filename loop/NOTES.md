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
- Every prompt names the matching design/ file and gap row. One task, one file per prompt (R101 rejected multi-file).
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass.
- Backend-dependent items stay Parked.
- LoadFailedNotice: no design counterpart. minTapTarget={false} kept (row 114). Message required, no default (R98).
- R100 flag cleared: tsc 0, locale JSON parses, key in en, es, fr.
- fr Breakdown is 'Détail' as Isa specified, despite nutrition.breakdown 'Répartition'.
- summaryDetails.test.ts Breakdown check (R104, widened for training in R106) picks the key for 'week', 'training' and, from R108, 'energy', and the word 'Breakdown' for other routes. It reads source text only and does not prove rendering.

## Status
24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last checkpoint R89 green (tsc 0, 65 suites, 824 tests). R102 checkpoint never reported; re-issue later.

## Next
1. summaryDetails.test.ts: widen Breakdown check to energy.tsx (issued R108, test file only). Also run render/detailChrome.render.test.tsx and report its result.
2. Doc only: record Week and Training Breakdown once Isa picks a row.
3. LoadFailedNotice.tsx lines 4-5: remove old default-copy wording from header comment.
4. StreakCounter.tsx: stale line 2 comment; colour tokens to color.label and secondaryLabel.
5. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
6. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
7. PlannedValuesForm.tsx:200 'Add exercise' vs design.
8. add.tsx slotKey (~67): remove unused keys if confirmed.
9. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
10. Doc only: gap line 82 stray br; line 76 record Try again; MACRO_PRECISION comment; lines 90, 1014, 1495; line 1505 cites lines 72-75, now table rows.
11. /gym/session saves top weight on all sets: fix or park.
12. week.tsx English copy ('This week', 'In & out', 'Daily net', footer): per row or English-only.
13. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
14. Freeze strings at count 1 read wrongly.
15. gym.tsx ~151-156 'Training', 'My schedule', 'My workouts', 'Session history': per row or English-only.
16. training.tsx remaining English copy ('Workouts', 'Minutes trained', 'Training energy'): per row or English-only.
17. energy.tsx remaining English copy ('Energy balance', 'In and out', 'Intake', 'Total burned'): per row or English-only.
18. Re-issue read-only checkpoint (full tsc and full app suite).
19. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? mutations.ts:173-178.
- Device checks: logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: Gels, Congelaciones, AI insights, My dishes, Macros wording, gym.applyStreakFreeze.
- fr 'congélation' vs 'gel' (gym.applyStreakFreeze). Recommended 'Appliquer un gel de série'; kept as written.
- fr Breakdown: 'Détail' vs 'Répartition'. Recommended 'Répartition'.
- Gap row for Week and Training Breakdown (and Energy, if it needs its own row).
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename plannedExercisesNoDuration to plannedExercises?
- Which row records the StreakCounter wrap? 'Start workout' is not in the design.
- Keep freeze screen (design has none) and the freeze sentence on line 82?

## Parked
- Quick add serving: FoodResult (src/lib/mock/data.ts:124) lacks serving data.
- editSavedFood local only (mutations.ts:157); server sync needs backend.
- Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration, cardio planned minutes, custom exercise route, PlannedValuesForm submit.
- TodayCard: muscle prefix, header dot, min-height, gaps, pill type, grid, stale burn, per-session kcal, plan.sub prefix (needs data field).
- Row 17 rest-day exits, pop-in, ring vs flame. Streak flame pulses, artwork.
- Freeze: singular counts; toast before server reply; refusal unhandled; stale params streak.tsx:73.
- Logged card tap target needs a day route. Macros history chart. Percent-of-target title.
- fr 'Ajouter a {{slot}}'; plan.addTitle es/fr; '14-day' hyphen.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; duplicate nutrition.breakdown and dashboard.breakdown (merge once fr settled).
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- Test weakness: summaryDetails macros check passes on BreakdownRow and comments alone, although the route uses t('nutrition.breakdown'). Test-only fix, next round after energy.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard or freeze. No repo test loads the locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Breakdown checks read source text only.

## Gotchas
- Briefs repeat finished work, quote stale lines and name strings that don't exist. Check first.
- Design copy is encoded: decode the __bundler/manifest script with node. Raw grep misses it.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- The third Breakdown screen is src/app/energy.tsx, not src/app/dashboard/energy.tsx. The training file is src/app/dashboard/training.tsx, not src/app/training.tsx.

## Round log
R9-R89: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R98: strings via t(), LoadFailedNotice message required, row 114 deviation recorded.
R99-R100: streak freeze string via t(); flag cleared.
R101: rejected (three files).
R102: checkpoint issued, never reported.
R103: Breakdown on week.tsx via t(). Gap line not added. Flagged partial.
R104: test check widened by route, passes. Test is weak for non-week routes.
R105: training.tsx Breakdown via t('dashboard.breakdown'). Flagged partial by loop.
R106: widening of summaryDetails.test.ts to training done. Loop flagged the round as partly done: energy.tsx still hardcoded.
R107: energy.tsx line 207 Breakdown via t('dashboard.breakdown'), one file, plus useTranslation import and hook in Body. Type check exit 0, summaryDetails.test.ts passes. Loop flagged as partial because the energy check is still loose and the render test was not run.
R108: issued. Widen summaryDetails.test.ts Breakdown check to energy (test file only). Run detailChrome.render.test.tsx without editing it.