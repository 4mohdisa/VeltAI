# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- Gym Log button follows showLogCta. Gym tab shows today only. My schedule card shows three days.
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Gym top padding stays inset-tied (insets.top + space.md). Literal 70 leaves 8pt at 62 inset. Pending Isa.
- Gym bottom padding 158 is gym-only, not in shared TAB_BAR_CLEARANCE. Summary bottom 158 follows the same rule (R253).
- Gym header uses FloatingHeader default 82, no height prop. Matches design at 62 inset.
- Row 112 accepted deviations (pending Isa): Training list, LoadFailedNotice, lumeFade mount-only and skipped under Reduce Motion, literal -0.6 tracking, 52pt right padding, page gap 14, eyebrow minHeight 26 on wrapper.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row, and the branch rule.
- R252: followed the Summary re-check over Jev's first pick of the same task (Jev confidence 0.02, gap doc only, low risk).
- R253: adopted Jev's Summary page values build (94%). Scope: bottom 158, header 82, card gap 14. Top padding left inset-based, pending Isa.

## Status
- R253: Summary page values build (row 104). Dispatched. Includes tsc and tabNavigation.test.ts, to clear the flag on the R252 report.
- R252: Summary bottom padding (design 158) and header height re-check, gap doc only. Re-checked rows 103 and 104. Row 103 still DIFFERENT, row 104 PARTIAL.
- R251: checkpoint. Full tsc and app suite, no file changes. tsc 0, 65/65 suites, 824/824 tests.
- R250: checkpoint reported green. Header matches; top padding differs (pending Isa).
- R246-248: gym header default 82; gym bottom padding 158. BUILT.
- R240-245: lumeFade, eyebrow, title block, page gap 14. BUILT.
- R207-235: rows 83, 85, 86, 87 parts; Log button, My schedule card, es/fr copy. BUILT.

## Open rows
- 83 DIFFERENT: sheet-in-place route parked; button height and type parked.
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 103 DIFFERENT (Macros detail, re-checked R252): 176pt 7-day chart missing; Meals today, LoadFailedNotice and HealthDisclaimer app-only; card gap 12 vs 16; top padding 115 vs 110 at 59 inset; header 79 vs 82 at 59 inset; kicker, stat line and Breakdown dots differ. Bottom padding and back button not yet compared.
- 104 PARTIAL (Summary tab, re-checked R252): page values built in R253 (bottom 158, header 82, card gap 14). Top padding still inset-based (pending Isa). Steps card missing; four non-design items shown; scope fixed to Today.
- 112 PARTIAL: top padding inset-tied (pending Isa). GymPatternsCard typography blocked. Pull-to-refresh app-only.

## Next
1. R253 (dispatched): Summary page values build for row 104, plus tabNavigation.test.ts update.
2. Re-check Food bottom padding and header height (food.tsx) vs its design. Gap doc only.
3. Re-check header callers profile/index.tsx and Screen.tsx vs designs. Gap doc only. Screen.tsx also affects floating detail screens, including Macros detail.
4. Re-check Summary differences 1-25, 29 and 30 (gap doc only). Difference 25 eyebrow still 1 vs 1.1 tracking at index.tsx:97.
5. Summary Steps card and scope (row 104): decide build or park once rows are re-checked.
6. Gym cluster, one file per round: GymSessionButton, GymCalendar, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts.
7. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
8. Shared TAB_BAR_CLEARANCE bottom value for Food, only after its row is re-checked.
9. Doc fix once no build row is open: lines 236, 310; row 81 duplicates 112 (keep 112); row 83 App paragraph near 540; gym App paragraph near 444, Differences near 454; My schedule near 594; record accepted deviations; lumeFade 'no page entrance animation' is wrong. Line numbers moved about 8 lines after R252.
10. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 85: 12px calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms transition; chip truncation incl. French.
- 112: GymPatternsCard padding 20 vs 16. Training list and LoadFailedNotice keep or remove (recommend keep). Gym top padding inset-tied or 70.
- Summary top padding inset-tied or 70 (same question as gym; recommend inset-tied).
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow centring; title block; lumeFade and shadows; pull-to-refresh; tab bar es/fr; food row; offline failure; add menu wrap at 232pt; swipe dialogs; long es/fr text; gym button position, width, French label, chevron; Quick add bottom; My schedule spacing and short weekday fr/es; gym bottom 158 on notched and non-notched; header 82 at small and large insets; Summary bottom 158 with the tab bar.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review es/fr: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', 'Done', 'Close', GymStatusCard.tsx:30, scan.ts:305; MyScheduleCard weekday follows device language.
- Summary hardcoded English: index.tsx:147 (accessibility label), :150 ('Macros', 'Today'), :180 (toast).
- Copy: foodLog.per100; CaloriesCard g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; foodLog.savedAdded toast; + menu toast; row 83 sheet-in-place; gym toast fade.
- Gym button: 56pt vs 52; label 17/24 vs 16/21; duplicated Button pill styles; logged branch dead; two logged sources.
- Gym data: two getToday requests; MyScheduleCard fetches twice, silent on failure, not refreshed on pull; two LoadFailedNotices can stack (TodayCard.tsx:197, gym.tsx); per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: card pressed 0.85 vs light1; 'N days planned' colour; pull-to-refresh and focus do not re-read TodayCard or Log button; GymPatternsCard server values.
- Shared TAB_BAR_CLEARANCE: Food still 100 at 34 inset vs 158; stale comments in TAB_BAR_CLEARANCE and _layout.tsx:26 (Gym and Summary no longer pad with it).
- Easing bezier duplicated in gym.tsx and AddMenu.tsx.
- Stale comments: gym.tsx header (old card order); gym.tsx:144; SegmentedField label; food.tsx:656-659.
- Code: SLOT_KEYS duplicated; StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SettingsList.tsx:129 identical branches; duplicate 'training' key.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render, header height.
- Doc: summary table Quick add '(line 86)'; stale lines 895-897, 930, 934, 1017, 1058, 1504; stale reference near line 1518 citing Summary detail 'lines 72-75'; row 87 repeated BUILT; line 103 unchecked.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. Three gym suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Gym bundle 7dc211f6. Summary bundle 185bb533.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Capture exit codes explicitly; the R250 exit code came back blank.
- Claude Code forgets context at handover: name files fully.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.

## Handover and Jev
- Handover in loop/HANDOVER.md, received after R244. Script-managed every 15 rounds.
- Jev R248-250: run agreed; header fix, then verification rounds.
- Jev R251: run 50%, ask 33%, stop 17%, last task clean 74%, risk 1.2. Run agreed; checkpoint chosen.
- Jev R252: ranked Summary re-check first at 82%; my pick matched it. Next action stop 35%, ask 34%, run 31% (confidence 0.02). Last task clean 54%. Risk 1.4. Run kept: gap-doc-only task.
- Jev R253: ranked Summary page values build first at 94%. Next action ask 51%, run 47% (confidence 0.26). Last task clean 8%. Risk 1.6 (confidence 0.40). Adopted the build, scoped to the three values above. Ask not used: Isa's defaults cover the open items, and the top-padding question is already in Blocked on Isa.