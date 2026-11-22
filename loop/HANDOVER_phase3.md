HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
No row became BUILT. Row 15 (empty states and copy) is still PARTIAL, and nothing has been checked on a device. Last full gates: 191 suites, 1162 tests and 4 snapshots passing; tsc 0 errors. The Account round came after that and ran only its own test.

BUILT THIS SESSION (Row 15)
- quick-add.tsx: uses mealSlotName and imports SLOTS from src/lib/data/mappers.ts. Test: quickAddSlot.locale.render.
- food/detail.tsx: the local slot map is gone. slotLabel() in DetailForm falls back to foodLog.addMeal for an unknown slot (Isa's recorded decision). For an unknown slot the add button shows "Add meal", not "Add to add meal". Tests: detailSlot.render, detailSlotFallback.render.
- BrainProfileCard.tsx: typical intake follows the energy unit via useUnitPreferences and kcalToDisplay. New key insights.brainProfile.typicalIntakeValueKj. Test: brainProfileCard.numbers.render.
- profile/about.tsx: title uses settings.about; eyebrow uses the new settings.aboutEyebrow. Test: about.locale.render.
- profile/account.tsx: eyebrow uses the new settings.accountEyebrow, title uses settings.account, Save uses common.save. Test: accountLocale.render. Not yet noted in Row 15.

IN PROGRESS
Nothing half-done.

DECISIONS
- Tests go in src/__tests__/render/ and end .render.test.tsx.
- A broken existing test is never edited. The change is backed out and reported.
- New eyebrow keys sit next to their title key in settings.*.
- Spanish uses tú and French uses vous, as elsewhere in the app.

BLOCKED (Isa)
- Goals spoken labels: Option A (words such as "grams", which means editing goals.render.test.tsx:84-85) or Option B (keep as is).
- InsightCard onTextLayout: insightCard.i18n.render.test.tsx:51-52 pins the 120-character rule. Android line counts are also uncertain.
- Insight errors: aiFallback.test.ts pins the empty fallbacks. The backend has no anomalies endpoint, and useBrainProfile has no error state.
- Number grouping by language: formatNumber is fixed to en-AU and units.ts group() to en-US. brainProfileCard.i18n.render:56 pins "2140".
- addMenu.snack is "Snacks" in es and fr.
- About tagline and row labels; Account's Display name, Email and toasts. Delete Account is Phase 4.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first.
- No git, Prettier or Maestro. Read .git/HEAD for the branch.
- zsh rejects grep --include.
- The API client is src/lib/api.ts. There is no src/lib/data/api.ts.
- The detail screen takes its subject from the detailSubject store, not route params. Mock slotForNow to test it.

UNFIXED
- es.json has addMenu.voice and addMenu.describeOutLoud, which en and fr lack.
- formatCalories always shows kcal.
- getMorningBrief swallows errors.
- week.tsx draws flat bars when every day has 0 kcal.
- These profile screens still hard-code English: integrations, preferences (eyebrow "Units"), privacy, scan-calibration and support.

NEXT
Add the Row 15 note for Account, then localise the title and eyebrow on profile/integrations.tsx.