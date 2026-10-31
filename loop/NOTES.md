# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only (no switch, push or merge). Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation().
- Calories VoiceOver reuses gymLog.celebration.calories. food.rowAnalysing shared by pill and VoiceOver (accepted).
- Swipe colour: color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Rows with no fibre figure add 0 (matches dashboard/nutrition.tsx); column always shows.
- Macro bars: 6px ProgressBars with zero-target guard.
- Design wins on zero-kcal confirm state (row 87 item e).
- Checkpoint rounds read-only. Doc-only rounds run tsc only and report its exit code.
- Grep before acting. Code tidying is never a task.
- A task flagged twice goes to Blocked on Isa, not retried.
- Every prompt names the matching design/ file and the branch rule.
- SegmentedField.tsx is a shared component. Row 87 (a) and (b) are built in two steps: R221 adds the compact prop; the next round passes it from quick-add.tsx. Isa may override by Telegram.

## Status
- R221 (now): row 87 (a) and (b), step 1 of 2. Adds optional compact prop to SegmentedField.tsx only. Runs tsc and SegmentedField tests. Rewritten after R220 was rejected for touching two files.
- R220: rejected before running (two-file scope). Not built.
- R219: row 87 doc-only fix. tsc 0.
- R218: row 87 items (c), (d), (e) BUILT, not verified, in quick-add.tsx. tsc 0. Row 87 still DIFFERENT: (a) and (b).
- R209 checkpoint clean: app 65/65 suites, 824/824.
- R207: row 85 macro bars built in CaloriesCard. BUILT, not verified.
- Row 86 food detail: BUILT, not verified.
- Row 85 still DIFFERENT: no 12px calorie bar, no 'left today', no 700ms fill animation.

## Next (in order)
1. R221: row 87 (a) and (b), compact prop in SegmentedField.tsx only. Report tsc and test exit codes.
2. R222: quick-add.tsx passes compact={true} to its SegmentedField for row 87 (a) and (b). One file. Then update row 87 in the doc.
3. Row 85 calorie bar and 'left today': Blocked on Isa.
4. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each first.
5. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
6. Doc fixes to gap analysis (see Parked, Doc) only when no build task is open.
7. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85: 12px calorie bar; 'left today'; doc wording lines 895-897, 930, 934, 937 (flagged R214-R216); four-column wrap (es 'Carbohidratos').
- Row 87: confirm label 17/24 vs 17/22; bottom spacing 20pt + safe area vs 34pt (device check); figure keeps last value and meal defaults to last used vs time-of-day default.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 macro bars.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of es and fr drafts (es macro P/C/G; fr P/G/L).
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; energy unit kJ at food.tsx:912; disc glyph strokes 2.6 vs SF Symbols.
- TestPG_* backend tests (18 skipped): run against Postgres?

## Parked
- English helpers; hardcoded month, weekday, Today, Yesterday, plurals; formatNumber fixed en-AU; formatGrams and formatCalories ignore energy unit.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- Hardcoded: quick-add.tsx:73 'Quick add'; NumberEntryBar.tsx:108 'Done'; scan.ts:305 'Scan failed'; SheetContent.tsx:77 'Close'.
- Copy: foodLog.per100 '/ 100g' vs '/ 100 g'; CaloriesCard hardcoded g (food.tsx:696); raw energyUnit on logged rows; 'Check your connection' (food.searchFailed, food.loadFailed); food.rowAnalysing; food.deleteItem.
- Missing: 700ms bar fill; 'Updated {name}' toast; foodLog.savedAdded toast.
- Layout: quick-add KeyboardAvoidingView inside fitToContents sheet, not checked on device.
- Doc: stale line refs; line 1017 'Save to my foods' vs dishes; lines 930 and 934 state facts in differences; line 103 'hardcoded English' also in Summary Macros row (unchecked); line 1058 'The copy is hardcoded English' contradicts row 87; the line 1065 KeyboardAvoidingView item is stale; line 1502 label says 'line 86' for Quick add (it is 87) and sits under a heading that no longer fits; the 'Still open' list is missing row 87 sheet padding, hero padding, disc glyph, figure default and meal default differences; 'Still open' list still lists the offline toast, which row 87 calls an addition.
- Comment food.tsx:656-659 cites UI_PASS_GAPS.md section 2, unconfirmed.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint in es.
- SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx.
- Swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220; English strings in gym/new-template.tsx.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18n/index.ts header; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Row 85: no test covers CaloriesCard.

## Accepted limits
Failure paths untested. Keyboard-overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only. quick-add.tsx has no render test.

## Gotchas
- Decode design with node from __bundler/manifest into /tmp only. Food bundle 71f71ac4.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Claude Code forgets context at handover: name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist).
- Do not open loop/NOTES.md or loop/DECISIONS_LOG.md.
- detail.tsx strings are already translated; do not requeue.
- Say BUILT, never verified.

## Handover
Last handover after R210. Next due R225.

## Jev log
- R201-R218: run kept; no owner input needed.
- R219: Jev run 49%, ask 40%, stop 11% (confidence 0.24); last task clean 32%; risk 1.6. Jev ranked the row 87 doc fix first at 92%. Agreed.
- R220: Jev ask 86%, stop 8%, run 6% (confidence 0.79). Kept run. R220 was then rejected for scope (two files), so it was rewritten as R221.
- R221: Jev ask 81%, stop 10%, run 9% (confidence 0.72); last task clean 52%; risk 1.4. Kept run. Reason: the step is design-matching and covered by the defaults, not a product question. The rewrite is one shared component only, with the compact prop left unused until R222.

## Doc notes (not tasks)
- Parked doc items above stay out of the build queue. Fix them only in a doc-only round when no build row is open.