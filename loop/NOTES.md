# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Add sheet row 90 BUILT. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- es voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender. es goals.setByLume feminine.
- fr savedMeals keeps U+00A0 and U+2019 (accepted, pending native review). fr is never shown on screen (src/lib/i18n/index.ts:41).
- Locale order en, es, fr. A new key goes to all three locales together.
- Macros: follow the design. nutrition.tsx:77 kicker becomes t('nutrition.title'), title becomes t('nutrition.macrosTitle') ('Macros' in all three locales). Snapshot update only if the diff is just the swap.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- a petit-dejeuner dropped (not in fr.json). lastLoggedLabel counts calendar days.
- No new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- es plan.whyThisPlan follows English wording; native review pending.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel in src/components/food/SavedMealsList.tsx. plan.tsx:120 uses t('plan.whyThisPlan').
- Streak and summary keys in en, es, fr. settings.scanAccuracy in es. (tabs)/index.tsx lines 102, 109, 115, 121 use t().
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last green: R256 checkpoint (tsc 0; 65 suites, 824 tests, 4 snapshots; en 150, fr 150, es 152).
- R254 (Macros) and R255 flagged: no edits. Cleared by R256.
- R257 prompt rejected (no design file named). Rewritten for this round.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).
- detailChrome.render.test.tsx snapshots nutrition.tsx with 'Macros' near line 2776.
- Design quotes re-confirmed in R256: CHARTS.macros.kicker = 'Nutrition'; sheets.macros.title = 'Macros'. Line 77 has them reversed.

## Next
1. Macros swap at nutrition.tsx:77 with nutrition.macrosTitle in en, es, fr (this round, R257). Snapshot update only if the diff is just the swap.
2. nutrition.tsx:79 hardcoded message to t().
3. nutrition.tsx:86 and :89 to t().
4. (tabs)/gym.tsx:112 and :121 to t().
5. gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
6. Add sheet icons to design SVGs.
7. Remaining gap rows, most cleared first.
8. Read-only full Jest checkpoint after R260.
9. If no non-gym work remains: stop with 'only owner decisions remain'.
10. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote missing.
- fr gymLog.celebration.streak needs a count-based key.
- fr 'Ajouter à {{slot}}' reads oddly with breakfast. plan.addTitle differs from 'Add'.
- Global SegmentedField inset; food search sheet; single scanner; chip padding. Design '14-day streak' hyphen.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams; blinking caret; Math.round in draft(); console.warn at hooks.ts:56; SLOT_KEYS duplicated in add.tsx and food.tsx.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable (kept).
- Future-dated saved-meal logs read 'Last logged today'.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan (incl. 'Why this plan'), goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add.
- Native review of fr and es strings, gender, U+00A0 and U+2019.
- Remove es voice and describeOutLoud. Override es emptyMessage.
- Design check for 'breakfast' in fr templates (re-run on decoded assets).

## Gotchas
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Use node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection. Earlier decoded design files in /tmp/lume-design are outside the repo and must not be used.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- --findRelatedTests on a file with no tests exits 1. Not a failure by itself.
- Check key sets in both directions.
- design/Lume App.html is gzip-compressed inside its __bundler/manifest. Decode before searching.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. fallbackLng is 'en'.
- Real path: src/app/dashboard/nutrition.tsx (not src/app/nutrition.tsx).
- Handover summaries can be stale. Check them against this file.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220, R235, R240, R254. Latest in loop/HANDOVER.md.
- Rejected: R236 (more than one screen), R238 and R243 (no design file named), R255 first prompt (no branch rule), R257 (no design file named).
- Flags cleared: R239, R241, R242, R244 to R246, R248, R250 to R252.
- R253 and R254: no edits (wrong path; kicker and title reversed in the app).
- R256: read-only checkpoint, run on Jev's 83% signal. Cleared the R254 and R255 flags.
- Current round R257: Macros swap, run. Jev 63% run; kept run because the task is concrete and needs nothing from Isa.
- Handover after R254 said the Macros brief needed a locale key. Resolved: the key is nutrition.macrosTitle.
- Note: the 'Macros' decoded files in /tmp/lume-design predate the no-/tmp rule. Not used. Left in place, outside the repo.