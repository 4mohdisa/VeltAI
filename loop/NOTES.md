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
- R100 flag treated as cleared: tsc 0, locale JSON parses, key present in en, es, fr. No repo test loads the locale files.
- One task per prompt. Multi-file prompts get rejected (R101). Split by file.
- Breakdown label: dashboard.breakdown is 'Détail' in fr as Isa specified (R104). Kept despite mismatch with nutrition.breakdown 'Répartition'. Native review still open.

## Status
24 DIFFERENT, 14 PARTIAL, 4 BUILT, 0 EXACT (recheck header). Last checkpoint R89 green (tsc 0, 65 suites, 824 tests).
R99 built. R100 verification done; flag treated as cleared.
R101 REJECTED (three files; design/ file not named).
R103 built: 'Breakdown' via t() on src/app/dashboard/week.tsx. Result reported: label built, gap line not added (no table row), summaryDetails.test.ts:65 still checks the raw word. Loop flagged the report as partly done.
R104 issued: fix summaryDetails.test.ts:65 to check for t('dashboard.breakdown'). One file.
R102 checkpoint: result never reported. Re-issue as read-only checkpoint later.

## Next
1. R104 ISSUED: summaryDetails.test.ts:65 assertion checks for t('dashboard.breakdown') in week.tsx. Run tsc once and that test file only.
2. Doc only: add 'BUILT: Breakdown via t() on week.tsx. Status unchanged, other differences remain.' inside the inventory item near DESIGN_GAP_ANALYSIS.md line 364. tsc only.
3. 'Breakdown' via t() on src/app/dashboard/training.tsx only, using dashboard.breakdown.
4. 'Breakdown' via t() on src/app/energy.tsx:205 only (correct path), using dashboard.breakdown.
5. LoadFailedNotice.tsx lines 4-5 header comment: remove the 'we could not load the latest' wording (default removed R98).
6. StreakCounter.tsx: stale line 2 comment; colour tokens to color.label and secondaryLabel.
7. One file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
8. food.tsx ~445 empty copy. Dedupe SLOT_KEYS. Resolve food.savedTitle vs addMenu.myDishes.
9. PlannedValuesForm.tsx:200 'Add exercise' vs design.
10. add.tsx slotKey (~67). Remove unused keys if confirmed.
11. Raw item values: food.tsx:852, :895; food/saved.tsx:144. Park if no design decision.
12. Doc only: gap line 82 stray br; line 76 record Try again change; MACRO_PRECISION comment; lines 1014 on unchecked; line 90 merge; line 1495 stale; line 1505 cites lines 72-75 which are now table rows.
13. /gym/session saves top weight on all sets. Fix or park.
14. week.tsx remaining English copy ('This week', 'In & out', 'Daily net', footer note): decide per row or record as English-only.
15. nutrition.tsx:120 '80%' vs '80 %'; :164 and :180 raw meal.slot.
16. Freeze strings at count 1 read wrongly.
17. Gym screen hardcoded strings 'Training', 'My schedule', 'My workouts', 'Session history' (gym.tsx ~151-156): decide per row, or record as English-only.
18. Re-issue read-only checkpoint (full tsc and full app suite).
19. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Already-logged days: edit or toast? /gym/session second row (mutations.ts:173-178).
- Device checks: logged card, offline failure, double notice (gym.tsx:107), TodayCard sub-line.
- Rows 90, 330, 334, 89, 23, 17; log-sheet BUILT?; footnote '23 sessions 2 freezes'.
- Food detail differences 1, 2, 4; verdicts at lines 961, 1210.
- Search routing; global + title; quick add serving order; add sheet 0pt gap; 'Snacks' label.
- Native es/fr review: Gels, Congelaciones, AI insights, My dishes, Macros wording, new gym.applyStreakFreeze es/fr.
- fr 'congélation' (gym.applyStreakFreeze) vs existing 'gel' in gym.freeze strings. Recommended: 'Appliquer un gel de série'. Kept as written.
- Group names; training list; profile row; streak wording; GetToday flag.
- Log as planned: minutes as note text; energy literals; remaining-kcal line.
- Users without body stats see 1,500 kcal; design uses 2,100.
- TodayCard: wash pill token; whole-day kcal; chevron before tappable.
- Volume fix; heatmap wording; calories cell needs a backend field.
- Rename gym.plannedExercisesNoDuration to plannedExercises?
- Which row records the StreakCounter wrap (removed from line 82)? 'Start workout' wording is not in the design.
- Should the freeze screen stay (design has none), and the freeze sentence on line 82?
- Fr 'Breakdown' wording: Isa specified 'Détail'; recommended 'Répartition' for consistency. Kept Détail unless Isa replies.

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
- Recipe fibre saved as 0; num() rounds; unused keys dashboard.welcome, gymBedtime, lastLoggedDaysAgo_one; nutrition.breakdown and dashboard.breakdown duplicate (merge once fr settled).
- Untraced: other goals.calories screens; Math.max NaN if a profile field is undefined.
- LoadFailedNotice tap target: revisit only if a design failure state appears.

## Accepted limits
Failure paths untested. Null-as-failure assumes getToday never returns null for a real response. Fibre uses > 0. Saved-food edits local only. No test renders profile, StreakCounter, TodayCard or freeze. No repo test loads the locale files. Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Round log
R9-R82: most surfaces built. Checkpoints R34, R48, R61, R77, R89 green.
R90-R96: TodayCard, freeze, profile, StreakCounter, LoadFailedNotice strings via t(). Row 114 accepted deviation recorded.
R97: LoadFailedNotice default message via t(); flagged partly done.
R98: default removed, message required at all 9 usages, common.loadFailedDefault deleted. tsc 0. Built, not verified.
R99: 'Apply a streak freeze' in (tabs)/gym.tsx via t(gym.applyStreakFreeze). tsc 0. Locale tests not run; flagged.
R100: verification-only. Flag treated as cleared; fr wording still blocked on Isa.
R101: REJECTED (three files; no design/ file named).
R102: checkpoint issued, result never reported.
R103: 'Breakdown' via t() on week.tsx. tsc 0, locale parse OK, 2 suites passed. Gap line not added (no table row; inventory item only). summaryDetails.test.ts:65 still checks raw word. Flagged partly done.
R104: issued, summaryDetails.test.ts:65 check changed to t('dashboard.breakdown').

LATEST CLAUDE CODE REPORT: R103 (see round log). Outstanding: test source-check (R104 now), gap line (doc round next), fr wording and review, device check.

LATEST HANDOVER SUMMARY: see loop/HANDOVER.md. Key points: no git from Claude Code; say BUILT, never verified; design source is design/Lume App.html (decode __bundler/manifest with node); zsh breaks on unquoted globs; use LC_ALL=C /usr/bin/grep.

GOTCHAS
- Briefs repeat finished work, quote stale lines and name rows or strings that don't exist; check first.
- Design copy is encoded: decode from the __bundler/manifest script with node. Raw grep misses it.
- zsh breaks on echo === and unquoted globs; quote (tabs) paths.
- grep exiting 1 means no match. Use LC_ALL=C /usr/bin/grep.
- The third Breakdown screen is src/app/energy.tsx, not src/app/dashboard/energy.tsx.