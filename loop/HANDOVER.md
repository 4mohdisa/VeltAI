HANDOVER: branch loop/design-match. Don't switch, push or merge; the loop script commits, so git diff is often empty, use git show --stat HEAD. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md (always modified; not ours). Nothing has been checked on a device.

BUILT
No code changed this session; all work was doc-only in DESIGN_GAP_ANALYSIS.md. No whole table row is built.
- Re-checked rows, status unchanged: 107, 108, 109 (Profile Privacy, Support, About), 115, 116, 117, 118: PARTIAL. 114: DIFFERENT.
- Row 107 was verified correct in the last round; no correction needed.
- Earlier code work, still only partial: Summary difference 12; rows 76, 103, 107, 108, 109.

IN PROGRESS: nothing.
Last run: tsc 0; three suites by path, 39/39. Full jest not run this session (earlier 64/65 suites, 822/824; failures were energy and macros detailChrome snapshots).

KEY FILES
src/app/profile/privacy.tsx, support.tsx, about.tsx; src/components/display/SettingsList.tsx; src/components/forms/TextField.tsx (forms, not form); src/components/gym/TodayCard.tsx; src/components/domain/GymCalendar.tsx; src/app/gym/exercise-progress.tsx; src/components/navigation/LumeTabBar.tsx, GlassButtons.tsx.
design/Lume App.html bundles: Profile b09a5e65, Gym 7dc211f6, Summary 185bb533, Food 71f71ac4. Decode with node to /tmp, delete after.

DECISIONS
- Row lists live in the summary table; detail sections point to them.
- Row 107 says the design has no AI group, not the brief's "shows it unconditionally": no AI group or consent text exists in the Privacy section.
- Kept :499, :510 for footnote type and padding; gap 8 cites :489, :502.
- Row 109 cites About's glyph at bundle :568; :475 and :478 are Privacy lines. About has no chevrons (EXACT).
- Row 114 stays DIFFERENT: tap target and planned grid missing.

WAITING ON ISA
- SettingsList row geometry: fix or accept. Settles rows 107-109, but affects every screen using it. Recommended next.
- jest -u on detailChrome; never run -u unasked.
- DetailChart.tsx and LumeTabBar.tsx approvals; About header; Logged pill wash token; row count; top padding and others from earlier.

SPOTTED, NOT FIXED
- Row 108: item 7 is EXACT inside the differences list; item 4 omits field growth (start height nearly equal: 114 vs about 112).
- Tab bar: Reduce Transparency pill fill equals active cell #F2F2F7; GlassSurface overflow hidden may clip the pill shadow. Needs a device.
- No test references the Privacy, Support or About screens, or names SettingsList.
- Detail sections at doc lines 484, 509, 631, 828 (parked) and 1421 disagree with rows.
- exercise-progress.tsx hardcodes kg. gym.tsx:155 comment is false. Hardcoded English across Profile screens.

GOTCHAS
Briefs can cite stale paths, values or false claims; check first. Grep app/profile/, not src/app/profile/, for tests. Use LC_ALL=C /usr/bin/grep; quote (tabs) paths. Doc row numbers are file lines. Repeat verify rounds on row 107 add nothing.