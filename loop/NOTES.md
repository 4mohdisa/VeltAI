# Lume Loop Notes

## Goal
Match design/Lume App.html via DESIGN_GAP_ANALYSIS.md rows. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked.
- Trial 7 days, $49.99/yr, $8.99/mo, no card up front.
- Design HTML is source of truth. Gap analysis is authoritative.
- Isa: cardio Distance km; no food search chips; Goals as built; celebration card approved; already-logged routes to /gym/session; Summary card never calls logGymSession() without args.
- Celebration calories show a dash. Macros stored unrounded, display rounds. Gym duration logged when above 0.
- Negative margin at add.tsx:68 accepted.
- Slot key snack = 'Snacks'. Unknown slot falls back to 'Add meal'. 'Add to Lunch' keeps capital. Toast keeps toLowerCase().
- Meal delete toast and dialog use design defaults until Isa overrides.
- es voice and describeOutLoud stay until Isa approves removal. es addedToMeal and mealDeleted avoid gender. es goals.setByLume feminine.
- fr savedMeals keeps U+00A0 and U+2019 (pending native review). fr is never shown (src/lib/i18n/index.ts:41).
- Locale order en, es, fr. A new key goes to all three together. Files in src/lib/i18n/locales/.
- Macros screen: kicker nutrition.title, title nutrition.macrosTitle. Design-confirmed. No gap row.
- Hardcoded string not in design: keep English wording identical and record it.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- a petit-dejeuner dropped. lastLoggedLabel counts calendar days.
- No new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- Nutrition wording in nutrition namespace. Load-failure keys are per screen: food.loadFailed (kept by default; Isa may ask for foodLog.loadFailed).
- hydrationErrorScreens test: key list checks locale values; string-literal check stays.
- R267: gym.tsx may gain one react-i18next import and one useTranslation hook inside GymLogScreen, needed to call t(). Lines shift by two; keep the change to that and the gym.loadFailed key.
- R268: checkpoint kept as the pick over Jev's gym.tsx:106 (86%). Loop note says checkpoint, last full run was R257. Clean baseline before the gym edit. Read-only.
- R269: gym.tsx:106 kept as the pick (Jev 88%, agrees). Gap row for gym log is not closed by this string alone, so DESIGN_GAP_ANALYSIS.md is left unchanged.

