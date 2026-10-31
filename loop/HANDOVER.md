HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs rule is in AGENTS.md.

BUILT THIS SESSION (not verified; es and fr unreviewed)
- Copy moved to t(): src/app/dashboard/week.tsx, training.tsx, src/app/energy.tsx (also stable Breakdown row ids), src/components/gym/GymPatternsCard.tsx, src/app/(tabs)/food.tsx (two ErrorState messages, Food title, Calories title).
- src/components/domain/StreakCounter.tsx: label, secondary and tertiaryLabel tokens; caption now color.label; comment fixed.
- src/app/(tabs)/gym.tsx: comment typo only.
- Locales: src/lib/i18n/locales/{en,es,fr}.json.

GAP ROWS
No status or header count changed. Reason lines added or corrected: 76 (Try again lives in LoadFailedNotice.tsx), 85 (Food titles), 112 (padding claim corrected: only GymPatternsCard keeps 20). Lines 436 and 1505 citations were correct; left alone. No rows exist for week, training or energy.

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0. Six food source-text tests: 111 passed. summaryDetails and detailChrome: 51 passed, 4 snapshots, last run before the gym and food rounds. No full suite. NOT COVERED: LoadFailedNotice, StreakCounter, GymPatternsCard, Food tab, empty states, es and fr rendering, _one forms.

DECISIONS
- Kept app English where design copy claims data the app lacks (steps, burn target, weekly target).
- Calories card reuses gymLog.celebration.calories, as briefed; shared wording risk flagged.
- food.title is Comida and Repas; alternatives flagged.
- Didn't set row 85 to BUILT: it covers the whole screen.
- Corrected brief errors rather than writing false citations.

WAITING ON ISA
es and fr review; device check (minutesCeiling, eatenAgainstBurned, inAndOut); fr Détail or Répartition; congélation or gel; GymPatternsCard padding 20 or 16; gap rows for detail screens; design wording differences; empty day: four meal cards or "No meals yet"; separate food.caloriesTitle.

NOT FIXED (recommended next: first item)
- CaloriesCard macro names, food.tsx:665-667.
- Tab label 'Food': LumeTabBar.tsx:38, (tabs)/_layout.tsx:32.
- Parked: formatRelativeDate, weekdayShort, dayMonth, formatDuration; "of N days" plurals.
- GymPatternsCard: server day and muscle values untranslated; "85%" format.
- "Check your connection" invents a cause; "today's" shows on other dates.
- SLOT_KEYS, food.savedTitle, raw item values; unused StreakCounter props; possible missing accessible prop; duplicate keys across namespaces; freeze strings and toast; TodayCard plan.sub; editSavedFood local only; /gym/session second row.

GOTCHAS
- Briefs quote stale lines and wrong premises; check first.
- Design copy: decode from __bundler/manifest with node. Food is 71f71ac4; energy, week and training details are 185bb533.
- zsh breaks on unquoted globs and "$s[" inside double quotes; quote (tabs) paths. grep exit 1 means no match; use LC_ALL=C /usr/bin/grep.
- i18next plurals need both _one and _other; fr treats 0 as one.