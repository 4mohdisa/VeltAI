# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- Gym Log button follows showLogCta. Gym tab shows today only. My schedule card shows three days.
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Bottom padding 158 (Gym, Summary, Food) is screen-only, not in TAB_BAR_CLEARANCE.
- Headers: FloatingHeader default 82, no height prop. Top padding stays insets.top + space.md, pending Isa.
- Row 112 accepted deviations (pending Isa): Training list, LoadFailedNotice, lumeFade mount-only and skipped under Reduce Motion, literal -0.6 tracking, 52pt right padding, page gap 14, eyebrow minHeight 26 on wrapper.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row and the branch rule.
- R256: adopted Jev's Food build pick. TAB_BAR_CLEARANCE kept in place; removal is parked.
- R257: completed the Food last-block footer gap first, to clear the flagged partly-done report. Fix is blockGap in food.tsx: 0 for the last meal block when the load failed, 14 otherwise.
- R258: Food Meal history link (food.tsx ~633) is kept as is until Isa decides. Removing it is a feature removal, so it is parked, not built. Row 85 stays partial until then.

## Status
- R258 (dispatched): checkpoint. tsc and full suite, no code changes unless tsc is red. Verifies the Food, Summary and Gym edits since R251.
- R257: Food last-block footer. tsc 0; tabNavigation 11/11. Not verified. Meal history link still sits above 158 when the load succeeds.
- R256: Food page values BUILT (bottom 158, header FloatingHeader 82, block gap 14). tsc 0; tabNavigation 11/11. Not verified.
- R254-255: Summary row 104 doc record; Food re-check done.
- R253: Summary values BUILT (bottom 158, header 82, card gap 14). tsc 0; tabNavigation 11/11.
- R251 checkpoint: tsc 0, 65/65 suites, 824/824 tests. Full suite not run since R251, so R258 is the next checkpoint.
- R240-248: lumeFade, eyebrow, title block, page gap 14, gym header 82, gym bottom 158, Log button, My schedule card, es/fr copy. BUILT, not verified.

## Open rows
- 83 DIFFERENT: sheet-in-place route parked; button height and type parked. Copy and icon BUILT.
- 85 DIFFERENT: food title block (eyebrow tracking 1 vs 1.1; title tracking 0 vs -0.6 and right padding 0 vs 52; block gap and bottom 4 vs 0; side padding 0 vs 4); no 12px calorie bar; no 'left today'; no 700ms fill; four-column wrap; top padding pending; Meal history link above 158 (not in design).
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 103 DIFFERENT (Macros detail): 176pt 7-day chart missing; card gap 12 vs 16; top padding and header; kicker, stat line, Breakdown dots differ.
- 104 PARTIAL (Summary): Steps card missing; four non-design items shown; scope Today only.
- 112 PARTIAL (Gym): GymPatternsCard typography blocked; Training list and LoadFailedNotice app-only.

## Next
1. R258 (dispatched): checkpoint, tsc plus full suite.
2. Re-check Gym top and bottom padding vs 70 and 158. Doc only.
3. Re-check header callers profile/index.tsx and Screen.tsx vs design. Doc only.
4. Re-check Summary differences 1-25, 29, 30. Doc only.
5. Row 85 food title block build in food.tsx, one file, one round.
6. Row 104 Steps card and scope: build or park.
7. Gym cluster, one file per round: GymSessionButton, GymCalendar, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts.
8. Nutrition, week, training and energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
9. Doc fixes once no build row is open: row 81 duplicates 112; row 83 and gym paragraphs; My schedule; accepted deviations; lumeFade wording.
10. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 85: 12px calorie bar; 'left today'; four-column wrap; Meal history link on Food (food.tsx:633): keep as a deviation or remove (recommend keep, nothing else opens /food/history).
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms transition; chip truncation incl. French.
- 112: GymPatternsCard padding 20 vs 16; Training list and LoadFailedNotice keep or remove (recommend keep).
- Top padding on Gym, Summary, Food: inset-tied or 70 (recommend inset-tied).
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow, title block, lumeFade and shadows, pull-to-refresh, tab bar es/fr, food row, offline failure, add menu wrap at 232pt, swipe dialogs, long es/fr text, gym button, Quick add bottom, My schedule weekday fr/es, bottom 158 notched and not, header 82 at small and large insets, Food block gap, Food last block gap with and without failed load.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review es/fr: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', 'Done', 'Close', GymStatusCard.tsx:30, scan.ts:305; MyScheduleCard weekday follows device language; Summary index.tsx:146, :149, :179.
- Copy: foodLog.per100; CaloriesCard g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; foodLog.savedAdded toast; + menu toast; toast fade; row 83 sheet-in-place.
- Gym button: 56pt vs 52; label 17/24 vs 16/21; duplicated Button pill styles; logged branch dead.
- Gym data: two getToday requests; MyScheduleCard double fetch, silent on failure, not refreshed on pull, 'N days planned' colour, pressed state; two LoadFailedNotices can stack; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: card pressed 0.85 vs light1; pull-to-refresh does not re-read TodayCard or Log button; GymPatternsCard server values.
- Food: TAB_BAR_CLEARANCE orphaned once Food changes (LumeTabBar.tsx:52; tests at tabNavigation.test.ts:100, render/tabbar.render.test.tsx:171, summaryDetails.test.ts:71); remove in a later tidy. _layout.tsx:26 and LumeTabBar.tsx:4 comments out of date.
- Food: Meal history link removal or keep is a feature decision; parked until Isa answers.
- Comments: gym.tsx header and :144; SegmentedField label; food.tsx:656-659.
- Easing bezier duplicated in gym.tsx and AddMenu.tsx.
- Code: SLOT_KEYS duplicated; StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SettingsList.tsx:129 identical branches; duplicate 'training' key.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render, header height.
- Doc: summary table Quick add '(line 86)'; stale lines in the gap doc (near 436, 446, 532, 586, 236, 310); row 87 repeated BUILT; line 103 unchecked.
- Screen.tsx:163: inset-based header height applies to every floating detail screen, including Macros detail.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. Three gym suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Gym bundle 7dc211f6. Summary bundle 185bb533. Food bundle 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets context at handover: name files fully.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.
- Gym, Summary and Food suites only read source text; nothing renders these screens.
- Row 85 Food footer: the 14 after the last meal is a literal, because no token covers it.

## Handover and Jev
- Handover in loop/HANDOVER.md every 15 rounds.
- Jev R256: run 74%, adopted the Food build pick (94%).
- Jev R257: run 82%, ask 17%, stop 1%; last task clean 78%; risk 1.5 (confidence 0.19). Run agreed.
- Jev R258: ask 51%, run 46%, stop 3%; last task clean 64%; risk 1.7 (confidence 0.48). Ran instead: open questions already with Isa; checkpoint needs no answer.