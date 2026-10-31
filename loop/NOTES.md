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
- Locale order en, es, fr. A new key goes to all three together, in src/lib/i18n/locales/.
- Macros screen: kicker nutrition.title, title nutrition.macrosTitle.
- Hardcoded string not in design: keep English wording identical and record it.
- Flagged reports are cleared by a read-only round before a new build task. Checkpoint rounds are read-only.
- Petit-dejeuner dropped. lastLoggedLabel counts calendar days.
- No new test suites. 11pm-to-9am case checked on device by Isa.
- Load-failure keys are per screen: food.loadFailed, gym.loadFailed, profile.loadFailed, food.savedLoadFailed, nutrition.macrosLoadFailed.
- R267: gym.tsx may gain one react-i18next import and one useTranslation hook.
- hydrationErrorScreens derives its key list from LoadFailedNotice callers in source (R273, re-prompted as R274). It checks locale values; the string-literal check stays.
- profile.loadFailed is separate from gym.loadFailed by request, with identical text.

## Built (not verified)
- NumberEntryBar; food Add sheet; gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- lastLoggedLabel; plan.whyThisPlan; streak and summary keys; settings.scanAccuracy (es).
- Macros kicker and title (nutrition.tsx :77); nutrition.macrosLoadFailed; nutrition.caloriesTodayLabel; t() on nutrition.tsx :79, :86, :89, :95.
- Load-failure keys: food.tsx (449), gym.tsx (108, R269), profile/index.tsx (103, R270), food/saved.tsx (85, R271), (tabs)/index.tsx (155).
- Macros snapshot in detailChrome.render.test.tsx.snap updated.
- Gap count before R269: 23 DIFFERENT, 15 PARTIAL, 3 BUILT, 0 EXACT. Profile row left DIFFERENT. Macros has no gap row.

## Verification
- Last full Jest run R257: tsc 0; 65 suites, 824 tests.
- Not run since R268-R272 edits. Do not assume green. Run at next checkpoint.
- R272 read-only: tsc 0; hydrationErrorScreens 10/10. Literal check scans all six callers and finds 0 literals.
- R272 also found dashboard.streakLoadError (on (tabs)/index.tsx:115) missing from the hand-written key list. Present in en, es and fr.
- Keys en 159, fr 159, es 161 (es extras addMenu.voice, addMenu.describeOutLoud).
- Snapshots show raw keys. Device runs needed.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Open
- R274 (in progress): derive hydrationErrorScreens key list from CALLERS source; closes streakLoadError gap. Prompt was rejected once for not naming design/Lume App.html; rewritten.
- Weak es/fr check: the test only confirms non-empty strings, so an invented reason would pass. Strengthen later.
- Literal check misses message={"..."}, single quotes and template strings. Widen later or record.
- Stale comment at hydrationErrorScreens.test.ts ~line 64 ('already moved'): removed in R274.
- No Saved meals row in DESIGN_GAP_ANALYSIS.md. Closest is the Saved foods row (~line 1447).
- Stale line refs in gap file: :393, :420 (gym.tsx lines now two out).

## Next
1. R274: derive hydrationErrorScreens key list from source (in progress).
2. Hardcoded text in food/saved.tsx:83 and other literals: toasts, sheet title, placeholder, field label, empty states, swipe text, row labels.
3. (tabs)/index.tsx:150 'Macros' and 'Today': record as hardcoded or t().
4. (tabs)/gym.tsx :56, :102, :114, :123: t() or record.
5. profile/index.tsx :62 toast and :82-83 sign-out alert: t() or record.
6. gym/freeze.tsx:48; StreakCounter.tsx:15; EnergyBalanceCard.tsx:131 (asserted at render test :62).
7. Add sheet icons to design SVGs.
8. food.tsx:445-447: check whether empty-list ErrorState copy uses t().
9. Remaining gap rows, most cleared first.
10. Full Jest run at the next checkpoint round.
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
- dashboard.welcome, gymBedtime unused; lastLoggedDaysAgo_one unreachable.
- Future-dated saved-meal logs read 'Last logged today'.
- Re-run 'breakfast' search on decoded assets. Check fr U+00A0 (4 instances).
- Chart title: design vs app. Summary detail views never compared with the design. 'Calories today' chart not compared with 'Where the calories came from'.
- No 'a petit-dejeuner' value in fr.json; needs per-meal strings in all locales.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Summary, streak, celebration, delete dialog, VoiceOver, toasts, saved meals (incl. late-evening log), plan 'Why this plan', goals, gymLog, nutrition, Add sheet, recipe/fibre, quick add, food, gym, profile and saved-meals load-failure messages, Macros kicker and title.
- Native review of es and fr: gender, U+00A0, U+2019; new load-failure strings and caloriesTodayLabel; doubts 'du repas', 'de la comida', 'de sport' versus 'gimnasio'.
- Group names: food.loadFailed vs foodLog.loadFailed; gym.loadFailed beside gymLog; whether profile reuses gym wording (duplicate text: change both if wording changes).
- Whether to record the Macros and Profile changes in the gap file.
- Remove es voice and describeOutLoud; override es emptyMessage.

## Gotchas
- Edit tool writes plain space for U+00A0 and plain apostrophe for U+2019. Use node escapes and check code points. Avoid \u0027 inside node -e; use String.fromCharCode(39).
- Keep output inside the repo. No /tmp. Old decoded design files may sit in /tmp/lume-design; decode in memory instead.
- zsh: quote parenthesised paths. Grep: LC_ALL=C /usr/bin/grep. Tests: npx jest --ci with a name pattern.
- design/Lume App.html is gzip-compressed in __bundler/manifest. Decode before searching.
- src/lib/i18n/index.ts:41 fixes lng to 'en'.
- Render tests have no i18n instance; snapshots show raw keys. hydrationErrorScreens reads source and locale text only; it does not confirm screens use the keys at render.
- fr apostrophes mixed: plain in foodLog and food; U+2019 elsewhere; caloriesToday uses the \u2019 escape.
- Handover summaries can be stale. Check them against this file.

## Loop notes
- Handovers ran after R141 to R254, around R270, and next due after R284.
- Rejected earlier: several first prompts (R236 to R271). Rewrite with file, row and branch named.
- R266 flagged, cleared by read-only R267.
- R271 flagged as partly done. R272 read-only confirmed literal coverage and found streakLoadError gap.
- R273 prompt rejected: did not name the matching design/ file. Rewritten as R274 with design/Lume App.html named and no visual change.
- Prefer small tasks. Check tsc and relevant tests on every build round.