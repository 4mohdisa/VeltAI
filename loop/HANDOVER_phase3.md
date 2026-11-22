HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
No row became BUILT. Row 15 (Goals and progress) is still PARTIAL. Its PHASE3_ROWS.md notes run through the AnomalyCard round, and every round says not checked on a device. My notes number rounds 118 to 120; later notes have no number. The 118 to 120 labels may clash with the loop's own numbering.

BUILT THIS SESSION (Row 15)
- French foodLog.today now uses a curly apostrophe.
- Summary plan card scope uses a new dashboard.planCardScope key (AI, IA, IA).
- EMPTY_STATES_AUDIT.md: Summary loading row corrected; audit row 125 marked parked.
- Insights translated: src/app/insights.tsx and src/components/ai/{BrainProfileCard,InsightCard,AnomalyCard}.tsx. New key groups insights, insights.brainProfile (includes weekdays), insights.card and insights.anomaly, all in src/lib/i18n/locales/{en,es,fr}.json.
- New tests in src/__tests__/render/: summaryTab.i18n (extended), insights.i18n, brainProfileCard.i18n, insightCard.i18n, anomalyCard.i18n.
- Last full suite: 173 suites, 1114 tests, 4 snapshots passing; tsc 0 errors. Tests added since then were run file by file.

IN PROGRESS
Nothing half-done.

DECISIONS
- Server text (titles, bodies, insight type) is shown as sent. Weekdays are mapped by weekdayLabel; an unknown day is shown as sent.
- French uses curly apostrophes (fr.json has 87 curly against 10 straight). es and fr put a plain space before %, matching percentOfTargetShort.
- When a change breaks a test or snapshot the brief forbids editing, back the change out and report it. This happened twice: MacroBars (summaryNoFabrication.test.ts:54 expects the literal "Not tracked") and row 125 (the detailChrome macros snapshot uses an all-zero week).

BLOCKED (Isa)
- Permission to change summaryNoFabrication.test.ts:54 (MacroBars translation).
- Permission to regenerate the detailChrome macros snapshot alone (row 125). The nutrition.weekMacrosEmpty fix and its wording are ready to reapply.
- Review of all new es and fr wording, including whether a standalone weekday should be capitalised.
- The goals persistence decision.

GOTCHAS
- Before any command: source ~/.nvm/nvm.sh && nvm use 22. No git (read .git/HEAD for the branch), no Prettier, no Maestro.
- Locales live in src/lib/i18n/locales, not src/i18n.
- Pressable and its inner node both carry accessibilityLabel, so assert length > 0, not an exact count.
- zsh does not split $VAR into words, so pass Jest paths literally.
- Audit verdicts are proper, blank, broken, placeholder or hard-coded English; PARTIAL is not one of them.

UNFIXED
- AnomalyBanner.tsx copy may be English; not opened.
- src/lib/api.ts hides errors around lines 1253 and 1270; BrainProfileCard has a fixed 0.3 progress bar.
- InsightCard type badge is untranslated, and its more/less toggle appears when the body exceeds 120 characters.
- BrainProfileCard numbers are not formatted for the language and always use kcal.
- The insights.tsx consent comment is false, as phase14Regression.test.ts documents.
- week.tsx draws flat intake bars when every day has 0 kcal.
- The nutrition chart ceiling label is "${n}g" with no space.
- The gym card may show seed data after a failed dashboard read.
- MacroBars is unused anywhere in the app and does not format numbers.

NEXT
Goals screen, src/app/profile/goals.tsx: loading and error states, plus its English text.