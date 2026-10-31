HANDOVER: branch loop/design-match. Don't switch, push or merge; the loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; nothing has been checked on a device.

BUILT THIS SESSION (no whole row is built)
- Row 85, Food day log (still DIFFERENT): title block values; eyebrow button with chevron opening /food/calendar; new key food.pickDayLabel in en, es, fr (es and fr unreviewed).
- Row 103, Macros detail (still DIFFERENT): card gap 16 via contentStyle in dashboard/nutrition.tsx. Kicker and Breakdown dots NOT BUILT.
- Summary differences (lines 395-424): 14, 25 (letter spacing only), 26, 27 built. Header height 82 EXACT on all three tabs.
- All Summary differences 1-30 re-checked with file and line. Row 110 Profile chrome re-checked.

IN PROGRESS: nothing.
Last checks: tsc 0; EnergyBalanceCard's three test files pass, 65/65.

KEY FILES
src/app/(tabs)/index.tsx, food.tsx; src/app/dashboard/nutrition.tsx; src/components/domain/EnergyBalanceCard.tsx, WeekEnergyCard.tsx, WorkoutsWeekCard.tsx; src/components/display/DetailChart.tsx; src/components/navigation/Screen.tsx, FloatingHeader.tsx.
design/Lume App.html bundles: Summary 185bb533, Food 71f71ac4, Gym 7dc211f6, Profile b09a5e65. Decode into /tmp only.

DECISIONS
- Literals only where no token covers the value (7, -1, 1.1, -0.6, 52).
- Food eyebrow uses Pressable defaults for hit slop; haptics off, matching neighbouring links.
- No BUILT claims for kicker or dots: the differences live in shared DetailChart.tsx, and forking it would break the shared-component rule.

WAITING ON ISA
- Snapshot: detailChrome macros snapshot is RED from the card gap. Fix is one approved jest -u on that file. Never run -u unasked.
- DetailChart.tsx edit approval (kicker, Breakdown dots, stat line); it affects all four detail views and their snapshots.
- Top padding on three tabs. Recommended inset-based.
- Week chart axis: recommended accepting data-driven, because fixed axes clip real values.
- Burn target, weekly target, calories per session, steps data source.
- Profile button initials.

RECOMMENDED NEXT: Energy balance net sign, difference 12 (EnergyBalanceCard.tsx:155). One line, no Isa decision.

SPOTTED, NOT FIXED
- Screen.tsx:163 strip is inset-based, not 82 or 84, on all floating detail screens.
- Parked stats: WorkoutsWeekCard.tsx:40-41, WeekEnergyCard.tsx:106-107.
- energy.tsx, dashboard/week.tsx, training.tsx still have card gap 12.
- Fixing difference 17 needs a SegmentedField change; check inset callers first.
- Streak skeleton and notice (index.tsx:108, :114) sit 2 higher than the loaded row.
- Hardcoded English across EnergyBalanceCard, WeekEnergyCard, WorkoutsWeekCard, MacroBars, index.tsx, calendar.tsx, WeekStrip.tsx.
- Stale doc text: recap lines 430-431; row 85 cites food.tsx:633 and :542 (now about :655, :564); row 104 says BUILT where the list says EXACT.
- Two "flagged report" requests never said what was flagged.

GOTCHAS
Use LC_ALL=C /usr/bin/grep; quote (tabs) paths. Doc row numbers are file lines; grep first. Most suites read source text, so layout is largely untested. src/app/(tabs)/profile does not exist; use src/app/profile.