HANDOVER: branch loop/design-match. Never switch branch, push, merge or commit. Never open loop/NOTES.md or loop/DECISIONS_LOG.md. Commits appear between rounds ("loop round N"), not from this session.

BUILT SO FAR
This session was almost all doc re-checks. No row became newly built. Only code change: src/components/display/Badge.tsx, color.gray700 to color.label at :19 and :38 (same #171717). It may still be uncommitted.

Rows re-checked in DESIGN_GAP_ANALYSIS.md, statuses unchanged:
- 107, 108 untouched, 109, 110: PARTIAL
- 111: PARTIAL
- 82: BUILT (not verified)
- 84: DIFFERENT

Also corrected: "The differences, exhaustively" items 1-12, 14, 16, 17, 19, 20, 22, 23; "Profile — shared chrome" section; streak strip section (lines 483-492); token drift items 5 and 6.

IN PROGRESS
Row 84 alias cleanup. Next: src/components/navigation/NavBar.tsx:29 (gray200, same value as light2/surface.divider).

FILES
- design/Lume App.html: source of truth. Decode __bundler/manifest in a mktemp script, never into the repo. Modules: Gym 7dc211f6, Profile b09a5e65, Food 71f71ac4.
- src/lib/design/tokens.ts: aliases defined at :50-56.
- src/app/gym/log-session.tsx, session.tsx, streak.tsx, history.tsx; src/app/(tabs)/gym.tsx; src/components/navigation/Screen.tsx, LumeTabBar.tsx, AddMenu.tsx, FloatingHeader.tsx.

DECISIONS
- Screen.tsx bottom padding is blocked on the owner; do not change it.
- Gap 16 (detailChrome energy balance and macros snapshots) is blocked on Isa. Never use -u or edit .snap files.
- Streak strip's "23 sessions · 2 freezes" footnote waits on Isa.
- Strip tap to /gym/streak is an accepted deviation; flame differences are parked.
- Badge style differences were left alone because the brief banned style changes.

LAST RESULTS
Last round: tsc exit 0; tabNavigation and sheetVariant 20 of 20 passed. Last full suite (before the Badge edit): 822 passed, 2 failed (both known). Nothing verified on a device.

GOTCHAS
- zsh does not split $paths; use ${=paths} or separate arguments, or jest reports "No tests found".
- A pipe hides grep's exit code; run grep without one when reporting it. Avoid unquoted == in echo.
- Briefs can carry wrong citations (gym.tsx:243-246 does not exist; that range is in LumeTabBar.tsx). Verify first and report.

NOT FIXED
- DESIGN_GAP_ANALYSIS.md:674 and item 6 (lines 864, 868) still list Badge and "41 lines in 24 files"; now 39 lines in 23 files.
- Row 108 lacks the bottom padding difference.
- streak.tsx:89 labels distinct days (hooks.ts:156) as "Sessions".
- Logged card chevron has no action (TodayCard.tsx:115, :194).
- session.tsx has no logged-day guard.
- "What did you do?" sheet is English only (log-session.tsx:311-392).
- FloatingHeader.tsx:8-9, :24-26 comments disagree with the bundle.
- Design's AI insights screen has no file in src/app/profile/.