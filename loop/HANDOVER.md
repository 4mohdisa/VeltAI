HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs rule is in AGENTS.md.

BUILT THIS SESSION (not verified; es and fr unreviewed)
- src/components/display/LoadFailedNotice.tsx: message prop required, default and its key removed, header comment corrected.
- src/app/(tabs)/gym.tsx: Training list title and four row labels via t() (gym.training, mySchedule, myWorkouts, applyStreakFreeze, sessionHistory).
- src/app/dashboard/week.tsx, src/app/dashboard/training.tsx, src/app/energy.tsx: Breakdown label via t('dashboard.breakdown').
- src/__tests__/summaryDetails.test.ts: all four detail routes strictly checked (macros expects t('nutrition.breakdown')). Source text only.
- Locales: src/lib/i18n/locales/{en,es,fr}.json.

GAP ROWS
No status cell or header count changed. Reason-cell lines added: 82 (freeze label; this also removed its stray <br>) and 112 (Training list labels).

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0 after the final edit. Partial runs only: summaryDetails 47 passed; detailChrome render 4 tests, 4 snapshots passed (English Breakdown on all four screens); tabNavigation, oneTapGymLog, hydrationErrorScreens 24 passed, but none touches the gym labels. No full suite this session. No test renders the Training list or Try again label.

DECISIONS
- Removed the default message: all 9 call sites pass their own, so it was unreachable.
- Gap lines go only where a real table row exists; line 364 has no reason cell, so nothing was written for week.tsx.
- Used fr and es wording exactly as briefed, flagging conflicts rather than changing them.

WAITING ON ISA
- fr: Détail versus Répartition for Breakdown (recommend Répartition); congélation versus gel (recommend "Appliquer un gel de série").
- Which row records week.tsx, or whether a Week row should exist.
- Review es and fr, including new Training labels; device check.
- Earlier open questions: rename plannedExercisesNoDuration; keep the freeze screen; which row records the StreakCounter wrap; Start workout wording.

NOT FIXED (recommended next: first item)
- Remaining hardcoded copy in week.tsx, then training.tsx and energy.tsx.
- Row 112 "padding is 20 vs 16 throughout" may be stale.
- Stale citations: gap doc line 437 (gym.tsx:94-158), line 1505 (lines 72-75).
- dashboard.breakdown and nutrition.breakdown duplicate one label.
- Line 76 doesn't record the Try again change.
- StreakCounter.tsx stale comment and old tokens; freeze strings at count 1; freeze toast before server reply; TodayCard plan.sub prefix; editSavedFood local only; raw item values; /gym/session second row.

GOTCHAS
- Briefs repeat finished work, quote stale lines and wrong paths (src/locales, src/app/training.tsx, dashboard/energy.tsx); check first.
- test.each assertions are shared across routes.
- Design copy is encoded: decode from the __bundler/manifest script with node. Lume screens: 7dc211f6, 185bb533, 71f71ac4, b09a5e65.
- zsh breaks on unquoted globs; quote --include patterns and (tabs) paths. grep exit 1 means no match; use LC_ALL=C /usr/bin/grep.