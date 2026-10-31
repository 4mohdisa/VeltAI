HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (not verified)
- src/app/food/saved.tsx: comments at lines 1 and 5 now say "My dishes".
- Locale files (src/lib/i18n/locales/): addMenu.savedFoods removed. Keys now en 167, es 169, fr 167.
- src/components/gym/TodayCard.tsx: all five Card uses have padded={false}, style={{ padding: space.lg }}, the gym.tsx:130 pattern.

GAP FILE (DESIGN_GAP_ANALYSIS.md)
- Row 82 (streak strip): BUILT (not verified). Streak section at line 415 and citations updated.
- Row 113 (TodayCard): DIFFERENT; padding recorded, all five states still differ.
- Lines 399-401: padding corrected. Strip and calendar match; MuscleChart is 20 vs 16.

IN PROGRESS: nothing mid-edit.

LAST CHECKS
- tsc exit 0 after the row 113 edit.
- npx jest gym 37 of 37, run after the TodayCard change.
- Last full suite: 65 suites, 824 tests, run before the TodayCard change.

DECISIONS
- Card has no padding prop; Isa approved padded={false} rather than changing shared Card.
- Row 82 "accepted deviation" wording came from the brief; no earlier sign-off found.
- Row 82 omits the missing footnote as briefed; section Differences records it.

WAITING ON ISA
- Footnote "23 sessions · 2 freezes": keys, streak.totalGymDays as session count, plural keys.
- Row 89: text list or photo gallery.
- Whether the Training list stays.
- Device runs and native es/fr review.

NEXT: MuscleChart padding (src/components/gym/MuscleChart.tsx:114, :141). Fix the missing comma at gap lines 399-400 in the same round.

GOTCHAS
- npx jest i18n finds no tests and exits 1. No test renders TodayCard, the streak card or saved foods.
- src/lib/i18n/index.ts:41 fixes lng to 'en'.
- Design gym markup is in decoded asset 7dc211f6; add menu in 71f71ac4. Decode in memory with node -e.
- Quote "src/app/(tabs)" paths in zsh.

NOT FIXED
- Gap line 458 heading says PARTIAL MATCH; row 113 says DIFFERENT.
- Gap line 464 "four branches" omits loading; line 466 "matching the design" is loose for loading and nothing scheduled.
- TodayCard: header, pill and chip values differ; returns null with no schedule data; hardcoded strings.
- Unused addMenu keys: voice, describeOutLoud (es only); snapMeal, scanPackage, oneTapReadd (all three). Read the slotKey assignment near add.tsx:67 before removing.
- Duplicates: SLOT_KEYS in (tabs)/food.tsx:84 and food/add.tsx:34; food.savedTitle and addMenu.myDishes.
- Hardcoded: gym.tsx:151-156, GymPatternsCard.tsx:85, saved.tsx literals.
- gym.tsx:117 gap 12 vs 11; gym.tsx:3-4 "month month" typo.