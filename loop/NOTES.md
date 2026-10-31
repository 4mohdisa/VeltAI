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
- Macros screen: kicker nutrition.title, title nutrition.macrosTitle. Design-confirmed. nutrition.macrosKicker not needed.
- Hardcoded string not in design: keep English wording identical and record it.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- a petit-dejeuner dropped. lastLoggedLabel counts calendar days.
- No new test suites or render tests. 11pm-to-9am case checked on device by Isa.
- Load-failure keys are per screen. food.loadFailed kept by default. gym.loadFailed sits in a one-key gym group beside gymLog.
- R267: gym.tsx may gain one react-i18next import and one useTranslation hook in GymLogScreen.
- hydrationErrorScreens test: key list checks locale values; string-literal check stays.
- Profile load-failure (R270): own key profile.loadFailed, not gym.loadFailed, until Isa agrees. Built R270. Gap row left DIFFERENT (design has no load-failure state; row covers whole Settings root).
- R271: food/saved.tsx load-failure uses own key food.savedLoadFailed (per-screen rule), identical wording to the original literal in en.

## Built (not verified)
- NumberEntryBar; food Add sheet; gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel; plan.whyThisPlan; streak and summary keys; settings.scanAccuracy (es).
- Macros kicker and title (src/app/dashboard/nutrition.tsx); nutrition.macrosLoadFailed; nutrition.caloriesTodayLabel.
- food.loadFailed at food.tsx:449.
- gym.loadFailed at gym.tsx:108 (R269), with en, es and fr values.
- profile.loadFailed at profile/index.tsx:103 (R270), with en, es and fr values.
- Last gap count (before R269): 23 DIFFERENT, 15 PARTIAL, 3 BUILT, 0 EXACT.
- R271 (in progress): food.savedLoadFailed at food/saved.tsx, with en, es, fr values; hydration test list updated.

## Verification
- Last full run R257: tsc 0; 65 suites, 824 tests, 4 snapshots.
- R268 full Jest result not confirmed in a report. Last full suite was before R268-R271 edits; do not assume green. Confirm at the next checkpoint.
- R270: tsc 0; hydrationErrorScreens 10/10. Keys en 159, fr 159, es 161 (es extras addMenu.voice, addMenu.describeOutLoud).
- Snapshots show raw keys. On-screen text needs a device run.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R271: food/saved.tsx load-failure to t('food.savedLoadFailed'). Add key to en, es, fr food group and to hydrationErrorScreens list. Gap row unchanged.
2. (tabs)/index.tsx:115: add dashboard.streakLoadError to the hydration test list.
3. (tabs)/index.tsx:150 'Macros' and 'Today': record as hardcoded, keep wording.
4. (tabs)/gym.tsx hardcoded strings at :56, :102, :114, :123: t() or record.
5. profile/index.tsx:62 toast and :82-83 sign-out alert: t() or record.
6. gym/freeze.tsx:48; StreakCounter.tsx:15; EnergyBalanceCard.tsx:131 (asserted at render test :62).
7. Add sheet icons to design SVGs.
8. Remaining gap rows, most cleared first.
9. food.tsx:445-447: check whether the empty-list ErrorState copy uses t().
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
- No 'a petit-dejeuner' value in fr.json. Needs per-meal strings in all locales; waiting on Isa.
- Summary detail views never compared with the design (gap file :62-65, :1456).
- 'Calories today' chart may not match design 'Where the calories came from'; not compared.
- Duplicate wording: profile.loadFailed and gym.loadFailed hold identical text; a wording change must be made in both.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver, toasts, saved meals (incl. a meal logged late the previous evening), plan 'Why this plan', goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add, food, gym, profile and saved-meals load-failure messages, Macros kicker and title.
- Native review of es and fr: gender, U+00A0, U+2019; nutrition.caloriesTodayLabel, nutrition.macrosLoadFailed, food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed. Doubts: 'du repas', 'de la comida', 'de sport' versus 'gimnasio'.
- Group names: keep food.loadFailed or rename to foodLog.loadFailed; same for gym.loadFailed beside gymLog.
- Whether profile should reuse gym.loadFailed wording.
- Whether to record the Macros and Profile changes in the gap file.
- Remove es voice and describeOutLoud; override es emptyMessage.

## Gotchas
- Edit tool writes plain space for U+00A0 and plain apostrophe for U+2019. Use node escapes and check code points.
- Keep output inside the repo. No /tmp.
- zsh: quote parenthesised paths. Grep: LC_ALL=C /usr/bin/grep. Tests: npx jest --ci with a name pattern. Full run: npx jest --ci with no pattern.
- design/Lume App.html is gzip-compressed in __bundler/manifest. Decode before searching.
- Real path: src/app/dashboard/nutrition.tsx.
- src/lib/i18n/index.ts:41 fixes lng to 'en'. fallbackLng is 'en'.
- Render tests have no i18n instance, so snapshots show raw keys.
- hydrationErrorScreens reads source and locale text only; it does not confirm screens use the keys.
- fr apostrophes mixed: plain in foodLog, food; U+2019 elsewhere; caloriesToday uses the \u2019 escape.
- Avoid \u0027 inside node -e; use String.fromCharCode(39).
- Handover summaries can be stale. Check them against this file.

## Loop notes
- Handovers ran after R141 to R254, at R270-ish handover read, and next due after R284.
- Rejected earlier: R236, R238, R243, R255, R257, R261, R264, R266 first prompts; R269 first prompt (no matching design file named); R271 first prompt (did not name loop/design-match branch restriction). Rewrite with the file, row and branch named.
- R266 flagged (tsc and tests not run). Cleared by read-only R267.
- R268: checkpoint pick kept over Jev's gym.tsx:106 (86%) because the loop note required it.
- R269: gym.tsx:106 done; Jev agreed (88%).
- R270: profile load-failure done. Claude Code report flagged no failures; gap row left DIFFERENT by its choice, accepted.
- R271: food/saved.tsx load-failure prompt reissued with branch rule. Jev 97% run.
- Prefer small tasks. Check tsc and the relevant tests on every build round.