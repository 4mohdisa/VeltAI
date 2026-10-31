HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (not verified)
- src/app/food/saved.tsx: t('food.savedLoadFailed') at :85; title t('food.savedTitle') at :76, now "My dishes" (visible copy change).
- src/app/(tabs)/gym.tsx: t() for title, loadingSessions, monthLoadFailed, streakDetailLabel and dayStreak (plurals _one/_other, count). Streak card is one row at :109-126; Longest/Total/Freezes and the Stat import removed; tap to /gym/streak kept.
- src/__tests__/hydrationErrorScreens.test.ts: keys now derived from each LoadFailedNotice in CALLERS, so no hand-written list.

GAP ROWS
- No row set to BUILT. Row 89 stays DIFFERENT, with a three-cell note added at line 90.
- Streak strip row 82 and section at line 414 still say DIFFERENT and describe the old strip; left alone because the briefed line claims a footnote that doesn't exist.

IN PROGRESS: nothing mid-edit. Streak footnote not built.

LAST CHECKS
- Last full suite (before loadingSessions and savedTitle): 65 suites, 824 tests passing.
- Latest: tsc exit 0; hydrationErrorScreens 10 of 10. npx jest gym 37 of 37, last run after loadingSessions.
- Keys: en 168, fr 168, es 170. fr U+00A0 4, U+2019 22; en and es 0.

DECISIONS
- Stopped when briefs were wrong: gym.streakSub doesn't exist; saved.tsx:83 is only the TextField's closing />. Remove that line 83 reference from the queue.
- Passed { count } for plurals; plain {{current}} gave "1 días seguidos".
- Gap note written as a table row because a plain line would split the table.

WAITING ON ISA
- Footnote: permission to add keys; streak.totalGymDays as session count (recommended); separate plural keys gym.streakSessions and gym.streakFreezes. Design text is the fixed sample '23 sessions · 2 freezes', footnote style, secondary label, margin-left:auto.
- Row 89: keep the text list or build the photo gallery. Decide before translating more of this screen.
- Whether the Training list stays (app-only apart from My schedule and My workouts).
- Device runs and native es/fr review.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en'; es and fr never show.
- No test renders the gym streak card or saved foods screen. npx jest saved finds no tests.
- Gap file lines below 90 moved down one; streak citations are now near 394 and 421, with old gym.tsx ranges.
- Decode the design in memory with node -e. zsh breaks on unquoted (tabs) paths and --include globs.

NOT FIXED
- saved.tsx literals at :61, :72, :78, :82, :92, :95-96, :106-108, :127, :144; stale comments :1, :5.
- gym.tsx Training list; date locale :73; row gap 12 vs 11; flame pulses, greys at 0, different artwork.
- food.savedTitle duplicates addMenu.myDishes; addMenu.savedFoods appears unused.
- Hardcoded: profile/index.tsx:62, :82-83; (tabs)/index.tsx:150; EnergyBalanceCard.tsx:131; gym/freeze.tsx:48; StreakCounter.tsx:15.