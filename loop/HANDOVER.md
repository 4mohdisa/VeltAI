HANDOVER: branch loop/design-match. Don't switch, push, merge or commit. The loop script commits, so check with git show --stat HEAD and git status. Don't open or edit loop/NOTES.md or loop/DECISIONS_LOG.md (always modified; not ours). Nothing has been checked on a device.

BUILT
No code changed this session; all edits were doc-only, in DESIGN_GAP_ANALYSIS.md. No table row is fully built. Rows 108 (Support) and 109 (About) stay PARTIAL.
- Row 108: item 7 moved out of the numbered list (now 1-6 plus an unnumbered "Exact" line). Item 4 maps each value to its citation and adds growth and start heights. Geometry line has per-value bundle citations.
- Row 109: all citations correct; added bundle :566 to four geometry values.

IN PROGRESS: nothing. The last row 108 item 4 edit may be uncommitted until the loop commits it.
Last full run: tsc 0; jest --ci 64/65 suites, 822/824 tests. Only failures: energy and macros in src/__tests__/render/detailChrome.render.test.tsx.

KEY FILES
src/app/profile/support.tsx, about.tsx; src/components/forms/TextField.tsx; src/components/display/SettingsList.tsx; src/lib/design/tokens.ts; src/lib/appVersion.ts.
design/Lume App.html: Profile bundle b09a5e65. Read the __bundler/manifest script, gunzip the base64 data, decode to /tmp or in memory. "bundle :N" means decoded-bundle lines.

DECISIONS
- Placeholder and text colours match under different token names (#8A8A8A, #171717), so they aren't differences.
- Item 4 app field grows and design field doesn't; the brief had this reversed. Code-read only.
- 114 is rounded from the app's 52 × 2.2 = 114.4; 114.4 isn't in the design. Design's about 112 is calculated.
- tokens.ts:146 is type 17/24, not growth; growth cites TextField.tsx:62.
- Item 4 citations follow their values, so they aren't in numeric order.
- Used bundle :566, not design/Lume App.html:566; that file has 384 lines.
- Colour hex definitions are at design/Lume App.html:382.

WAITING ON ISA
- SettingsList row geometry: fix or accept. Settles rows 107-109; affects every screen using it. Recommended next.
- detailChrome snapshot approval; never run jest -u unasked.
- Earlier: DetailChart.tsx and LumeTabBar.tsx approvals; About header; Logged pill wash token; row count; top padding.

SPOTTED, NOT FIXED
- No test covers Privacy, Support or About layout. The three suites referencing app/profile/ (tabNavigation, phase14Regression, hydrationErrorScreens) don't check it.
- Detail sections at doc lines 484, 509, 631, 828 (parked) and 1421 disagree with rows.
- Tab bar: Reduce Transparency pill fill; GlassSurface may clip the pill shadow. Needs a device.
- exercise-progress.tsx hardcodes kg; gym.tsx:155 comment is false; hardcoded English across Profile screens.

GOTCHAS
Briefs often carry false premises; check first and report them. Use jest --ci to avoid writing snapshots. Don't echo === in zsh. Use LC_ALL=C /usr/bin/grep; quote paths with spaces. Doc row numbers are file lines. Repeat verify rounds on rows 108 and 109 add nothing.