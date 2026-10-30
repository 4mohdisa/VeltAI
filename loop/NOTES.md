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
- voice and describeOutLoud stay in es.json until Isa approves removal.
- es addedToMeal and mealDeleted avoid gender agreement. es savedMeals.emptyMessage translated from en (Isa may override).
- fr savedMeals keeps U+00A0 and U+2019 (accepted). fr plan, savedMeals, gymLog, goals, dashboard, nutrition are manager-written, pending native review.
- es goals.setByLume 'Definida' and fr 'Definie' are feminine, matching src/app/profile/goals.tsx:125.
- Plan file: src/app/dashboard/plan.tsx.
- Locale order en, es, fr; one file per round. Streak labels are count-based _one/_other keys. Celebration strings have no {{count}}; dashboard strings do.
- Each new group sits at its en.json position.
- Flagged reports are cleared by a verification round before a new build task. Checkpoint rounds are read-only.
- Prompts name loop/design-match, forbid git, name design/Lume App.html and a gap row or 'none'.
- fr remainingToday is 'Il reste {{value}} aujourd’hui'.
- Handover notes saying es.json lacks gymLog or scanAccuracy are stale.
- R233: full Jest run chosen over fr.json, because R232 was flagged (tests not run).
- R234: fr.json summaryTitle chosen as the smallest task that clears locale parity.
- R235: read-only verification chosen over es voice removal, because R234 was flagged (Jest not run). Removal stays blocked by the voice decision above.
- Line 121 label reads 'N day streak' (no 'Current streak'), because the existing key has no such wording.
- Line 115 is the load-failure notice and has its own key, not dayStreak: the stored number is untrustworthy on that path.

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- Streak: gymLog.celebration.streak_one/_other and dashboard.dayStreak_one/_other in en, es, fr. Summary streak label uses t() with count.
- en.json: dashboard.streakLoading, streakLoadError, summaryTitle ('Summary', used at (tabs)/index.tsx:102).
- es.json: dashboard.streakLoading, streakLoadError, summaryTitle ('Resumen'), gymLog group, settings.scanAccuracy.
- fr.json: dashboard.summaryTitle 'Résumé' added in R234 after streakLoadError. Parse and key-set check passed in R234 (dashboard 9 keys each; whole file 149 keys each). Jest not run for R234; R235 verifies.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R219, R228: full suite green (65 suites, 824 tests, 4 snapshots). R226 checkpoint green.
- R230: 6 suites, 96 tests pass. R232: parse and tsc only, Jest not run (flagged).
- R233: read-only. tsc exit 0, full Jest 65 suites, 824 tests, 4 snapshots green. Clears R232 flag.
- R234: tsc exit 0, fr.json parses, key sets match. Jest not run (flagged).
- R235: read-only verification pending (tsc, full Jest, parse and two-way key-set check on en, es, fr). Clears R234 flag if green.
- No test covers locale files, SavedMealsList, plan.tsx, CelebrationCard, plural selection or (tabs)/index.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R235: read-only verification (see above). Clears R234 flag.
2. Consolidate SLOT_KEYS (duplicated in add.tsx and food.tsx).
3. Hardcoded text, one file per round: (tabs)/index.tsx:121 ('1 days'); (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15; plan.tsx:120 'Why this plan'; nutrition.tsx:77 'Macros'.
4. Fix lastLoggedDaysAgo_one: unreachable, since days === 1 returns the yesterday string.
5. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
6. Add sheet icons to design SVGs.
7. Remaining gap rows, most cleared per task first.
8. Checkpoint full suite run: next is R238, then every 5 rounds.
9. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame; footnote missing.
- fr gymLog.celebration.streak wording needs a count-based key and a log-session change.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design '14-day streak' hyphen; app keeps the space.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds; food tab render test needs a suite.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- entry.title stays English in plan.addTitle (needed for slot param at plan.tsx:101).
- dashboard.welcome and gymBedtime unused: keep or remove after native review.
- addMenu.voice and describeOutLoud in es.json: remove only after Isa approves.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe/fibre, quick add, celebration (streak 1 and above), Summary title and streak, streak loading and failure, delete dialog, VoiceOver, toasts, saved meals, plan, goals, gymLog, nutrition.
- Native review fr and es: all new strings, including 'Resumen', 'Résumé', 'Creneau de sport', 'A suivre', gender, U+00A0/U+2019 standard.
- Remove es voice and describeOutLoud? Delete vs Removed wording; negative margin on device.
- Override available: es emptyMessage wording.
- Whether French standardises on U+00A0 and U+2019 (fr.json still mixes apostrophes).

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show on screen.
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- If a locale keeps a base key while code passes count, i18next uses it before en.
- Design HTML is a bundle: decode the manifest with node -e.
- Check key sets in both directions; a missing-only check hid the es extras.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220, and one just before R235. Latest in loop/HANDOVER.md. Name files fully after a handover.
- Flags: R218, R220 (Jest skipped); R222, R223, R230 (partly done); R225, R227, R229 (cleared); R231 (handled by R232); R232 (handled by R233, cleared); R234 (Jest not run, handled by R235).
- Jev matched on run for most rounds. R232, R233: Jev ranked fr.json first; manager chose verification (flag rule). R234: run 88%; manager chose fr.json summaryTitle. R235: Jev run 61%; manager chose verification (flag rule).