HANDOVER: branch loop/design-match. Don't switch, push, merge or commit; the loop script commits. Don't open or edit loop/NOTES.md or loop/DECISIONS_LOG.md (always modified). Nothing has been checked on a device. The last edit may still be uncommitted.

BUILT (in code only; no row is fully built, all stay PARTIAL)
- Row 113, schedule.tsx: items 3, 10 built. Title-to-card stays 24 vs 20 (Screen.tsx:117). Item 11 open.
- Row 116, GymCalendar.tsx: month button pressed opacity only. Items 1-6, chevron stroke, 8 (nav buttons lay out at 44) open.
- Row 117: items 2, 3 built (TodayCard.tsx); 4 EXACT. Item 1: 3 of 13 extra cards EXACT, 3 DIFFERENT, 7 no counterpart. Items 5-10 open.
- Row 118, LumeTabBar.tsx: items 1-3, 6-11 built. Items 4, 5 need a device; 12, 13 kept.
- Row 76, log-session.tsx: item 3 built (SomeOfItSheet). Item 5 fixed in code, but the doc still lists it open.

IN PROGRESS: nothing. Recommended next: update row 76 item 5 in the doc.

KEY FILES
src/app/gym/log-session.tsx, schedule.tsx, session.tsx; src/components/gym/TodayCard.tsx; src/components/domain/GymCalendar.tsx; src/components/navigation/LumeTabBar.tsx, SheetContent.tsx, Screen.tsx; src/lib/design/tokens.ts.
Design: design/Lume App.html, Gym bundle 7dc211f6. Decode __bundler/manifest in memory.

DECISIONS
- Duration and celebration use plan minutes of ticked exercises, not the template estimate; completion rate is the ticked share (my choice, not in the design).
- No kcal tag on second-sheet rows: no per-exercise burn exists.
- Second-sheet copy is English only; i18n is parked.
- Tab bar offset stays raised for insets above 34.
- Active cell keeps emitting tabPress (scroll-to-top contract).
- Frozen fill and loading strings recommended to keep, awaiting Isa.

WAITING ON ISA
- detailChrome snapshot: 2 failures (energy balance, macros) from contentStyle gap 16. Don't touch. Last full run: 822 passed, 2 failed.
- Confirm the earlier LumeTabBar approval covers my edits.
- Removing Screen.tsx:117's 4; row 116 items 1-6, 8; row 117 item 1 cards.
- Sheet resize under fitToContents when the second sheet swaps in.

SPOTTED, NOT FIXED
- session.tsx:364 still saves the template estimate; templates.tsx shows "about N min", which can now differ.
- ticklist mode in session.tsx is unreached from the sheet.
- Failed schedule fetch shows an empty week card; failed templates fetch looks like zero templates, so the picker offers only Rest day, which could overwrite a workout.
- TAB_BAR_CLEARANCE has no non-test callers; the bar is 14 higher with no inset, so last rows may hide.
- Row 76 and 113 citations are stale. Row 114 not re-read since the TodayCard edits.
- Logged pill wash (row 117 item 8) is flat; mixHex could fix it.

GOTCHAS
Briefs may carry false premises; check first and report. Use jest --ci, never -u. findRelatedTests misses source-reading suites: sheetVariant, gymDurationHonesty, oneTapGymLog, tabNavigation; run them when touching those files. sheetVariant needs variant first on SheetContent and the exact asPlanned Button line. Don't mark BUILT if differences remain.