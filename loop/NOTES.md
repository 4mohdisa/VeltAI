# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Row 90 Add sheet BUILT. Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- es voice and describeOutLoud stay until Isa approves removal. es addedToMeal and mealDeleted avoid gender. es goals.setByLume feminine. es plan.whyThisPlan follows English wording.
- fr savedMeals keeps U+00A0 and U+2019 (pending native review). fr is never shown (src/lib/i18n/index.ts:41).
- Locale order en, es, fr. A new key goes to all three together. Files in src/lib/i18n/locales/.
- Macros screen: kicker nutrition.title ('Nutrition'), title nutrition.macrosTitle ('Macros'). Design-confirmed.
- Hardcoded string not in design: keep English wording identical and record it.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- a petit-dejeuner dropped. lastLoggedLabel counts calendar days.
- No new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- Macros screen has no gap row; none added to keep verdict counts. Isa may name one.
- Nutrition load-failure and a11y wording live in the nutrition namespace (nutrition.macrosLoadFailed, nutrition.caloriesTodayLabel).
- Test 'no screen invents a reason' (hydrationErrorScreens.test.ts:54-64) only checks message= string literals. It must be changed to check locale values; only after a read-only check, under a brief that allows it.

## Built (not verified)
- NumberEntryBar; food Add sheet; gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel (SavedMealsList.tsx); plan.whyThisPlan (plan.tsx:120).
- Streak and summary keys in en, es, fr; settings.scanAccuracy in es; (tabs)/index.tsx lines 102, 109, 115, 121.
- nutrition.tsx: Macros kicker/title swap (:77), loadFailed (:79), fromFood (:86), caloriesToday (:89), caloriesTodayLabel a11y label (:95, R261).
- R262: (tabs)/index.tsx:155 now t('nutrition.macrosLoadFailed'). Key added to en.json:165, es.json:167, fr.json:165 (after nutrition.loadFailed). fr values have two U+2019; no U+00A0 added.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last full run R257: tsc 0; 65 suites, 824 tests, 4 snapshots.
- R258 read-only check passed. R259 and R260: tsc 0; detailChrome render 4/4 after snapshot edits.
- R261: tsc 0; detailChrome render 4/4, 4 snapshots. Snapshot line 2945 edited by hand.
- R262: tsc ran twice (first run before keys existed; second run is the valid one) exit 0. Jest on 5 files naming (tabs)/index: 5 suites, 83 tests passed. Not run: onboardingPostAuth, tabProfileEntry.
- Keys after R262: en 156, fr 156, es 158 (es extras addMenu.voice, addMenu.describeOutLoud).
- Snapshots show raw keys, so on-screen text needs a device run.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R263 (current): read-only check of R262. tsc once, jest on tabNavigation, oneTapGymLog, summaryDetails, hydrationErrorScreens, summaryNoFabrication, detailChrome. Count keys. No edits.
2. Brief that allows editing only src/__tests__/hydrationErrorScreens.test.ts lines 54-64, so the no-invented-reason check covers the locale values for index.tsx:155 and dashboard/nutrition.tsx:79.
3. (tabs)/index.tsx:150 hardcoded title='Macros' and scope='Today' (record as hardcoded, keep wording).
4. (tabs)/gym.tsx:112 and :121 to t().
5. gym/freeze.tsx:48; StreakCounter.tsx:15, one per round.
6. (tabs)/food.tsx:449; components/domain/EnergyBalanceCard.tsx:131 (asserted in energyBalanceCard.render.test.tsx:62).
7. Add sheet icons to design SVGs.
8. Remaining gap rows, most cleared first.
9. Read-only full Jest checkpoint after the next checkpoint round.
10. If no non-gym work remains: stop with 'only owner decisions remain'.
11. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote.
- fr gymLog.celebration.streak needs a count-based key. fr 'Ajouter a {{slot}}' reads oddly with breakfast.
- plan.addTitle: es and fr mean 'Add to', en is 'Add'.
- Global SegmentedField inset; food search sheet; single scanner; chip padding. Design '14-day streak' hyphen.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams; blinking caret; Math.round in draft(); console.warn at hooks.ts:56; SLOT_KEYS duplicated in add.tsx and food.tsx.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable (kept).
- Future-dated saved-meal logs read 'Last logged today'.
- Re-run 'breakfast' search on decoded assets. Check fr U+00A0 locations (4 instances).
- Chart title: design 'Where the calories came from' / 'This week' vs app 'Calories today'. Compare in a design row.
- No 'a petit-dejeuner' value in fr.json; a real fix needs per-meal strings in all locales.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver (incl. nutrition calories label), toasts, saved meals (incl. a meal logged late the previous evening), plan ('Why this plan'), goals, gymLog, nutrition (kicker, title, 'kcal from food', 'Calories today', load-failure: make Today data fail and check message), Add sheet, recipe/fibre, quick add.
- Native review of es and fr strings (gender, U+00A0, U+2019), including nutrition.caloriesTodayLabel and nutrition.macrosLoadFailed. Doubt: 'du repas' and 'de la comida' read as 'from the meal'.
- Lost test coverage: hydrationErrorScreens.test.ts:54-64 no longer checks index.tsx:155 or dashboard/nutrition.tsx:79. Fix is in Next item 2.
- Remove es voice and describeOutLoud. Override es emptyMessage.

## Gotchas
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Use node escapes and check code points.
- Keep output inside the repo. No /tmp.
- zsh: quote parenthesised paths. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci, or npx jest --ci with a name pattern.
- --findRelatedTests on a file with no tests exits 1. Not a failure by itself.
- design/Lume App.html is gzip-compressed inside __bundler/manifest. Decode before searching.
- Real path: src/app/dashboard/nutrition.tsx (not src/app/nutrition.tsx).
- Handover summaries can be stale. Check them against this file.
- src/lib/i18n/index.ts:41 fixes lng to 'en'; fallbackLng is 'en'. es and fr never show.

## Loop notes
- Handovers after R141 to R254 (latest in loop/HANDOVER.md). Stale: its Macros key item was built already.
- Rejected: R236, R238, R243, R255, R257 (no design file or branch rule), R261 first prompt (no branch rule, notes too long).
- R262 flagged (type check or tests failed or not run). Cleared by read-only R263.
- R262 candidates: 1 index.tsx:155; 2 gym.tsx:112 and :121; 3 food.tsx:449. Chosen 1.
- R263 candidates: 1 read-only check of R262; 2 hydrationErrorScreens test edit (blocked by brief rule); 3 food.tsx:449 to t(). Chosen 1.