HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs requirement is in AGENTS.md.

BUILT THIS SESSION (not verified)
- src/app/gym/session.tsx: empty-state label is now "Add an exercise" (design addLabel, no-plan value). inputFor now sends a picked exercise's rest_seconds (:142, :149, :165).
- src/components/navigation/SheetContent.tsx: stale comment replaced.
- DESIGN_GAP_ANALYSIS.md: "What the app does" and "The differences, exhaustively" rewritten to current code; eight log-session citations fixed; Freestyle and "Today / check-in" lines corrected.

GAP ROWS
- No status cell or header count changed. "Gym — session logging (log sheet)" stays BUILT, and its text now records difference 16 as partial and the second-row behaviour.
- Difference 11 records rest seconds as BUILT.

IN PROGRESS: nothing mid-edit.

LAST CHECKS: tsc exit 0; 65 suites and 824 tests passed, after all code changes. No test covers the rest-seconds or label changes.

DECISIONS
- Difference numbers kept, with 15 and 21 removed, because other text cites them by number. A Markdown renderer renumbers from 16 on.
- Line 331's "Add an exercise" belongs to /gym/session. "Log an exercise" is the log sheet's empty state, which only opens /gym/session plain.
- line 150's planned.length === 0 stays, so an empty template cannot commit.
- Only picker extras save rest; planned rows were outside that brief.

WAITING ON ISA
- Already-logged days: build real editing, or change the toast 'open it to edit'. /gym/session writes a second session row (src/lib/data/mutations.ts:173-178).
- Whether the log-sheet row should stay BUILT.
- Earlier handover items: device check of logged card and failure states, native es/fr review, wash pill token, whole-day kcal under the session card, note-text cardio, Freestyle "No", the "1,500 kcal" goal.

NEXT: add 1 to src/app/gym/session.tsx citations above line 165 in DESIGN_GAP_ANALYSIS.md. Do not touch log-session.tsx cites.

NOT FIXED
- plannedRows omits te.rest_seconds (session.tsx:193-199).
- Gap lines 328 ('no edit bar') and 334 (effort and energy in UI) are stale.
- Old-form block in "What the app does" no longer says when it was recorded.
- Empty-status merge at gap line 90 into "Food — My dishes / Saved".
- Design says 'Add something extra' on logged days; the empty state doesn't.
- /gym/session saves all sets at top weight, so volume overstates.
- Try again is hardcoded English with a small tap target; session.tsx strings are untranslated.
- PlannedValuesForm.tsx:200 "Add exercise" not compared to design.

GOTCHAS
- Briefs have named wrong premises; check first.
- Design assets decode in memory with node -e from the __bundler/manifest script; gym is 7dc211f6.
- zsh breaks on unquoted globs and echo ==.
- grep -c returning 0 exits 1, which the tool reports as failure.