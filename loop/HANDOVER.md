HANDOVER: branch loop/design-match. Don't switch, push or merge. The loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md; they show as modified, not ours. Say BUILT, never verified; nothing has been checked on a device.

ROW STATUS (DESIGN_GAP_ANALYSIS.md; no row is fully built)
- Row 112, Gym tab: PARTIAL. Bottom 158 EXACT (code re-checked). BUILT: header 82, page gap 14. Top padding still a difference.
- Row 104, Summary tab: PARTIAL. BUILT: bottom 158, header 82, card gap 14. Steps card missing, four non-design items, scope Today only.
- Row 103, Macros detail: DIFFERENT, re-checked, differences listed.
- Row 85, Food day log: DIFFERENT. BUILT: bottom 158, header 82, block gap 14; last-block gap removed only when a failed load hides Meal history. Title block, calorie bar, "left today" open.
- Row 83, Log button: DIFFERENT because of route; earlier work unchanged.

IN PROGRESS: nothing.
Last checks: tsc 0, full suite 65/65 suites, 824/824 tests (before the last doc-only round).

KEY FILES
src/app/(tabs)/gym.tsx, index.tsx, food.tsx; src/__tests__/tabNavigation.test.ts; src/components/navigation/FloatingHeader.tsx, Screen.tsx, LumeTabBar.tsx.
design/Lume App.html bundles: gym 7dc211f6, Summary 185bb533, Food 71f71ac4. Decode into /tmp only; scripts are in /tmp/lume-gym-recheck if it survives.

DECISIONS
- Design 70, 82 and 158 are fixed, measured from the screen edge, so they include the status bar and tab bar.
- 158 and 14 are literals; no token covers them.
- TAB_BAR_CLEARANCE function left untouched.
- Food's last-block 14 stays when a link follows, as it is a gap between blocks.

WAITING ON ISA
- Top padding on all three tabs: inset-based or literal 70. Recommended inset-based; literal 70 leaves 8 under the status bar at a 62 inset.
- Meal history link: keep or remove. Recommended keep; only entry to /food/history found.
- Training list: keep or remove. Recommended keep.
- LoadFailedNotice: accept as deviation. Recommended accept.
- GymPatternsCard padding: 20 or 16.
- Device checks: fade, shadows, pull-to-refresh, title spacing, eyebrow centring, French button label, schedule weekday labels, bottom padding, header strip, Food block gap.

RECOMMENDED NEXT: Food title block, row 85: eyebrow tracking 1 vs 1.1 (food.tsx:439); title tracking 0 vs -0.6, right padding 0 vs 52 (:447); gap 4 vs 0, bottom 4 vs 0, sides 0 vs 4 (:435).

SPOTTED, NOT FIXED
- No screen uses TAB_BAR_CLEARANCE; comments at LumeTabBar.tsx:4 and _layout.tsx:26 are wrong.
- Screen.tsx:163 keeps inset-based header on floating detail screens.
- Summary hardcoded English: index.tsx:146, :149, :179. Summary differences 25-27 open.
- Rows 85 and 104 say BUILT for 158; row 112 says EXACT.
- Stale doc text near lines 236, 310, 438, 448, 534, 588, 1520.

GOTCHAS
Use LC_ALL=C /usr/bin/grep; quote (tabs) paths. Row numbers are file lines; grep first. Suites only read source text, so nothing tests the layout. In zsh, `echo ====` errors.