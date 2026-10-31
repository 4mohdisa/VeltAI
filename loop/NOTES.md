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
- summaryDetails.test.ts Breakdown check is strict for all four detail routes (R108, R109). Reads source text only; does not prove rendering.
- Rows that record a change in the reason cell do not change status while other differences remain (R111).
- R112 accepted as complete for its scope (tsc, changed-file tests, locale keys). The rendered Gym Training labels are a device check for Isa, not a test gap the loop fills (no new suites).
- Handover item 'default message Couldn't load the latest.' conflicts with R98. Check the code before acting on it.

## Status
24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT. Last checkpoint R89 green (tsc 0, 65 suites, 824 tests). R102 checkpoint never reported; re-issue later.
R110 gym.tsx Training labels: BUILT, not verified. R112 checked: tsc 0, 3 suites / 24 tests pass, four gym.* keys present in en, es, fr. Those tests do not cover the labels. Device check pending.
R108 render check: detailChrome.render.test.tsx 4 tests, 4 snapshots, English Breakdown on Energy, Week, Training, Macros. R109: summaryDetails 47 tests pass, tsc 0.

## Next
1. R114 (reissued after R113 was rejected for not naming design/Lume App.html): LoadFailedNotice.tsx header comment lines 4-5; confirm no default message prop. tsc once, changed-file tests only.
2. StreakCounter.tsx: stale line 2 comment; colour tokens to color.label and secondaryLabel.
3. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
4. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
5. PlannedValuesForm.tsx:200 'Add exercise' vs design.
6. add.tsx slotKey (~67): remove unused keys if confirmed.
7. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
8. Doc only: gap line 82 stray br; line 76 record Try again; MACRO_PRECISION comment; lines 90, 1014, 1495; line 1505 cites lines 72-75, now table rows. Line 437 cites gym.tsx:94-158, stale.
9. /gym/session saves top weight on all sets: fix or park.
10. week.tsx English copy ('This week', 'In & out', 'Daily net', footer): per row or English-only.
11. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
12. Freeze strings at count 1 read wrongly.
13. training.tsx remaining English copy ('Workouts', 'Minutes trained', 'Training energy'): per row or English-only.
14. energy.tsx remaining English copy ('Energy balance', 'In and out', 'Intake', 'Total burned'): per row or English-only.
15. Re-issue read-only checkpoint (full tsc and full app suite).
16. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? mutations.ts:173-178.
- Device checks: Gym Training labels (en, es, fr, rendered), logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: Gels, Congelaciones, AI insights, My dishes, Macros wording, gym.applyStreakFreeze, gym.training, gym.mySchedule, gym.myWorkouts, gym.sessionHistory.
- fr 'congélation' vs 'gel' (gym.applyStreakFreeze). Recommended 'Appliquer un gel de série'; kept as written.
- fr Breakdown: 'Détail' vs 'Répartition'. Recommended 'Répartition'.
- Gap row for Week and Training Breakdown (and Energy, if it needs its own row). Also whether a Week row should exist for the gap-doc line on week.tsx.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename plannedExercisesNoDuration to plannedExercises?
- Which row records the StreakCounter wrap? 'Start workout' is not in the design.
- Keep freeze screen (design has none, tests call it parked), and the freeze sentence on line 82?
- Gym Training labels: 'Training' and 'Session history' have no design copy. Recorded in row 112; Isa to confirm.

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

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard, freeze, LoadFailedNotice or the Gym Training labels. No repo test loads the locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). Breakdown checks read source text only.

## Gotchas
- Briefs repeat finished work, quote stale lines and name strings that don't exist. Check first.
- Design copy is encoded: decode the __bundler/manifest script with node. Raw grep misses it. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- The third Breakdown screen is src/app/energy.tsx, not src/app/dashboard/energy.tsx. The training file is src/app/dashboard/training.tsx, not src/app/training.tsx.
- Locale files live in src/lib/i18n/locales/ (src/locales does not exist).
- Summary of earlier handover (R105-R109 Breakdown work) is complete; do not redo it.

## Round log
R9-R89: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R98: strings via t(), LoadFailedNotice message required, row 114 deviation recorded.
R99-R100: streak freeze string via t(); flag cleared.
R101: rejected (three files).
R102: checkpoint issued, never reported.
R103-R109: Breakdown via t() on week, training, energy, macros; strict test check built and passing.
R110: gym.tsx lines 151-156 labels to t(). BUILT, not verified.
R111: row 112 reason cell records the Gym Training labels (doc only, tsc only).
R112: loop flag on R111 (tests not run for R110). Checked: tsc 0, changed-file tests pass, keys in all three locales. Flag treated as addressed; render check moved to device check.
R113: issued. LoadFailedNotice header comment; check for a default message prop. REJECTED by loop: prompt did not name design/Lume App.html.
R114: reissued with design/Lume App.html and row 114 named, same single task.