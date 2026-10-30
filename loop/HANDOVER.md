HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified)
- es.json: settings.scanAccuracy; dashboard.streakLoading, streakLoadError, summaryTitle ("Resumen").
- fr.json: dashboard.streakLoading, streakLoadError, summaryTitle ("Résumé").
- en.json: dashboard.streakLoading, streakLoadError, summaryTitle.
- src/app/(tabs)/index.tsx: lines 102, 109, 115 and 121 now use t().

GAP ROWS: none newly built or edited. This was locale work with no gap row.

IN PROGRESS: nothing mid-edit. Recommended next: remove addMenu.voice and addMenu.describeOutLoud from es.json after confirming nothing uses them. They are the last key difference from en.json. A search found no direct use; dynamic addMenu lookups traced so far use SLOT_KEYS.

LAST CHECKS
- Last full run, before the fr summaryTitle edit: tsc exit 0; 65 suites, 824 tests, 4 snapshots passing.
- After that edit: tsc exit 0, fr.json parses, Jest not run.
- Keys: en 149, fr 149 matching; es 151 (the two extras).

DECISIONS
- Line 121 label now reads "N day streak", dropping "Current streak", because the existing key has no such wording.
- Line 115 is the load-failure notice, so it got its own key rather than dayStreak: the stored number is untrustworthy on that path.
- French streak strings use "jours d’affilée", not "série", because gymLog already uses "séries" for sets. "vos" matches the file's formal address. The wording is a little literal.
- Celebration strings have no {{count}}, since the design shows the number separately. Dashboard strings do.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en', so es and fr never show on screen.
- No test renders (tabs)/index.tsx, and none covers locale files, plural selection or CelebrationCard. Passing suites say nothing about them. --findRelatedTests on index.tsx finds nothing and exits 1.
- The Edit tool can write a plain space for U+00A0. Patch with node using escapes and check code points.
- Briefs often ban /tmp and output redirection. Shell is zsh: quote parenthesised paths and --include globs; grep with LC_ALL=C /usr/bin/grep.
- Check key sets in both directions; a missing-only check hid the es extras.

NOT FIXED
- Hardcoded: plan.tsx:120; nutrition.tsx:77; (tabs)/gym.tsx:112 and :121; gym/freeze.tsx:48; StreakCounter.tsx:15.
- dashboard.welcome and gymBedtime look unused; lastLoggedDaysAgo_one is unreachable.
- entry.title stays English in plan.addTitle.
- SLOT_KEYS duplicated in add.tsx and food.tsx.
- Design's "14-day streak" is hyphenated; the app's string is not.
- Gap row 17 still says "Footnote still missing".

WAITING ON ISA
- Device runs: Summary title; streak loading and failure states; VoiceOver streak labels; celebration card and streak at 1 and above; saved meal cards; plan screen; VoiceOver Add label.
- Native review of all new Spanish and French strings.
- Whether French standardises on U+00A0 and U+2019; fr.json still mixes apostrophes.