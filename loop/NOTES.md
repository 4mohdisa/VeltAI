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
- Locale order en, es, fr. A new key goes to all three locales together. Locale files live in src/lib/i18n/locales/.
- Macros: follow the design. nutrition.tsx:77 uses t('nutrition.title') as kicker and t('nutrition.macrosTitle') as title ('Macros' in all three locales). Done in R257.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- a petit-dejeuner dropped (not in fr.json). lastLoggedLabel counts calendar days.
- No new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- es plan.whyThisPlan follows English wording; native review pending.
- Macros screen has no row in DESIGN_GAP_ANALYSIS.md. Not added, to keep verdict counts unchanged. Isa may name a row.
- nutrition.loadFailed (R259): English wording kept identical to the old hardcoded string until a design match is confirmed.
- Rule (R260): where a hardcoded string is not in the design, keep the English wording identical and record it.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel in src/components/food/SavedMealsList.tsx. plan.tsx:120 uses t('plan.whyThisPlan').
- Streak and summary keys in en, es, fr. settings.scanAccuracy in es. (tabs)/index.tsx lines 102, 109, 115, 121 use t().
- Macros kicker and title swap at src/app/dashboard/nutrition.tsx:77. nutrition.macrosTitle added in en, es, fr. Macros snapshot updated in detailChrome.render.test.tsx.snap.
- nutrition.tsx:79 uses t('nutrition.loadFailed') (R259). en, es, fr keys added after nutrition.macrosTitle.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last full run: R257 (tsc 0; 65 suites, 824 tests, 4 snapshots). Keys then: en 151, fr 151, es 153.
- R258: read-only check of the Macros swap passed. Flag cleared.
- R259: nutrition.loadFailed added. tsc 0; detailChrome render test 4/4, snapshots unchanged. Keys: en 152, fr 152, es 154 (es extras addMenu.voice, addMenu.describeOutLoud). Error state not exercised by the test.
- R260 (in progress): nutrition.tsx:86 ('from food') and :89 ('Calories today') to t(). Expected keys after: en 154, fr 154, es 156 if both new keys are added.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).
- detailChrome.render.test.tsx snapshots nutrition.tsx. Render test shows raw keys (i18n not initialised), so on-screen text needs a device run.
- Design quotes re-confirmed in R256: CHARTS.macros.kicker = 'Nutrition'; sheets.macros.title = 'Macros'.

## Next
1. nutrition.tsx:86 and :89 to t() (R260, in progress).
2. (tabs)/gym.tsx:112 and :121 to t().
3. gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
4. Same message pattern, not yet fixed: (tabs)/index.tsx:155, (tabs)/food.tsx:449, components/domain/EnergyBalanceCard.tsx:131 (test asserts English at energyBalanceCard.render.test.tsx:62).
5. Add sheet icons to design SVGs.
6. Remaining gap rows, most cleared first.
7. Read-only full Jest checkpoint after R260.
8. If no non-gym work remains: stop with 'only owner decisions remain'.
9. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

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
- Design check for 'breakfast' in fr templates: re-run on decoded assets (raw HTML search was invalid).
- fr U+00A0: fr.json has 4 instances; location not yet checked.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan (incl. 'Why this plan'), goals, gymLog, nutrition (kicker 'Nutrition', title 'Macros', load-failure message), Add sheet, recipe/fibre, quick add.
- Native review of fr and es strings, gender, U+00A0 and U+2019. Specific doubt: 'repas' (fr) and 'comida' (es) for loadFailed read as 'meal' where English says 'food'.
- Remove es voice and describeOutLoud. Override es emptyMessage.
- Macros gap row: no row in DESIGN_GAP_ANALYSIS.md covers the Macros screen. Name a row, or confirm none is needed. Not blocking.

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
- Rejected: R236 (more than one screen), R238 and R243 (no design file named), R255 first prompt (no branch rule), R257 (no design file named, first attempt).
- Flags cleared: R239, R241, R242, R244 to R246, R248, R250 to R252, R254 to R255 (R256 checkpoint), R258 (Macros swap check).
- R253 and R254: no edits (wrong path; kicker and title reversed in the app).
- R256: read-only checkpoint, run on Jev's 83% signal.
- R257: Macros swap built (BUILT, not verified). Gap row missing, so not recorded in the gap file.
- R258: read-only check passed. Nothing changed.
- R259: nutrition.loadFailed built (BUILT, not verified). Clean report, no flag.
- R260: copy task for nutrition.tsx:86 and :89. Jev: next action run 96%, last task clean 89%, risk 1.1 of 2 (confidence 0.80). Kept to one small copy-only task.
- Handover after R254 said the Macros brief needed a locale key. Resolved: the key is nutrition.macrosTitle.
- Note: the 'Macros' decoded files in /tmp/lume-design predate the no-/tmp rule. Not used. Left in place, outside the repo.
- Handover at R259 flagged: Jev's last-task confidence was 57%; risk 1.3 of 2. Kept to one small copy-only task per round.