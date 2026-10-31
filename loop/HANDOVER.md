HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Expo docs rule is in AGENTS.md.

BUILT THIS SESSION (not verified; es and fr are unreviewed drafts)
- src/app/(tabs)/food.tsx: CaloriesCard macro names and energy label; logged-row VoiceOver label and hint; swipe-delete title and message, now date-neutral.
- src/components/navigation/LumeTabBar.tsx: all tab labels; add-button VoiceOver strings.
- src/components/navigation/AddMenu.tsx: close label; two menu labels.
- src/app/(tabs)/_layout.tsx: all three titles.
- src/lib/i18n/locales/{en,es,fr}.json: nutrition.energyLogged; tabBar.*; addMenu.logGymSession, logFood; food.rowAnalysing, rowAnalysisFailed, rowHint, removeTitle, removeMessage.

GAP ROWS
No status or header count changed, and no row became BUILT. Reason lines added: 85 (Food day log), 118 (tab shell), 1503 ('+' menu), item 28 at line 955.

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0. foodDates 26 passed, after the final edit. tabbar.render 13 passed, last run before the food.tsx rounds. Six food source-text tests 111 passed, before the swipe-delete edit. No full suite.
NOT COVERED: Food tab rendering, VoiceOver output, swipe dialog, energyLogged, _layout titles, es and fr rendering.

DECISIONS
- Tab labels reuse food.title, dashboard.summaryTitle, gym.title: tabs.summary and tabs.gym did not exist and no new keys were allowed. They share wording with those screens.
- energyLogged is es "en total", fr "au total": no agreement with kcal or kJ, reads after the number.
- tabBar.closeMenu kept separate from closeAddMenu: different controls, and a test finds "Close menu".
- "Analysing photo" is design wording; not every pending path was traced.

WAITING ON ISA
Native review of es and fr, including fr Sport; device and VoiceOver checks, including long es and fr add-menu labels wrapping in the 232pt panel; decision on a tabs.* namespace.

NOT FIXED (recommended next: first item)
- SwipeableRow.tsx:32,39 'Delete' and 'Cancel' defaults; dialog is half translated. common.cancel exists.
- Other swipe prompts: food/saved.tsx:115-116, food/new-recipe.tsx:144, gym/new-template.tsx:220.
- food.tsx: visible "Analyzing…" (about 875), spelling differs from VoiceOver; P, C, F letters; g suffixes; raw energyUnit; "Check your connection" invents a cause.
- tabBar.addHint es reads badly; addMenu.voice and describeOutLoud exist only in es.json.
- Missing Fibre column; key={c.name} is translated; duplicate goals.* and nutrition.* macros.
- Earlier list: date formatters, "of N days" plurals, GymPatternsCard values, SLOT_KEYS, savedTitle.

GOTCHAS
- Briefs quote stale lines and wrong premises; check first.
- Decode design from __bundler/manifest with node; screens 71f71ac4, 185bb533, 7dc211f6.
- zsh breaks on unquoted globs and (tabs) paths; use LC_ALL=C /usr/bin/grep. A piped grep's exit code can mislead.
- Test i18n is fixed to English. Some tests find controls by English label, so English changes can break them.