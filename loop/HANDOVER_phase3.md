HANDOVER: Lume Phase 3, branch loop/phase3

ROWS (PHASE3_ROWS.md)
- Rows 1 to 4: built.
- Row 5: partial. The Maestro part needs Isa.
- Row 12: done, waiting for Isa to say "built".
- Row 13 (Food log): partial.
- Row 14 (Gym): PARTIAL. Status was changed from DIFFERENT in round 89. Notes run through round 100.
- No row became built this session.

ROW 14 DONE (rounds 85 to 100)
- Failed read shows LoadFailedNotice: templates, history, session, streak and freeze have Retry. Exercise-progress and muscles have the notice but no Retry.
- Strings translated on those screens. All of session.tsx is translated.
- Calm empty states added on streak and freeze.
- The "Close", "Go back", "Back to" and "Done" labels in SheetContent, GlassButtons and BottomSheet are translated.
- New locale blocks: gymTemplates, gymExerciseProgress, gymMuscles, gymStreak, gymFreeze. New common keys: close, goBack, backTo.
- Last full-suite checkpoint (round 87): 160 suites, 1073 tests, 0 failed.

IN PROGRESS
Nothing half-done.

KEY FILES
- Screens: src/app/gym/{templates,exercise-progress,muscles,session,streak,freeze}.tsx
- Components: src/components/navigation/{SheetContent,GlassButtons,BottomSheet}.tsx
- Locales: src/lib/i18n/locales/{en,es,fr}.json. The path src/locales does not exist.
- Tests: src/__tests__/render/, files named gym*.emptyStates, gymMuscles, sheetContent.close, bottomSheet.close, glassButtons.labels.

DECISIONS
- Use the screen's own hook. useTemplates and useGym have refetch. useExerciseProgress and useGymPatterns do not, so their notice has no Retry until Isa allows a change to src/lib/data.
- On streak and freeze, "empty" means longest streak and total sessions are both 0. Zero freezes left is still data: freeze.render.test pins "0 freezes".
- While the first read runs with nothing stored, streak and freeze show nothing. A skeleton there would crash gymStreak.render.test, which may not be edited.
- Locale blocks are inserted as text. Identical text reuses existing keys, in any namespace.
- GlassButtons.tsx was changed in round 98 although the brief did not name it. The freeze sheet's Close lives there.

BLOCKED (Isa)
- Spanish and French wording for every new block.
- Permission to add refetch to the two hooks above.
- Approval of the GlassButtons change.
- Two loop briefs (rounds 92 and 95) asked for work already done. The loop's task list is behind PHASE3_ROWS.md.

GOTCHAS
- Before any command, run: source ~/.nvm/nvm.sh && nvm use 22. No git (read .git/HEAD for the branch), no Prettier, no Maestro.
- Fetch mocks must answer by URL. A single response for every URL breaks the sessions read.
- A picked extra exercise starts ticked.
- Dev builds seed mock gym data on store reset. Set it to empty after reset.

UNFIXED
- The freeze offline toast claims success even when the request fails.
- The planned-weight unit (kg or lb) is not translated.
- gymMuscles.shape and sheetContent.render check English text instead of en.json.
- The "has a streak" check is duplicated in streak.tsx and freeze.tsx.
- gymMuscles.goBack duplicates common.goBack.
- The "background sync failed" warning prints in the gymSession.emptyStates suite.