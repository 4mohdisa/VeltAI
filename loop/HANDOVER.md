HANDOVER: branch loop/design-match. Don't switch, push, merge or commit; the loop script commits. Don't open or edit loop/NOTES.md or loop/DECISIONS_LOG.md (always modified). Nothing has been checked on a device. The last doc edit may still be uncommitted.

BUILT (code only; no row is fully built, all stay PARTIAL or DIFFERENT)
- Row 76, log-session.tsx: items 3, 5, 8 built. Item 2 plus glyph built (SomethingElseGlyph, PLUS_STROKE); add path open. All cited lines were corrected last doc round.
- Row 114, TodayCard.tsx: stays DIFFERENT, 10-item list re-checked; its detail section now matches.
- Row 117: items 2, 3 built; 4 EXACT; 6 fixed (history.tsx:41, :55; streak.tsx:55). Items 5, 7 open outside TodayCard. Items 1, 8 blocked on Isa.

IN PROGRESS: nothing. Recommended next: doc fix at DESIGN_GAP_ANALYSIS.md:855 and :674, which still say deprecated aliases are in use.

KEY FILES
src/app/gym/log-session.tsx, session.tsx, history.tsx, streak.tsx; src/components/gym/TodayCard.tsx, ExercisePicker.tsx; src/lib/design/tokens.ts.
Design: design/Lume App.html, Gym bundle 7dc211f6. Decode __bundler/manifest in memory.

DECISIONS
- Duration and celebration use ticked exercises' plan minutes.
- history.tsx:55 uses color.label, not gray800: tokens.ts asks for intent names. Same value.
- Add path not faked: logging on pick marks the day done, and adding to the template changes future weeks.

WAITING ON ISA
- Add path (row 76 item 2): needs a day-draft store, TodayCard.tsx, gym.tsx and ExercisePicker.tsx (shared with session.tsx).
- detailChrome snapshot: 2 failures (energy balance, macros). Don't touch. Last full run: 822 passed, 2 failed.
- LumeTabBar approval; Screen.tsx:117's 4; row 116 items 1-6, 8; row 117 item 1 cards; Logged pill wash token; sheet resize when the second sheet swaps in.

SPOTTED, NOT FIXED
- DESIGN_GAP_ANALYSIS.md "The differences, exhaustively": differences 8, 10, 19 contradict "What the app does"; citations stale.
- Row 111 and difference 23 cite old LumeTabBar lines; the gym handler is :243-246.
- session.tsx:364 saves the template estimate; templates.tsx shows "about N min" from it.
- minutesOf (log-session.tsx:62) picks by whether a duration is set; the design picks by cardio.
- Tile chevron is an SF Symbol vs a 2.4-stroke path (log-session.tsx:250, bundle :412).
- gymDurationHonesty.test.ts:54 has a stale name; no test covers log-session.tsx:124 or :275.

GOTCHAS
Briefs may carry false premises: row 117 items 5-7 weren't in TodayCard, and the CTA handler is in src/app/(tabs)/gym.tsx:160. Check first and report. Use jest --ci, never -u. findRelatedTests finds no tests for gym screens, and exits 1 without --passWithNoTests. Source-reading suites are in src/__tests__: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation. Grep won't find a suite by its own name; use find. Use mktemp for decode scripts. In zsh, quote "===". Don't mark BUILT if differences remain.