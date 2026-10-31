# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat, not Stripe. Onboarding stabilised. v1 scope locked. Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML and gap doc are authoritative.
- Macros unrounded, 1 dp on save; day card, Summary and totals whole. Empty profile floors at 1,500 kcal. Unknown slot falls back to 'Add meal'.
- New keys go to en, es, fr together. Other hardcoded strings stay English (Parked).
- One surface or shared component per prompt. Finish a dialog or label set before the next surface. Change sibling labels in one round.
- Claude Code never opens loop/NOTES.md or loop/DECISIONS_LOG.md. Prompts forbid git.
- Components needing strings call useTranslation() themselves.
- Checkpoint rounds read-only; doc-only rounds run tsc only. Checkpoint requests override Jev.
- Swipe colour: keep color.primary until Isa decides.
- Defaults: one-tap gym log on Summary; keep Distance km; skip food search chips; keep Goals extras.
- Grep briefs and handover lists before acting. They can be stale.
- Prompts must name the matching design/ file and bundle id (read from app.json), and must state the loop/design-match branch rule. A prompt without either is rejected.
- Shared food.rowAnalysing is used for both the visible pending pill and VoiceOver (accepted for v1).
- Design wording beats app wording when they differ (R170: 'Save to my dishes').

## Status
R162 checkpoint green: tsc 0, 65 suites, 824 tests. Last full suite R162. Gap counts at R142: 24 DIFFERENT, 14 PARTIAL, 4 BUILT.

## Built, not verified (es and fr are unreviewed drafts)
- Tab labels and titles (LumeTabBar, AddMenu, (tabs)/_layout.tsx); CaloriesCard labels; add menu and add/close VoiceOver; food row VoiceOver label and hint.
- Swipe titles and messages: food.tsx (date-neutral), food/saved.tsx, food/new-recipe.tsx, gym/new-template.tsx (title and trash dialog).
- SwipeableRow (src/components/display/SwipeableRow.tsx) default labels use t('common.delete') and t('common.cancel') (confirmed R163, no edit).
- LoadFailedNotice and StreakCounter tokens; GymPatternsCard, week, training, energy copy; freeze label; nutrition.energyLogged (es 'en total', fr 'au total').
- R166: food.tsx pending pill uses t('food.rowAnalysing') with design wording 'Analysing' (en). es 'Analizando…', fr 'Analyse…'. Row 85 reason line added. Also affects VoiceOver.
- R167: food/detail.tsx 'Delete item' now t('food.deleteItem'). Row 86 reason line added.
- R168: food/detail.tsx delete confirm and toast now t('food.deleteConfirm', { name }) and t('food.deleteToast', { name }); dialog buttons use common.cancel and common.delete. Row 86 reason line added. Shared dialog means the saved-mode dialog gets translated buttons under an English title.
- R169: food/detail.tsx saved-mode strings translated: food.savedRemoveAction (new; en 'Remove from saved'), food.unsaveTitle, food.savedRemoved. Tsc 0, 5 files 60 passed. es and fr drafts. es.json has 2 extra keys (addMenu.voice, addMenu.describeOutLoud), not in en or fr.
- tabs.summary and tabs.gym do not exist; tab labels reuse food.title, dashboard.summaryTitle, gym.title. tabBar.closeMenu kept separate from closeAddMenu (a test finds 'Close menu').

## Next
1. R170 (picked): food/detail.tsx 'Save to my dishes' button and 'Saved to my dishes' toast, with food.saveToDishes and food.savedToDishes added to en, es, fr.
2. food/detail.tsx PADS captions (57-62), macro labels (about 567-610), 'Edit item', 'Rename food'.
3. Doc-only round: DESIGN_GAP_ANALYSIS.md row 86 says BUILT but the section verdict near line 964 says DIFFERENT. Reconcile wording without changing counts unless evidence shows otherwise. Also line 957 is stale (new-template swipe title is no longer English).
4. Read-only follow-up: scan.ts:305 hardcoded 'Scan failed' feeds food.tsx:887 and VoiceOver. Plan a display-time translation, keep the stored value (scanSeam.test.ts asserts it).
5. food.tsx: visible 'Analyzing…' (about 875) spelling differs from VoiceOver; P, C, F letters (about 899); g suffixes; raw energyUnit; 'Check your connection' invents a cause.
6. gym/new-template.tsx: `Remove ${name}` label, 'Remove exercise' (about 180), rest of English strings.
7. SwipeableRow.tsx:32,39 defaults: grep first. Notes say already translated (R163). Handover claim is stale unless grep proves otherwise.
8. Other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220 (check each is translated before editing).
9. One file per round: GymPatternsCard server values, saved, MuscleChart, session, gym, (tabs)/index, gymRange.ts, GymSessionButton, GymCalendar.
10. CaloriesCard: missing Fibre column; dot vs bar (row 85, not BUILT).
11. PlannedValuesForm 'Add exercise'; add.tsx unused slotKey keys; dedupe SLOT_KEYS; food.savedTitle vs addMenu.myDishes.
12. nutrition.tsx '80%' vs '80 %'; raw meal.slot; freeze strings at count 1.
13. week.tsx, training.tsx, energy.tsx remaining copy.
14. Other food/new-recipe.tsx English strings (rest of screen).
15. Pending-row ellipsis: en none, es and fr have one. Flagged for native review; no change without Isa.
16. No rows left: stop with 'only owner decisions remain'.

