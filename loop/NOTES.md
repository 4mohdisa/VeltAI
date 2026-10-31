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
- Checkpoint rounds read-only; doc-only rounds run tsc only.
- Grep briefs and handover lists before acting; they can be stale. Finish a flagged partial task before the next.
- formatCalories uses dashboard.kcal. Meal chip caption reuses food.quickAddMeal.
- formatGrams matches design ('33 g'); no change needed (R194).
- Code tidying (SLOT_KEYS dedupe, comments, test wording) is never a task; it goes to Parked.

## Status
- R162 checkpoint green (tsc 0, 65 suites, 824 tests). Full suite not run since. Run at next checkpoint.
- R179 to R192: copy, labels, formatCalories, detail and quick-add strings BUILT (see gap doc).
- R193 rejected (no branch rule).
- R194 done: formatGrams and formatMacro already match. Re-checked, BUILT line added, no code change.
- R195 (latest report): food/detail.tsx has no hardcoded English left. Gap row BUILT line added. Flagged: row 86 has duplicate BUILT lines; quick-add and detail citations stale.
- R196 (this round): doc-only fix of row 86 duplicate BUILT line, row 87 wording, and stale citations in the gap doc. tsc only.

## Next (in order)
1. Check R196 report. If the doc fix is clean, mark it done.
2. food.tsx: 'Analysing' vs VoiceOver spelling; P, C, F letters (about 899); raw energyUnit; 'Check your connection' invents a cause. One file per round.
3. Read-only: scan.ts:305 'Scan failed' shown at food.tsx:887. Translate at display; keep stored value (scanSeam.test.ts asserts it).
4. gym/new-template.tsx: `Remove ${name}`, 'Remove exercise' (about 180), other English. Swipe prompts at food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
5. Gym cluster, one file per round: GymPatternsCard, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar. Re-check each row against design/ before building.
6. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
7. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; food.savedTitle vs addMenu.myDishes.
8. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
9. week.tsx, training.tsx, energy.tsx remaining copy. food/new-recipe.tsx rest of screen.
10. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device and VoiceOver checks: tab bar es/fr width; Training labels; food row; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width; long es/fr text in saved and detail tiles; pending row; saved-mode removal; PADS captions; quick-add fit in es/fr; meal chips fit; 'for {n} g' fit; Save buttons fit; formatCalories on device (search and barcode sub-lines); Petit-dejeuner, Carbohidratos, Tamano de la porcion, Enregistrer les modifications fit.
- Native review: all es and fr drafts; 'Guardado'; 'Enregistre' gender with dish names; 'Tamano de la porcion', 'Taille de la portion'; quick-add toasts; 'Snacks' left English.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for logged days; swipe colour; tabs.* namespace; body stats (1,500 vs 2,100); 'Analysing' vs 'Analysing photo'; 'Delete item' vs 'Remove from log' (food.deleteItem value change needs Isa's OK); delete after confirm in app, immediately in design; keep or drop 'for {n} g'; title as mode or food name; gymLog calories key; extra es keys addMenu.voice and addMenu.describeOutLoud; gap item 11 macro layout; row 86 BUILT vs section verdict DIFFERENT (about line 964); foodLog.addedToMeal gender in toasts; foodLog.per100 '/ 100g' vs '/ 100 g'; Day log macro values: spaced 'g' on food detail but unspaced in design Day log (which form?).

## Parked
- English-only helpers: formatRelativeDate, weekdayShort, dayMonth, formatDuration; hardcoded Today, Yesterday, weekday and month names; plurals '1 of 1 days', 'longest 1 minutes', 'of N days'. formatGrams ignores energyUnit.
- formatCalories ignores energy unit (kJ users see kcal). Not reactive to language. formatNumber fixed to en-AU.
- formatMacro has no callers outside its test: dead code, remove in a cleanup round.
- food/detail.tsx builds gram strings inline at about 527, 538, 590 instead of formatGrams, because it needs num() precision. Leave unless a row needs it.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73; tabBar.addHint reads badly in es.
- SLOT_KEYS duplicated in food.tsx, add.tsx, quick-add.tsx, detail.tsx: dedupe is tidying, park.
- Lowercased addMenu.addToSlot gives awkward es/fr drafts ('Anadir a almuerzo'); needs native review.
- foodLog.savedAdded 'Added {{name}}.' has no matching design toast.
- Design shows an 'Updated {name}' toast after saving a logged item; app closes silently. Needs a behaviour decision.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split; duplicate goals.* and nutrition.* macros; gym done/missed label at src/app/food/history.tsx:133 hardcoded; src/lib/i18n/index.ts:2-3 header stale; i18next showSupportNotice console.info noise in tests.
- formatDuration, formatStreak and formatRelativeDate in formatting.ts hold hardcoded English (already listed above).
- Stale citations: gap doc 437, 955, 957, 1505; SwipeableRow.tsx:2 'red' comment; 'P' abbreviation; 'my foods' in RecipesList.tsx and detailSubject.ts.
- Energy unit: food.padCalories always says kcal, as the design does; kJ behaviour unchecked.

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested. Tests run in English only. Language picker removed for launch (src/lib/i18n/index.ts:41 sets lng 'en'), so es and fr never show until a picker returns.

## Gotchas
- Design: decode __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533 and 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- i18next plurals need _one and _other; fr treats 0 as one. kcal feminine, kJ masculine.
- foodDetail.test.ts searches source text; literals moved to keys can break it.
- Claude Code forgets context at handover. Name files fully.
- SwipeableRow lives under components/display. Briefs quote stale paths and finished work.
- formatting.ts imports @/lib/i18n. Any test that loads it pulls in i18n.

## Last round
R195: food/detail.tsx has no hardcoded English left; no code change; BUILT line added to gap doc (tsc 0; foodDetail and foodDetailLogged render tests passed, 35 tests). R194: formatGrams and formatMacro re-checked; already match. R192: formatCalories verified by test run. R191: formatCalories uses dashboard.kcal. R189: remaining detail.tsx titles and labels BUILT.

## Handover pending
None. Last handover before R187 (summary in loop/HANDOVER.md). Next handover due at R200 (every 15 rounds from R185).