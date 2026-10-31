HANDOVER: branch loop/design-match. Don't switch, push or merge; the loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md (both show modified; not ours). Say BUILT, never verified; nothing has been checked on a device.

BUILT (no whole table row is built)
- Summary difference 12 (doc line 406): net sign. BUILT.
- Line 76, Gym chooser: PARTIAL, eight differences listed.
- Line 103, card gap: PARTIAL. nutrition.tsx:76 and energy.tsx:52 are 16; week.tsx:54 and training.tsx:64 still 12. Row status stays DIFFERENT.
- Line 107 Privacy: gap 22, footnotes on SettingsList footer. PARTIAL.
- Line 108 Support: gap 20 (space.xl). PARTIAL.
- Line 109 About: gap 26, wordmark gap 6, app-only padding removed. PARTIAL.
- Lines 111, 113 re-checked: PARTIAL, doc only.

IN PROGRESS: nothing.
Last full run: tsc 0; jest 64/65 suites, 822/824 tests. Later rounds changed no code.

KEY FILES
src/app/gym/log-session.tsx; src/app/profile/privacy.tsx, support.tsx, about.tsx; src/app/energy.tsx; src/app/dashboard/*; src/components/display/SettingsList.tsx; src/components/navigation/Screen.tsx, AddMenu.tsx, LumeTabBar.tsx; src/lib/design/tokens.ts.
design/Lume App.html bundles: Summary 185bb533, Food 71f71ac4, Gym 7dc211f6, Profile b09a5e65. Decode to /tmp only, delete after.

DECISIONS
- Literals only where no token covers the value (22, 26, 6).
- Rest day redirects to /gym/session picker; closing it does not return to the Gym tab, unlike the design.
- Row lists live in the summary table; detail sections point to them.
- Rows keep their open items even if a brief says fewer remain.

WAITING ON ISA
- One jest -u on detailChrome for the red energy and macros snapshots (only failures; diff was the intended gap). Never run -u unasked.
- DetailChart.tsx approval (Kicker, Breakdown dots).
- LumeTabBar.tsx approval: + menu opens the chooser on logged days; finishing can write a second session row.
- About header: recommended removing, keeping an accessible heading.
- Row count: table has 42 rows, not 41, no numbers. Top padding, week chart axis, burn and weekly targets, steps source, Profile initials remain from earlier.

RECOMMENDED NEXT: doc-only fix of line 107 (footnote text false, citations shifted) and line 108 items 1-3 (one line off).

SPOTTED, NOT FIXED
- Row 103's Energy snapshot stays red until approval; week and training pass only because they still differ.
- No test covers privacy, support, about or log-session layout.
- About: tracking 0 vs -0.6 (about.tsx:16), tagline centring (:19).
- Screen.tsx:117 paddingBottom 4 (parked).
- Unused keys gymLog.restDayMessage, logAnExercise.
- Doc lines 192, 229 stale; section at 855 overlaps FAB row.
- Hardcoded English across the Profile screens, schedule.tsx, EnergyBalanceCard.
- Old /tmp/lume-* folders from earlier sessions remain.

GOTCHAS
Briefs can cite stale paths or values: src/theme/tokens.ts and dashboard/energy.tsx don't exist; check first. Use LC_ALL=C /usr/bin/grep; quote (tabs) paths. Doc row numbers are file lines. Most suites read source text.