## Built (not verified)
- NumberEntryBar; food Add sheet; gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel; plan.whyThisPlan; streak and summary keys (en, es, fr); settings.scanAccuracy (es).
- Macros kicker and title (src/app/dashboard/nutrition.tsx); nutrition.macrosLoadFailed ((tabs)/index.tsx:155); nutrition.caloriesTodayLabel.
- food.loadFailed at food.tsx:449 (new food group, en, es, fr).
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- Last full run R257: tsc 0; 65 suites, 824 tests, 4 snapshots.
- R265: tsc 0; hydrationErrorScreens 10/10. Key counts en 157, fr 157, es 159 (es extras addMenu.voice, addMenu.describeOutLoud).
- R266: report flagged (tsc and tests not run). Gym edit not made.
- R267: read-only clearance. tsc 0; hydrationErrorScreens 10/10; gym.tsx:106 still hardcoded.
- R268: read-only checkpoint result. tsc 0; hydrationErrorScreens 10/10 (gym.tsx:106 still hardcoded, nothing edited). Full Jest result to be confirmed in the next report.
- Snapshots show raw keys. On-screen text needs a device run.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R269 (current): gym.tsx:106 load-failure to t('gym.loadFailed'). Add react-i18next import and one useTranslation hook in GymLogScreen. Add gym.loadFailed to en, es, fr. Add to hydration test list. tsc once, hydrationErrorScreens once. Matching file: design/Lume App.html. Gap row: the gym log row in DESIGN_GAP_ANALYSIS.md.
2. (tabs)/index.tsx:150 hardcoded title 'Macros' and scope 'Today'. Record as hardcoded, keep wording.
3. (tabs)/gym.tsx:54, :100 ('Gym' title, also hardcoded; record it), :112 and :121 to t() or record as hardcoded.
4. profile/index.tsx:103 (reuse gym.loadFailed wording only if Isa agrees; otherwise its own key) and food/saved.tsx:83 load-failure to t(); gym/freeze.tsx:48; StreakCounter.tsx:15. One per round.
5. components/domain/EnergyBalanceCard.tsx:131 (asserted at render test :62).
6. Add sheet icons to design SVGs.
7. Remaining gap rows, most cleared first.
8. Add dashboard.streakLoadError to locale check ((tabs)/index.tsx:115).
9. Check food.tsx:445-447 comment: does the empty-list ErrorState copy use t()?
10. Read-only full Jest checkpoint at the next checkpoint round.
11. If no non-gym work remains: stop with 'only owner decisions remain'.
12. Remove es voice and describeOutLoud only after Isa approves and a search confirms no use.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote.
- fr gymLog.celebration.streak needs a count key. fr 'Ajouter a {{slot}}' reads oddly.
- plan.addTitle: es and fr mean 'Add to', en is 'Add'.
- Global SegmentedField inset; food search sheet; single scanner; chip padding. Design '14-day streak' hyphen.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams; blinking caret; Math.round in draft(); console.warn at hooks.ts:56; SLOT_KEYS duplicated in add.tsx and food.tsx.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- dashboard.welcome and gymBedtime unused; lastLoggedDaysAgo_one unreachable.
- Future-dated saved-meal logs read 'Last logged today'.
- Re-run 'breakfast' search on decoded assets. Check fr U+00A0 (4 instances).
- Chart title: design vs app. Compare in a design row.
- No 'a petit-dejeuner' value in fr.json. Needs per-meal strings in all locales; waiting on Isa for where the wording appears.
- gym.loadFailed sits in a new gym group next to gymLog. Confirm the group name with Isa, along with food.loadFailed versus foodLog.loadFailed.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan 'Why this plan', goals, gymLog, nutrition (kicker, title, load-failure), Add sheet, recipe/fibre, quick add, food log load-failure.
- Native review of es and fr (gender, U+00A0, U+2019), incl. nutrition.caloriesTodayLabel, nutrition.macrosLoadFailed, food.loadFailed, gym.loadFailed. Doubt: 'du repas', 'de la comida'.
- Key group: keep food.loadFailed or rename to foodLog.loadFailed. Same question for gym.loadFailed.
- Remove es voice and describeOutLoud. Override es emptyMessage.
- Macro key: nutrition.macrosKicker from the handover is not needed; kicker already uses nutrition.title (design-confirmed). Only reopen if Isa says otherwise.

## Gotchas
- Edit tool writes plain space for U+00A0 and plain apostrophe for U+2019. Use node escapes and check code points.
- Keep output inside the repo. No /tmp.
- zsh: quote parenthesised paths. Grep: LC_ALL=C /usr/bin/grep. Tests: npx jest --ci with a name pattern. Full run: npx jest --ci with no pattern.
- design/Lume App.html is gzip-compressed in __bundler/manifest. Decode before searching. The earlier 'breakfast' search ran on raw HTML and needs re-running.
- Real path: src/app/dashboard/nutrition.tsx (not src/app/nutrition.tsx).
- Handover summaries can be stale. Check them against this file.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show. fallbackLng is 'en'.
- No test imports plan.tsx. Not checked whether a suite renders SavedMealsList. No known test covers the 11pm case.

## Loop notes
- Handovers after R141 to R254. Handover due after R269.
- Rejected: R236, R238, R243, R255, R257, R261, R264 (first prompts), R266 first prompt (no loop/design-match branch rule; notes too long).
- R269 first prompt rejected: did not name the matching design/ file. Rewritten to name design/Lume App.html and the gym log row.
- R265 clean. R266 flagged by automatic check (tsc or tests not run, and gym.tsx lacks t scope). Stopped at step 1 with no edits.
- R267: read-only clearance of R266 flag. Jev ask 76% overridden for the reason in decisions; gym.tsx two-line import and hook allowed for R268.
- R268: checkpoint loop note (full tsc and full Jest, no edits). Jev ranked gym.tsx:106 at 86%; kept checkpoint as pick because the loop note requires it and the last full run was R257.
- R269: Jev ranks gym.tsx:106 at 88% and run at 94%; last-task clean 25%; risk 1.3 (confidence 0.42). Aligned with plan, no override.
- Prefer small tasks; check tsc and tests on every build round.