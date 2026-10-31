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
- Rows stay DIFFERENT while other differences remain. A row that only records a change in its reason cell keeps its status.
- Citations: insertion at line N moves only citations at or after N.
- Checkpoint rounds read-only. Doc-only rounds: tsc only.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts name the branch and forbid git.
- Every prompt names the matching design/ file and gap row. One task, one file per prompt.
- Tests: tsc once plus changed-file tests. 'No related tests found' is not a pass.
- Backend-dependent items stay Parked.
- LoadFailedNotice: no design counterpart. minTapTarget={false} kept (row 114). Message required, no default (R98, R114).
- Handover default message 'Couldn't load the latest.' was removed in R114 (conflicts with R98). Do not restore.
- fr Breakdown is 'Détail' as Isa specified, pending his choice.
- summaryDetails.test.ts Breakdown check is strict for all four detail routes. It reads source text only.
- R112 accepted for its scope. Rendered Gym Training labels are a device check for Isa, not a loop test gap.
- R115: LoadFailedNotice has no render test. Accepted as NOT COVERED. No new test suites (brief rule). Isa verifies on device.

## Status
24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT (counts from R89; later changes recorded in the round log, not recounted). Last green checkpoint R89 (tsc 0, 65 suites, 824 tests). R102 checkpoint never reported. R117 checkpoint issued (read-only, tsc and full app suite), result not yet reported.
R114 LoadFailedNotice: BUILT, not verified. NOT COVERED (R115: no test imports or renders it).
R116 week.tsx: four strings BUILT, not verified. Remaining hardcoded copy in week.tsx flagged in the R116 report (partly done).

## Next
1. R117 checkpoint result: handle any failures first. If still not reported, re-issue per item 14.
2. StreakCounter.tsx (R118, in progress): stale line 2 comment; colour tokens to color.label and secondaryLabel. No gap row edited.
3. week.tsx: remaining hardcoded copy from the R116 report (labels and units, empty states, sentences, accessibility summaries at lines 146 and 177), with es and fr keys.
4. training.tsx and energy.tsx: remaining hardcoded copy, per row or English-only (see item 13).
5. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
6. food.tsx ~445 empty copy; dedupe SLOT_KEYS; resolve food.savedTitle vs addMenu.myDishes.
7. PlannedValuesForm.tsx:200 'Add exercise' vs design.
8. add.tsx slotKey (~67): remove unused keys if confirmed.
9. Raw item values food.tsx:852, :895 and food/saved.tsx:144: park if no design decision.
10. Doc only: gap line 76 record Try again; MACRO_PRECISION comment; lines 90, 1014, 1495; line 1505 cites 'lines 72-75'; line 437 cites gym.tsx:94-158 (stale). Row 112 'padding 20 vs 16' may be stale: check first.
11. /gym/session saves top weight on all sets: fix or park.
12. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
13. Freeze strings at count 1 read wrongly.
14. Re-issue read-only checkpoint (full tsc and full app suite) if R117 was not clean or was not reported.
15. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? (mutations.ts:173-178)
- Device checks: Gym Training labels (en, es, fr), logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line, LoadFailedNotice on screen (R115 NOT COVERED).
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: Gels, Congelaciones, AI insights, My dishes, Macros wording, new gym.* keys, week.tsx new keys (R116), including 'Ingesta y gasto' and 'Apport et dépense' fit in the segmented control.
- fr: 'gel' vs 'congélation' (recommend 'Appliquer un gel de série'); Breakdown 'Détail' vs 'Répartition' (recommend 'Répartition').
- Which row records week.tsx, or whether a Week row should exist.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename plannedExercisesNoDuration; keep freeze screen; which row records StreakCounter wrap; 'Start workout' and 'Training' / 'Session history' labels.

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
- Briefs repeat finished work, quote stale lines and name strings or paths that don't exist. Check first.
- Design copy is encoded: decode the __bundler/manifest script with node. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh: quote (tabs) paths and globs. Use LC_ALL=C /usr/bin/grep; exit 1 means no match.
- Correct paths: src/app/energy.tsx (not dashboard/energy.tsx); src/app/dashboard/training.tsx (not src/app/training.tsx); locales in src/lib/i18n/locales/ (src/locales does not exist).
- test.each assertions are shared across routes.

## Round log
R9-R89: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R98: strings via t(); LoadFailedNotice message required; row 114 deviation recorded.
R99-R100: streak freeze string via t(); flag cleared.
R101: rejected (three files). R102: checkpoint issued, never reported.
R103-R109: Breakdown via t() on week, training, energy, macros; strict test check passing.
R110: gym.tsx Training labels via t(). BUILT, not verified.
R111-R112: row 112 reason cell recorded; tsc, changed-file tests and locale keys checked.
R113: rejected (design file not named).
R114: LoadFailedNotice header fixed, default removed. Handover flagged for failed or missing checks; R115 re-checks.
R115: check-only. tsc 0. Hydration tests 16 passed, 2 suites. LoadFailedNotice: message required, no default; NOT COVERED (no test imports or renders it). Recommendation for a render test declined under the no-new-tests rule.
R116: week.tsx copy to t(), new es/fr keys flagged for review. Report flagged as partly done (remaining hardcoded copy listed).
R117: read-only checkpoint issued (tsc and full app suite, no file changes). Chosen over week.tsx leftovers per checkpoint rule. Result not yet reported.
R118: rejected (design file not named). Reissued as StreakCounter.tsx task, naming design/Lume App.html. No gap row edited.