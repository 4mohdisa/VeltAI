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

## Built (not verified)
- NumberEntryBar; food Add sheet (row 90); gym chooser; goals restyle; CelebrationCard (row 17 steps 1-2); gym duration; quick add toast; MEAL caption; detent; 52pt pill; compact Meal control; recents macros; recipe fibre sum; food.tsx slot heading; labels; toast; deleteMealHint; delete dialog.
- Locales: savedMeals, plan, gymLog, dashboard, nutrition, settings.scanAccuracy, goals (partial) in en/es/fr as recorded in the gap analysis.
- Streak: gymLog.celebration.streak_one/_other and dashboard.dayStreak_one/_other in en, es, fr. Summary streak label uses t() with count.
- en.json has dashboard.streakLoading and dashboard.streakLoadError (R223), used at (tabs)/index.tsx:109 and :115.
- R225: es.json has dashboard.streakLoading and streakLoadError after dayStreak_other. es.json now has every en.json key.
- fr.json has every en.json key except dashboard.streakLoading and streakLoadError.
- Gap analysis: 23 DIFFERENT, 15 PARTIAL, 3 BUILT (76, 86, 90), 0 EXACT.

## Verification
- R219: tsc 0, 65/65 suites, 824/824 tests, 4/4 snapshots. Cleared R218 flag.
- R221: cleared R220 flag. R224 read-only check of R223: tsc 0, en keys and index.tsx lines confirmed.
- R226 (this round): checkpoint, read-only. Full tsc and full app suite run to clear the R225 flag (Jest not run in R225).
- No test covers locale files, SavedMealsList, plan.tsx, CelebrationCard, plural selection, or (tabs)/index.tsx.
- Keyboard-overlap check cannot be verified in dev (DECISIONS.md).

## Next
1. R226 checkpoint: full tsc and app suite, read-only. Done when the result is reported.
2. R227: add dashboard.streakLoading and streakLoadError to fr.json after dayStreak_other. Only after R226 is green.
3. Hardcoded 'Summary' title at (tabs)/index.tsx:102.
4. Other hardcoded text, one file per round: streak wording ('1 days') in (tabs)/index.tsx near :121; (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15; plan.tsx:120 'Why this plan'; nutrition.tsx:77 'Macros'.
5. Consolidate SLOT_KEYS (add.tsx, food.tsx).
6. lastLoggedDaysAgo_one unreachable: days === 1 returns the yesterday string. Fix.
7. Locale wording: fr 'a petit-dejeuner' to 'au'; es 'Anadir a Desayuno' to 'Anadir al desayuno'.
8. Add sheet icons to design SVGs.
9. Remaining gap rows, most cleared per task first.
10. If no non-gym work remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Missing macros as 0. Gym: row order, per-set remove, cardio ParameterForm, template editor, kg/lb, estimated duration.
- Row 17: rest-day exits show no card; pop-in; ring vs flame.
- fr gymLog.celebration.streak wording needs a count-based key and a log-session change.
- Global SegmentedField inset; food search sheet; single scanner; chip padding.
- Design '14-day streak' hyphen; app keeps the space.
- Code: mixHex; goals.tsx copy; CONFLICT_KEYWORDS untyped; router.setParams history; blinking caret; Math.round in draft(); console.warn at hooks.ts:56.
- Recipe fibre saved as 0; saved foods drop fibre; detail.tsx num() rounds; food tab render test needs a suite.
- Long-press meal delete not discoverable; mealNow() 'Snack' vs 'Snacks'.
- entry.title stays English in plan.addTitle (needed for slot param at plan.tsx:101).
- dashboard.welcome and gymBedtime unused: keep or remove after native review.

## Blocked on Isa
- Row 23 one-tap log: route or deviation. Row 17 Calories: formula or deviation.
- Search foods tile routing; global + title default; quick add 17/22 vs 17/24; add sheet 0pt gap; 'Snacks' label; 'added to snacks'.
- Device runs: Add sheet, recipe/fibre, quick add, celebration (streak 1 and above 1), Summary streak (VoiceOver 'day streak'), streak loading and failure, delete dialog, VoiceOver, toasts, saved meals, plan, goals, gymLog, nutrition, VoiceOver Add label.
- Native review fr: savedMeals, plan, goals, gymLog, nutrition, streak, dayStreak, dashboard ('Creneau de sport', 'A suivre'), scanAccuracy, streakLoading, streakLoadError; U+00A0/U+2019 standard; goals apostrophes; 'enregistrer' vs 'ajout'; gender; differentWeights.
- Native review es: plan, savedMeals, goals, gymLog, streak, dayStreak, scanAccuracy, streakLoading, streakLoadError; 'Registra {{plan}} tal como estaba programado'; 'Bien hecho!'; 'Puede que no coincida'; addedToMeal order; 'elemento'; masculine 'Registrado'.
- Remove es voice and describeOutLoud? 'Add to Lunch' capitals; 'Delete' vs 'Removed'; negative margin on device.
- Override available: es emptyMessage wording.

## Gotchas
- src/lib/i18n/index.ts:41 fixes lng to 'en'. es and fr never show on screen.
- Edit tool writes a plain space for U+00A0 and a plain apostrophe for U+2019. Patch with node escapes and check code points.
- Keep output inside the repo. No /tmp, no redirection.
- zsh: quote paths with parentheses. Grep: LC_ALL=C /usr/bin/grep. Tests: npm test -- --ci.
- If a locale keeps a base key while code passes count, i18next uses it before en.
- Design HTML is a bundle: decode the manifest with node -e.

## Loop notes
- Handovers after R141, R156, R167, R172, R187, R204, R220. Latest in loop/HANDOVER.md. Name files fully after a handover.
- Flags: R218 and R220 (Jest skipped); R222 and R223 (partly done); R225 (Jest not run). R224 verified the en side. R226 checkpoint clears R225 if green.
- Jev matched on run for R203-R205, R208-R211, R213-R216, R219, R221, R223, R225, and R226.