## Blocked on Isa (do not retry)
- Device checks: tab bar es/fr width; gym Training labels; food row VoiceOver; offline failure; LoadFailedNotice; StreakCounter caption; add menu wrap at 232pt; swipe dialogs and 88pt action width (Eliminar, Supprimer); long es/fr text in food/saved.tsx; pending row on screen and VoiceOver; saved-mode removal button and toast on device.
- Native review: es/fr drafts (food.row*, food.remove*, food.unsave*, food.saved*, food.deleteItem, food.deleteConfirm, food.deleteToast, food.savedRemoveAction, tabBar.*, addMenu, energyLogged, common.delete, gym.removeExerciseTitle); fr 'Detail', 'Repartition', 'gel', 'congelation'; es 'Ingesta y gasto'; fr Sport; ellipsis on es/fr pending wording; fr 'Supprimé :' with feminine dish names.
- Extra es keys: should addMenu.voice and addMenu.describeOutLoud be removed from es.json, or added to en and fr? Not asked yet; default is to leave them and record it.
- Design questions: food.title shared by tab and screen; empty day layout; GymPatternsCard padding 20 or 16; edit or toast for already-logged days (mutations.ts:173-178); swipe colour; tabs.* namespace (decide whether to add tabs.* keys); body stats (app 1,500 vs design 2,100); shared VoiceOver wording 'Analysing' vs 'Analysing photo' (needs second key if kept); delete wording mixed ('Delete item', 'Delete {{name}}?', 'Removed {{name}}') vs design 'Remove' and 'Remove from log'; delete removes after confirm in app, immediately in design.

## Parked
- Helpers English-only: formatRelativeDate, weekdayShort, dayMonth, formatDuration. formatCalories and formatGrams ignore energyUnit. Plurals: '1 of 1 days', 'longest 1 minutes', 'of N days'.
- Quick add serving data missing (src/lib/mock/data.ts:124); editSavedFood is local only (backend).
- GymPatternsCard server values untranslated (src/lib/api.ts:795-800).
- Gym: row order; per-set remove; cardio ParameterForm; template editor; kg/lb; custom exercise route.
- TodayCard, StreakCounter, Freeze, streak.tsx:73 details.
- Spanish: tabBar.addHint reads badly; addMenu.voice and describeOutLoud only in es.json.
- Code: mixHex; untyped CONFLICT_KEYWORDS; router.setParams; console.warn hooks.ts:56; recipe fibre saved as 0; num() rounding; Math.max NaN; key={c.name} translated; food.unsaveTitle and removeTitle split in es and fr; duplicate goals.* and nutrition.* macros; comment and identifiers spelled 'Analyzing' in food.tsx:870 (not user-visible).
- Stale citations: DESIGN_GAP_ANALYSIS.md 437, 955, 957, 1505. SwipeableRow.tsx:2 'red' comment (file is at src/components/display/SwipeableRow.tsx). Hardcoded kcal and g in src/lib/formatting.ts; 'P' abbreviation.
- Earlier list to revisit: date formatters, 'of N days' plurals, GymPatternsCard values, SLOT_KEYS, savedTitle.
- Design treatment gap: design shows a pulsing AI-tinted pill; app shows footnote text over skeletons (gap item 29).

## Accepted limits
Failure paths untested. Keyboard-overlap check cannot be verified in dev (DECISIONS.md). SwipeableRow and saved.tsx rendering untested.

## Gotchas
- Decode design from __bundler/manifest with node. Screens: food 71f71ac4; energy, week, training 185bb533; 7dc211f6.
- zsh: quote (tabs) paths. Use LC_ALL=C /usr/bin/grep. Exit 1 means no match.
- i18next plurals need _one and _other; fr treats 0 as one. kcal is feminine, kJ masculine.
- Test i18n is fixed to English; some tests find controls by English label, so English changes can break them.
- Claude Code forgets context at handover. Name files fully.
- Briefs quote stale paths and finished items. Check the file first.

## Last round
R169: food/detail.tsx saved-mode removal strings built, tsc 0, 5 test files 60 passed. Not verified on screen or in es/fr.
R170: picked food/detail.tsx 'Save to my dishes' button and toast (candidate 1). Jev: run 52%, ask 48%, low confidence; kept run because no owner input is needed.

## Handover pending
None.