# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative. Design wording beats app wording.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Components needing strings call useTranslation(). PADS holds labelKey; translate at render.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git and name the branch.
- Calories VoiceOver reuses gymLog.celebration.calories until owner picks a key. food.rowAnalysing shared by pill and VoiceOver (accepted).
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal. formatGrams matches design ('33 g').
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale.
- Code tidying (SLOT_KEYS dedupe, comments, test wording) is never a task; it goes to Parked.
- Loop flags are cleared by the loop, not by Claude Code.
- Every prompt must name the matching design/ file and the gap row. Rejected prompts are rewritten, not resent.
- Tasks must be gap-doc rows. Non-row items (e.g. scan.ts) are not picked over row work, even if Jev ranks them higher (R201).

## Status
- R162 checkpoint green. Last full suite run R200 (824 app tests, 65 suites, 0 fail; backend 614 pass, 18 skip; tsc 0).
- Rows 86 and 87 BUILT, not verified.
- R200: checkpoint green. Step 2 closed.
- R201: food tab macro line rounded and moved to food.rowMacros (row 85, BUILT not verified). Row 85 stays DIFFERENT for goal-relative calories card and macro bars.
- R202: row 85 VoiceOver macro label at food.tsx:854 now rounds protein, carbs and fat (BUILT, not verified). Still uses hardcoded ' g'. Device check outstanding.
- R203 (this round): picked row 85 ' g' in the VoiceOver label to food.gramsUnit.

## Next (in order)
1. R203: row 85 VoiceOver label at src/app/(tabs)/food.tsx:854, replace ' g' with food.gramsUnit. Build only if real differences remain.
2. Row 85 CaloriesCard: missing Fibre column; dot vs bar. Re-check against design 71f71ac4 first.
3. food/food.tsx: 'Analysing' vs VoiceOver spelling (blocked on design question, do not build); raw energyUnit at about (tabs)/food.tsx:912 (needs energy unit decision first); 'Check your connection' invents a cause.
4. Read-only: scan.ts:305 'Scan failed' shown at (tabs)/food.tsx:887. Translate at display; keep stored value. Not a gap row; only pick if a row needs it.
5. gym/new-template.tsx: 'Remove ${name}', 'Remove exercise' (about 180), other English. Swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
6. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each row first.
7. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; food.savedTitle vs addMenu.myDishes.
8. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
9. week.tsx, training.tsx, energy.tsx copy; food/new-recipe.tsx rest of screen.
10. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt width; long es/fr text; pending row; saved-mode removal; PADS captions; quick-add, meal chips, 'for {n} g', Save buttons fit; formatCalories on device; long labels (Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications); row 85 label on device.
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender; 'Taille de la portion'; quick-add toasts; 'Snacks' left English; addMenu.addToSlot drafts (e.g. 'Anadir a almuerzo'); 'Anadir' wording; macro letters fr G for carbs (row 85).
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats 1,500 vs 2,100; 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log'; delete after confirm; keep or drop 'for {n} g'; title as mode or food name (food detail difference 7, incl. 'Edit food' title); gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs DIFFERENT verdict; foodLog.addedToMeal gender in toasts; foodLog.per100 '/ 100g' vs '/ 100 g'; Day log macro spacing; energy unit (kJ) for food.tsx:912.

## Parked (merged)
- English helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration, formatStreak; hardcoded Today, Yesterday, month and weekday names; plurals '1 of 1 days', 'longest 1 minutes', 'of N days'. formatGrams and formatCalories ignore energy unit; not reactive to language; formatNumber fixed to en-AU. formatMacro has no callers (dead code).
- food/detail.tsx inline gram strings near 527, 538, 590.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only (backend).
- quick-add.tsx:73 stores 'Quick add' as row name (saved data, English). NumberEntryBar.tsx:108 hardcodes 'Done'.
- Gap doc: difference 18 near 1017 still says 'Save to my foods'; review difference 7 near 1009 and App write-up near 991. Gap doc line 1058 stale bullet 'The copy is hardcoded English' (remove in a doc-only round). Gap doc line 87 still says copy hardcoded and cites quick-add.tsx:116 (now about 125).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- SLOT_KEYS duplicated in four files (food.tsx, add.tsx, quick-add.tsx, detail.tsx). addMenu.addToSlot awkward es/fr drafts.
- foodLog.savedAdded has no design toast. Design 'Updated {name}' toast after saving a logged item; app closes silently.
- Detail.tsx: Edit food title and Save changes at 259-260 (reuse food.saveChanges); Add to {slot} labels at 168, 225; Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name}; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros; history.tsx:133 hardcoded; i18n/index.ts:2-3 stale header; showSupportNotice noise.
- Stale citations: SwipeableRow.tsx:2; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts; gap doc quick-add line refs about 11 lines out and detail.tsx refs at least 7 out; gap doc stale line 957 and item 18.
- Energy unit: food.padCalories always kcal; kJ unchecked.
- Macro bar unit: (tabs)/food.tsx:690 builds a hardcoded g unit; matches design spacing, but not translatable.
- formatting.ts kcal and g units hardcoded.
- Backend TestPG_* tests skipped (12 in food, gym schedule and scan packages, plus 6 more unnamed). Isa to decide whether to run them against Postgres.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only. Language picker removed (src/lib/i18n/index.ts:41 sets lng 'en'), so es and fr never show. quick-add.tsx has no render or behaviour test. Row 85 label untested with VoiceOver.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; moved literals can break it. One assertion now looks for food.editValuesManually.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display. formatting.ts imports @/lib/i18n. Tests live in src/__tests__.
- Briefs repeat finished work and stale line numbers; check first. Grep before writing a prompt.

## Last round
R202: row 85 VoiceOver macro label rounded at food.tsx:854 (BUILT, not verified). Latest report: tsc 0, 115/115 across 7 suites.
R203: prompt for row 85 ' g' to food.gramsUnit.

## Handover
Last handover before R187 (summary in loop/HANDOVER.md). Next due R210 (15-round cycle). Full-suite checkpoint last run R200.

## Jev log
R201: Jev 60% run, 83% favoured scan.ts:305. Kept food.tsx pick: scan.ts is outside the gap rows and the brief forbids non-row tasks.
R202: Jev 59% run, 38% ask, 3% stop. Running agrees with the pick. Last task 80% clean; risk 1.6 of 2 (confidence 0.32). Kept the smaller task, as the brief asks when confidence is low.
R203: Jev 77% run, 21% ask, 2% stop. Last task 88% clean; risk 1.2 of 2 (confidence 0.43). Running agrees with the pick, no look-again needed.