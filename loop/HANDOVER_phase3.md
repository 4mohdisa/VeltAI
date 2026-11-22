HANDOVER: Lume Phase 3, branch loop/phase3

ROWS
- BUILT: 1, 2, 3, 4, 7, 9, 10. Rows 9 and 10 still need owner checks.
- PARTIAL: 5, 8, 12, 13, 14, 15.
- DIFFERENT: 6, 11, 16, 17.
- There is no separate copy-pass row. Copy work is logged in Row 15 ("Empty states: Goals and progress").

BUILT THIS SESSION
- Row 10: feedback added to exportSections in backend/internal/auth/export.go. Help and feedback row placed after Export in src/app/profile/index.tsx and opens /profile/feedback; keys profile.helpAndFeedback and profile.helpAndFeedbackHint; test settingsHelp.render.test.tsx. Feedback section added to PRIVACY_DATA.md.
- Row 15 copy:
  - SettingsList destructive hint now reads settings.destructiveHint (test settingsDestructiveHint).
  - Support screen strings moved to support.* keys (test supportCopy).
  - Privacy Export row reuses settings.export* keys (test privacyExport).
  - Privacy footer uses settings.dataFooter (test privacyBody).
  - Round 234: the Units eyebrow was already translated, so no code change.
  - Round 235: both Spanish 'Tus datos' eyebrows already go through t(), so no code change.
- Locale files live in src/lib/i18n/locales/ (en, es, fr).

LAST GATES
- Round 233 full Jest run: 209 suites and 1236 tests passed, 4 snapshots passed. tsc 0 errors.
- Rounds 234 and 235 changed no code; their targeted tests pass.
- Go: everything passed in round 220. The 20 real-database TestPG_* tests were skipped, because no local database was set up.

IN PROGRESS
Nothing.

DECISIONS
- Check every prompt against the files first. Several prompts asked for work that was already done (the feedback row, the Units eyebrow). Report it and don't duplicate it.
- Never edit existing tests. When an existing test blocks a change, back out the change and ask Isa.
- Reuse existing keys when the text is identical or close, for example settings.exportError on Privacy.
- Typed routes don't include /profile/feedback, so it needs the 'as Href' cast like the other rows in that file.

WAITING ON ISA
- Permission to edit src/__tests__/render/privacyLocale.render.test.tsx line 56 (change the count to 0 for es and fr), so the Privacy "Your data" title can use t('settings.privacyEyebrow').
- Spanish uses 'Tus datos' for both the Account and Privacy eyebrows; Isa to decide on the Account wording.
- Wording to confirm: the Spanish and French Support copy, and the round 228 toast.
- How long feedback is kept, the hosted feedback migration, which local database is Lume's, and the Row 9 and Row 10 owner checks.

GOTCHAS
- Run source ~/.nvm/nvm.sh && nvm use 22 first. No git, Prettier or Maestro.
- zsh rejects grep --include.
- PHASE3_ROWS.md is a table, so append notes inside the row's cell. A new line breaks the table.
- Profile render tests must mock StreakCounter.

UNFIXED
- The Privacy share-sheet subject is still hard-coded as 'Lume data export'.
- There are two Export rows.
- Support's mail feedback box overlaps the new feedback screen.
- The feedback app version includes the build number.
- The Row 10 notes from rounds 216 and 218 are out of date.
- Not checked yet: straight apostrophes in fr.json, the goals spoken calorie label, Scan accuracy and Integrations body copy.

NEXT
Check fr.json for straight apostrophes against the file, then the goals spoken calorie label.