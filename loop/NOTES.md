# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only (no switch, push, merge). Say BUILT, never verified. Stop when all rows BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked). Components needing strings call useTranslation().
- Calories VoiceOver reuses gymLog.celebration.calories. food.rowAnalysing shared by pill and VoiceOver (accepted).
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Rows with no fibre figure add 0; column always shows. Macro bars: 6px ProgressBars, zero-target guard.
- Design wins on zero-kcal confirm state (row 87 item e).
- SegmentedField.tsx is shared. Compact branch only in quick-add. R221: no chip padding, no label shrink, 44pt min height kept.
- Gym Log button follows the design showLogCta condition (R229). Design wins by default.
- Checkpoint rounds read-only. Doc-only rounds run tsc only and report exit code and output lines.
- Grep before acting. Code tidying is never a task. A task flagged twice goes to Blocked on Isa.
- Repeated flags on the same tsc step are not fixed by another doc-only round. Build rounds show tsc exit code and output lines.
- Every prompt names design/Lume App.html (bundle id), the gap row, and the branch rule.

## Status
- R229 (now): build. Row 112 Log button visibility in gym.tsx per design showLogCta (bundle 7dc211f6, lines 98-102, condition line 1603). tsc exit and output lines required.
- R228: doc-only. Row 112 Gym section order aligned; showLogCta difference added. Flagged again (same tsc step). Not re-run as doc-only; moved to build.
- R227: Log button moved under session card in gym.tsx. BUILT, not verified. tsc 0; 3 suites 24/24.
- R222 checkpoint clean: app 65/65 suites, 824/824.
- R218-R223: row 87 items c, d, e and chip padding and label shrink BUILT, not verified.
- R207: row 85 macro bars and row 86 food detail BUILT, not verified.
- Row 85 DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill.
- Row 87 DIFFERENT: 180ms Meal chip transition missing; one-line labels may truncate (device check).
- Row 112 DIFFERENT: My schedule card; four-row Training list; LoadFailedNotice and pull-to-refresh; card gap 14 vs 12; eyebrow tracking 1.1 vs 1; title tracking -0.6; eyebrow min height 26pt; title side padding 4pt; title right padding 52pt; title gap 0 vs 4; lumeFade entrance; showLogCta visibility (R229 in progress).

## Next (in order)
1. R229: row 112 showLogCta visibility in gym.tsx (build, tsc exit code and output lines).
2. Row 83 and row 112 doc update: Log button wording (row 83 still lists 'position'; line 532 says 'below two other cards'). One doc round, tsc shown.
3. Row 112: My schedule card, Training list, LoadFailedNotice, pull-to-refresh, lumeFade. One per round, re-checked against design first.
4. Row 112 GymPatternsCard typography once the padding question is answered.
5. Row 85 calorie bar and 'left today': Blocked on Isa.
6. Gym cluster, one file per round: saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each against design first.
7. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
8. Doc fixes (Parked, Doc) only when no build row is open.
9. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; four-column wrap (es 'Carbohidratos').
- Row 87: confirm label 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt; figure and meal defaults; 180ms transition (build or drop); chip truncation at 44pt incl. French.
- Row 112: GymPatternsCard 20 vs 16 padding (Card default at src/components/display/Card.tsx:47); whether this app-only card stays on the tab.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 macro bars; gym button position.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts (es macro P/C/G; fr P/G/L).
- Design questions: food.title shared; empty day layout; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; 'for {n} g'; sheet title mode or food name; gymLog calories key; energy unit kJ at food.tsx:912; disc glyph strokes.
- TestPG_* backend tests (18 skipped): run against Postgres?

## Parked (one line each)
- i18n: English helpers; hardcoded month, weekday, Today, Yesterday, plurals; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit; hardcoded strings quick-add.tsx:73, NumberEntryBar.tsx:108, scan.ts:305, SheetContent.tsx:77; GymPatternsCard server values untranslated (src/lib/api.ts:795-800); tabBar.addHint in es.
- Copy: foodLog.per100 '/ 100g'; CaloriesCard hardcoded g; raw energyUnit on logged rows; 'Check your connection'; food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast; 180ms Meal chip transition.
- Data: quick-add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- Layout: quick-add KeyboardAvoidingView in fitToContents sheet, check on device.
- Doc: summary table Quick add '(line 86)' wrong column; lines 895-897 stale three-column wording (food.tsx:584-626); lines 930, 934 state facts; line 1017 'Save to my foods' (app: 'Save to my dishes'); line 1058 contradicts row 87; line 1504 'line 86' label; row 87 repeated BUILT formats and paddingVertical note; row 112 Gym section (R228); row 83 Log button wording (R229 next).
- Comments: food.tsx:656-659 and CaloriesCard cite UI_PASS_GAPS.md section 2 (unconfirmed); SegmentedField.tsx label comment; gym.tsx:144 card order reversed; gym.tsx comment above MuscleChart names the two cards in reverse order.
- Gym: per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- Code: TodayCard, StreakCounter, Freeze, streak.tsx:73; mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; Math.max NaN; key={c.name}; SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Tests: no test covers CaloriesCard, quick-add render, SegmentedField compact, or gym card order.

## Accepted limits
Failure paths untested. Keyboard overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only.

## Gotchas
- Decode design/Lume App.html with node from __bundler/manifest into /tmp only.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist).
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- detail.tsx strings already translated; do not requeue.
- Say BUILT, never verified.

## Handover
Last after R210. Next due R235 (script-managed). loop/HANDOVER.md current as of R224.

## Jev log
- R201-R222: run kept or ask/stop with concrete reasons.
- R223-R227: run kept with concrete reasons (flag handling, checkpoint, one-line builds).
- R228: run 71%, ask 27%. Agreed.
- R229: run 66%, ask 32%. Kept run: the showLogCta question is decided by the design default, so no question for Isa is needed.