# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only (no switch, push, merge). Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain. Checkpoint rounds read-only.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary, totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- SegmentedField compact drops chip padding and shrink; only Quick add passes it.
- Gym Log button follows design showLogCta. No not-past check: Gym tab shows today only.
- Saving 0 kcal allowed. Design wins on zero-kcal confirm state.
- Swipe colour: color.primary until Isa decides. Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Doc fixes wait until no build row is open. Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Every prompt names design/Lume App.html (bundle id), the gap row, and the branch rule.

## Status
- R231 (now): row 112 My schedule card, re-check then build.
- R230: row 83 and CTA section doc updated.
- R227, R229: Log button under session card; visibility per showLogCta. BUILT.
- R218-R223: row 87 items c, d, e; chip padding and label shrink. BUILT.
- R207: row 85 macro bars; row 86 food detail. BUILT.
- R222 checkpoint: app 65/65 suites, 824/824.

Open rows:
- 83 DIFFERENT: copy ('Log gym session' vs 'Log this session'); leading barbell vs trailing 15px chevron-up at 0.7; route pushes sheet vs opens in place.
- 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- 87 DIFFERENT: 180ms Meal chip transition missing.
- 112 PARTIAL: My schedule card; four-row Training list; LoadFailedNotice; pull-to-refresh; card gap 14 vs 12; eyebrow tracking and min height; title tracking, padding and gap; lumeFade entrance.

## Next
1. R231: row 112 My schedule card.
2. Row 112: Training list, LoadFailedNotice, pull-to-refresh, lumeFade, header typography. One per round, re-checked first.
3. Row 83: copy, then icon. One per round.
4. Row 112 GymPatternsCard typography once padding is answered.
5. Gym cluster, one file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. Gap doc lines 310 and 236 contradict row 83. Fix when no build row is open.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; four-column wrap (es 'Carbohidratos').
- Row 87: confirm 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt; figure and meal defaults; 180ms transition; chip truncation incl. French.
- Row 112: GymPatternsCard padding 20 vs 16; whether the app-only card stays.
- Gym Log button hidden on rest days and with no schedule. Acceptable?
- Device checks: tab bar es/fr width; Training labels; food row; offline failure; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; gym button position; Quick add bottom spacing and KeyboardAvoidingView.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts.
- Design questions: food.title shared; empty day layout; edit or toast for logged days; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; sheet title mode; gymLog calories key; kJ at food.tsx:912; disc glyph strokes.
- TestPG_* (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit; hardcoded 'Quick add', NumberEntryBar 'Done', SheetContent 'Close', GymSessionButton copy, scan.ts:305; GymPatternsCard server values untranslated.
- Copy: foodLog.per100; CaloriesCard hardcoded g; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast; + menu should toast when logged, not reopen sheet; row 83 sheet-in-place route (navigation).
- Gym code: GymSessionButton logged branch dead (gym.tsx passes logged={false}); two logged sources (streak.gymLoggedToday vs today.already_checked_in); two getToday requests; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Stale comments: gym.tsx header line 4 and above MuscleChart; gym.tsx:144 card order; SegmentedField label; food.tsx:656-659 cites UI_PASS_GAPS.md.
- Code: SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx; TodayCard, StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Data: quick-add serving data missing (mock/data.ts:124); editSavedFood local only.
- Tests: none cover CaloriesCard, quick-add render, SegmentedField compact, gym card order, or gym.tsx render.
- Doc: summary table Quick add '(line 86)' wrong column; stale lines 895-897, 930, 934, 1017, 1058, 1504; row 87 repeated BUILT entries; line 103 unchecked.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only.

## Gotchas
- Decode design/Lume App.html with node from __bundler/manifest into /tmp only.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist). detail.tsx strings already translated.
- loop/ files show modified; not ours. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- Line numbers shift; grep before citing.

## Handover and Jev
- Last handover before R230; next due R235 (script-managed). HANDOVER.md current as of R224.
- Jev: R230 run 78%, kept. R231 run 84%, kept: build rows still open, so row 112 comes before the doc fix Jev's report suggested.
