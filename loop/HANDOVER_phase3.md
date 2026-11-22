HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
No row became BUILT. Rows 14 and 15 are still PARTIAL. Every Row 15 note says not checked on a device.

BUILT THIS SESSION (Row 15 unless noted)
- AnomalyBanner: fallback title, dismiss label and a plural count title (insights.anomaly.bannerCount). Error state checked; it was already translated.
- Goals screen (src/app/profile/goals.tsx):
  - eyebrow and grams/percent field labels (goals.eyebrow, gramsField, percentField)
  - French curly apostrophes
  - reset toast now uses goals.resetDone
  - VoiceOver labels use the "label, unit" comma join
- InsightCard type badge: insights.card.type has keys for protein_gap, meal_timing, gym_correlation and food_habit (from backend/internal/ai/insights.go:27). Unknown types show as sent.
- DailyMacroRing label uses nutrition.ringOf.
- Row 14: new gymMuscles.fr.render test only.
- Last full suite: 179 suites, 1134 tests, 4 snapshots passing; tsc 0 errors. Later tests were run file by file.

IN PROGRESS
Nothing half-done.

DECISIONS
- Render tests must end .render.test.tsx or Jest skips them. Brief names without it were renamed.
- Visible bracket labels such as "Protein (g)" stay, because the design is final. Only the spoken labels changed.
- Unknown keys fall back with t(key, { defaultValue }), the pattern from food/detail.tsx:677.
- A broken existing test or snapshot is never edited. The change is backed out and reported.

BLOCKED (Isa)
- hooks.ts change: useGoals drops isLoading, error and refetch, so Goals loading and error states cannot be built.
- Goals persistence.
- Wording to confirm:
  - "Goals reset to defaults." (reset copies the AI values and stays in custom mode)
  - whether to delete the unused goals.saved
  - "Gym and food"
  - the fibre spoken label "Fibre (optional)"
- Whether the comma join and the one-word ringOf should become full-phrase keys.
- es.json has two keys missing from en and fr: addMenu.voice, addMenu.describeOutLoud.
- Permission to make gymMuscles.shape and sheetContent.render tests read en.json instead of hard-coded English.
- Still open from last session: summaryNoFabrication.test.ts:54, the detailChrome snapshot, and the es/fr wording review.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first.
- No git, Prettier or Maestro; read .git/HEAD for the branch.
- zsh rejects grep --include globs.
- Locales live in src/lib/i18n/locales. Use npx jest --ci.
- Some older Row 15 notes contain a lower-case "built".

UNFIXED
- nutrition.tsx:227 reads out the slot name untranslated.
- week.tsx draws flat bars when every day has 0 kcal.
- BrainProfileCard numbers are not formatted for the language and always use kcal.
- The InsightCard 120-character toggle rule is still in place.
- Profile screens hard-code English titles and eyebrows: About, Privacy, Account, Connected apps, Delete Account, and Units on Preferences.
- "g", "%" and the comma join are hard-coded in goals.tsx.

NEXT
Translate the meal slot name at src/app/dashboard/nutrition.tsx:227.