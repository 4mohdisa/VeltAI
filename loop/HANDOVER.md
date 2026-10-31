HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs rule is in AGENTS.md.

BUILT THIS SESSION (not verified; all via t() with en, es, fr; es and fr unreviewed)
- src/app/dashboard/nutrition.tsx
- src/app/gym/freeze.tsx
- src/components/domain/StreakCounter.tsx (reuses gym.dayStreak)
- src/app/profile/index.tsx (restore() now takes t)
- src/components/gym/TodayCard.tsx: strings; sub-line now only "N exercises planned"
- src/components/display/LoadFailedNotice.tsx: Try again label (common.tryAgain)

GAP ROWS
No status cell or header count changed. BUILT lines were added inside reason cells: 103 (Macros detail), 82 (freeze), 95 (Settings root), 114 (today's session card). 114 also records the accepted tap-target deviation. Citation at 297 now reads TodayCard.tsx:246.

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0 after the final edit. Last full suite: 65 suites, 824 tests passed; it predates the TodayCard and LoadFailedNotice edits. No test references TodayCard or renders freeze, StreakCounter, the profile screen or the retry label.

DECISIONS
- Rows stay ❌ when other differences remain, because BUILT would be false.
- TodayCard uses plannedExercisesNoDuration, because the es and fr plannedExercises values held minutes text and showed a literal {{minutes}}; those keys were deleted.
- Design has no failure notice, so Try again keeps minTapTarget={false}; Isa accepted this.

WAITING ON ISA
- Rename plannedExercisesNoDuration to plannedExercises?
- Should the freeze screen stay (design has none, tests call it parked), and the freeze sentence stay on line 82?
- Which row should record the StreakCounter wrap (removed from 82)?
- Start workout wording is not in the design.
- Review es and fr, including Gels, Congelaciones and the AI insights wording.
- Device check.

NOT FIXED (recommended next: first item)
- Default message "Couldn't load the latest." in LoadFailedNotice.tsx.
- (tabs)/gym.tsx:155 'Apply a streak freeze'; "Breakdown" on week.tsx, training.tsx, energy.tsx.
- Line 82 stray trailing <br>; line 76 doesn't record the Try again change.
- StreakCounter.tsx: stale line 2 comment, old colour tokens.
- Freeze strings read wrongly at count 1 ("1 of your 1 freezes", "racha de 1 días").
- Freeze toast shows before the server replies; refusal handling unchecked.
- TodayCard: design's plan.sub prefix needs a data field.
- Earlier handover list (editSavedFood local only, raw item values, /gym/session second row) still stands.

GOTCHAS
- Briefs repeat finished work, quote stale lines and name rows or strings that don't exist; check first.
- Design copy is encoded: decode from the __bundler/manifest script with node. Raw grep misses it. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh breaks on echo === and unquoted globs; quote (tabs) paths.
- grep exiting 1 means no match. Use LC_ALL=C /usr/bin/grep.