# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es and fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation().
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key. food.rowAnalysing is shared by pill and VoiceOver (accepted).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Checkpoint rounds are read-only. Doc-only rounds run tsc only.
- Rows with no fibre figure add 0, matching dashboard/nutrition.tsx; the column always shows, as in the design.
- Grep before acting; briefs can be stale. Code tidying is never a task.
- Loop flags are cleared by the loop. Every prompt names its design/ file and gap row. Rejected prompts are rewritten, not resent. A rewrite must name the branch rule.
- A task flagged twice goes to Blocked on Isa and is not retried.
- Macro bars: built as 6px ProgressBars with zero-target guard (R207, R211 check). Owner decides on 12px calorie bar and 'left today'.

## Status
- R213: rewrite of the rejected R212 prompt. Doc-only: DESIGN_GAP_ANALYSIS.md lines 895-897 (stale three-column wording) and the CaloriesCard citation (food.tsx:584-626). Names design/Lume App.html (food bundle 71f71ac4), row 85, and the loop/design-match branch rule. Pending report.
- R212: rejected by loop note (no branch rule). Not run.
- R211: doc-only verification of R210 edit plus tsc. Report: tsc exit 0, no tests run. CLEARED.
- R210: doc-only row 85 update (macro bars line and still-different line, line 890, Day log differences 7-8). tsc exit 0 reported.
- R209: read-only checkpoint, clean. Branch correct, tsc exit 0, app suite 65/65 suites and 824/824 tests passed.
- R207: row 85 macro bars built in CaloriesCard (src/app/(tabs)/food.tsx) as 6px ProgressBars from useGoals(). tsc green. Not verified on device.
- Row 85 still DIFFERENT: no calorie bar, no 'left today', no 700ms fill animation (ProgressBar lacks it). Four-column caption wrap unchecked on device.
- Food detail (row 86) BUILT. Row 87 Quick add still DIFFERENT (copy uses t()). Rows 3, 7, 11, 14, 17 and 87 stay open for layout or mode.

## Next (in order)
1. R213 (now): doc-only wording fix, lines 895-897 and the CaloriesCard citation. Then tsc only. Branch rule in the prompt.
2. Row 85 calorie bar and 'left today': waiting on Isa (Blocked). Do not requeue unless he answers.
3. Doc fix: line 930 and row 85 opening 'no goal' wording (useGoals() now supplies calories). One line per round, only if a line contradicts code.
4. Row 87 Quick add: re-check copy and layout against design/ before building. Then food/detail.tsx open rows: Add to slot labels; Edit food title and Save changes (reuse food.saveChanges); Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field. Detail copy was already translated; several rounds found nothing to do, so do not requeue unless the re-check finds a real difference.
5. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each first.
6. Nutrition, week, training, energy copy; food/new-recipe.tsx; PlannedValuesForm 'Add exercise'.
7. food.rowAnalysing 'Analysing photo': design question, do not build.
8. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Row 85 calorie progress bar (12px) and 'left today' figure. useGoals() supplies the calorie goal. Waiting on Isa.
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs; long es/fr text; pending row; PADS captions; row 85 four-column caption wrap (es 'Carbohidratos'); row 85 macro bars on device.
- Long labels: Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications.
- Native review of all es and fr drafts. es macro letters P/C/G and fr P/G/L are unreviewed drafts.
- Design questions: food.title shared; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; row 86 BUILT vs DIFFERENT; energy unit kJ at food.tsx:912; sheet title shows mode not food name.
- TestPG_* backend tests (18 skipped): must they run against Postgres? Isa to decide.

## Parked
- English helpers and hardcoded month, weekday, Today, Yesterday, plurals; formatGrams and formatCalories ignore energy unit; formatNumber fixed en-AU.
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only.
- quick-add.tsx:73 stores 'Quick add'. NumberEntryBar.tsx:108 hardcodes 'Done'.
- Gap doc stale line refs; difference 18 near 1017 ('Save to my foods' now 'Save to my dishes'); review difference 7 near 1009; line 957; line 87; line 934 states a current fact inside a differences list; line 1058 'copy is hardcoded English' contradicts row 87.
- foodLog.per100 is '/ 100g'; design has '/ 100 g'.
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint in es.
- SLOT_KEYS duplicated in four files (food.tsx, add.tsx, quick-add.tsx, detail.tsx). addMenu.addToSlot awkward drafts.
- foodLog.savedAdded has no design toast; 'Updated {name}' toast missing.
- scan.ts:305 'Scan failed' stored as food name.
- gym/new-template.tsx English strings; swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- Energy unit: padCalories always kcal; CaloriesCard hardcoded g unit (food.tsx builds ${Math.round(c.value)}g); raw energyUnit on logged rows near 918.
- food.searchFailed and food.loadFailed say 'Check your connection' (assumes a cause).
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; i18n/index.ts header; recipe fibre saved as 0; Math.max NaN; key={c.name}.
- Row 85: no test covers CaloriesCard, the macro line or its VoiceOver label. Comment cites UI_PASS_GAPS.md section 2, unconfirmed. ProgressBar has no animation (out of scope).
- Backend TestPG_* skipped (18). Isa to decide.

## Accepted limits
Failure paths untested. Keyboard-overlap unverifiable in dev (DECISIONS.md). SwipeableRow and saved.tsx untested. Tests English only; language picker removed (src/lib/i18n/index.ts:41 sets 'en'). quick-add.tsx has no render test.

## Gotchas
- Decode design with node from __bundler/manifest, into /tmp only. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; moved literals can break it.
- Claude Code forgets context at handover. Name files fully.
- Repo: src/app/(tabs)/food.tsx (src/app/food/food.tsx does not exist).
- Every prompt must state the branch rule (loop/design-match only, no switch, push or merge).

## Handover
Last handover after R210 (summary in loop/HANDOVER.md). Next due R225 (15-round cycle).

## Jev log
- R201-R208: run picks kept where checkpoints or doc fixes needed no owner input. R208 rejection rewritten as read-only checkpoint.
- R209: run kept; read-only checkpoint, no owner input needed.
- R210: run kept; doc-only row 85 update, no owner input needed. Jev ranked run 75%; agrees.
- R211: Jev ask 49% vs run 47%. Kept run: open question to Isa already in Blocked on Isa; flagged report needed a tsc check, which needs no owner input. Risk 1.4 came from the unconfirmed type check, now cleared.
- R212: Jev run 60%, ask 35%, stop 5% (confidence 0.40); risk 1.0. Kept run. The loop note rejection was a wording fault. R212 prompt was rejected for missing the branch rule, so R213 rewrites it with that rule. Remaining work needs no owner input.
- R213: Jev run 86%, ask 13%, stop 1% (confidence 0.79); risk 1.0 (confidence 0.40). Kept run. Risk comes from the rejected R212 prompt, which R213 fixes. No owner input needed.