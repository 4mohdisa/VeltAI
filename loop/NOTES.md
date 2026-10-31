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
- Bottom padding 158 (gym and Summary) is screen-only, not in TAB_BAR_CLEARANCE.
- Gym and Summary header: FloatingHeader default 82, no height prop.
- Top padding stays insets.top + space.md on Gym and Summary, pending Isa.
- Row 112 accepted deviations (pending Isa): Training list, LoadFailedNotice, lumeFade mount-only and skipped under Reduce Motion, literal -0.6 tracking, 52pt right padding, page gap 14, eyebrow minHeight 26 on wrapper.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html, the gap row and the branch rule.
- R252: followed the Summary re-check over Jev's first pick (Jev confidence 0.02).
- R253: adopted Jev's Summary values build (94%).
- R254: finished row 104 doc record first, to clear the R253 flag.
- R255: Food re-check chosen, with the type check included to clear the R254 flag (no tsc run in R254).

## Status
- R254: row 104 doc record finished. Doc only. Flagged: no type check run.
- R255 (dispatched): tsc run plus Food bottom padding and header re-check. Doc only.
- R253: row 104 values BUILT (bottom 158, header 82, card gap 14). Not verified. tsc 0; tabNavigation 11/11.
- R251 checkpoint: tsc 0, 65/65 suites, 824/824 tests.
- R240-248: lumeFade, eyebrow, title block, page gap 14, gym header 82, gym bottom 158, Log button, My schedule card, es/fr copy. BUILT, not verified.

## Open rows
- 83 DIFFERENT: sheet-in-place route parked; button height and type parked. Copy and icon BUILT (gym.logThisSession en/es/fr, trailing chevron-up).
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 103 DIFFERENT (Macros detail): 176pt 7-day chart missing; card gap 12 vs 16; top padding 115 vs 110 and header 79 vs 82 at 59 inset; kicker, stat line, Breakdown dots differ. Bottom padding and back button not compared.
- 104 PARTIAL (Summary): top padding pending Isa; Steps card missing; four non-design items shown; scope Today only.
- 112 PARTIAL (Gym): top padding pending Isa; GymPatternsCard typography blocked; Training list, LoadFailedNotice and pull-to-refresh app-only.

## Next
1. R255 (dispatched): tsc + Food bottom padding and header re-check. Doc only.
2. Re-check Gym top and bottom padding vs design 70 and 158. Doc only.
3. Re-check header callers profile/index.tsx and Screen.tsx vs design. Doc only. Screen.tsx affects floating detail screens.
4. Re-check Summary differences 1-25, 29, 30. Doc only. Difference 25 eyebrow tracking at index.tsx.
5. Row 104 Steps card and scope: build or park.
6. Gym cluster, one file per round: GymSessionButton, GymCalendar, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts.
7. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
8. Shared TAB_BAR_CLEARANCE bottom for Food, after its row is re-checked.
9. Doc fix once no build row is open: row 81 duplicates 112 (keep 112); row 83 and gym App paragraphs; My schedule; accepted deviations; lumeFade 'no page entrance animation' is wrong.
10. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- 85: 12px calorie bar; 'left today'; four-column wrap.
- 87: 17/24 vs 17/22; bottom spacing; figure and meal defaults; 180ms transition; chip truncation incl. French.
- 112: GymPatternsCard padding 20 vs 16; Training list and LoadFailedNotice keep or remove (recommend keep).
- Top padding on Gym and Summary: inset-tied or 70 (recommend inset-tied).
- Gym Log button hidden on rest days and with no schedule: acceptable?
- Device checks: eyebrow, title block, lumeFade and shadows, pull-to-refresh, tab bar es/fr, food row, offline failure, add menu wrap at 232pt, swipe dialogs, long es/fr text, gym button, Quick add bottom, My schedule weekday fr/es, bottom 158 notched and not, header 82 at small and large insets.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review es/fr: 'Log this session', 'Registrar esta sesion', 'Enregistrer cette seance'.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', 'Done', 'Close', GymStatusCard.tsx:30, scan.ts:305; MyScheduleCard weekday follows device language; Summary index.tsx:146, :149, :179 hardcoded English, accessibility label, 'Macros'/'Today', toast.
- Copy: foodLog.per100; CaloriesCard g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 'Updated {name}' toast; foodLog.savedAdded toast; + menu toast; toast fade; row 83 sheet-in-place.
- Gym button: 56pt vs 52; label 17/24 vs 16/21; duplicated Button pill styles; logged branch dead.
- Gym data: two getToday requests; MyScheduleCard double fetch, silent on failure, not refreshed on pull, 'N days planned' colour, pressed state; two LoadFailedNotices can stack (TodayCard.tsx:197, gym.tsx); per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Gym UI: card pressed 0.85 vs light1; pull-to-refresh and focus do not re-read TodayCard or Log button; GymPatternsCard server values.
- Comments: TAB_BAR_CLEARANCE and _layout.tsx:26; gym.tsx header and :144; SegmentedField label; food.tsx:656-659.
- Easing bezier duplicated in gym.tsx and AddMenu.tsx.
- Code: SLOT_KEYS duplicated; StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SettingsList.tsx:129 identical branches; duplicate 'training' key.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, gym.tsx render, MyScheduleCard render, header height.
- Doc: summary table Quick add '(line 86)'; stale lines 895-897, 930, 934, 1017, 1058, 1504; stale ref near 1518; row 87 repeated BUILT; line 103 unchecked; stale text near 586, 436, 446, 532; lines 236, 310.
- Screen.tsx:163: inset-based header height applies to every floating detail screen, including Macros detail.
- _layout.tsx:26 and TAB_BAR_CLEARANCE comment say each tab pads itself, not true for Summary or Gym.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. Three gym suites read source text only.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Gym bundle 7dc211f6. Summary bundle 185bb533.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Capture exit codes.
- Claude Code forgets context at handover: name files fully.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing. Say BUILT, never verified.
- Gym tab and Summary: the three gym suites only read source text; nothing renders these screens.

## Handover and Jev
- Handover in loop/HANDOVER.md every 15 rounds.
- Jev R251-253: run agreed or adopted each time; R253 ask not used.
- Jev R254: run 85%, ask 13%, stop 2%; last task clean 87%; risk 1.3.
- Jev R255: run 72%, ask 25%, stop 3%; last task clean 10%; risk 1.1 (confidence 0.46). Run agreed.