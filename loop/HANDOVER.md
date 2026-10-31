HANDOVER: branch loop/design-match. Don't switch, push or merge. The loop script commits. Don't open loop/NOTES.md or loop/DECISIONS_LOG.md.

ROW STATUS (DESIGN_GAP_ANALYSIS.md; everything is BUILT, not verified)
- Row 85, Day log: DIFFERENT. Wording fixed; useGoals() fills macro bars, calorie goal unused.
- Row 87, Quick add: DIFFERENT. BUILT: hero press 60%, discs/presets background-only press, confirm active at 0 kcal, Meal chip padding and shrink removed. "Still open" list aligned.
- Row 112, Gym tab: PARTIAL. BUILT: Log button under session card, and visibility per showLogCta. Padding is Blocked on Isa.

IN PROGRESS: nothing. Last check: tsc exit 0; 3 gym-related suites, 24/24. Last full app suite 824/824, before the gym.tsx changes.

KEY FILES
- src/app/(tabs)/gym.tsx, src/components/domain/GymSessionButton.tsx
- src/components/gym/TodayCard.tsx, GymPatternsCard.tsx
- src/app/food/quick-add.tsx, src/components/forms/SegmentedField.tsx
- design/Lume App.html: food 71f71ac4, gym 7dc211f6. Decode __bundler/manifest with node into /tmp only.

DECISIONS
- compact in SegmentedField drops chip padding and shrink; only Quick add passes it.
- "Not past" needs no check: Gym tab only shows today.
- Log button uses streak.gymLoggedToday and useToday() exercises.
- Saving 0 kcal is allowed, as in the design; backend accepts it.

WAITING ON ISA
- Log button hidden on rest days and with no schedule (+ menu and Summary card still log).
- GymPatternsCard padding: 20 or 16.
- Quick add: 17/24 confirm label, 180ms chip transition, figure and meal defaults.
- Device checks: gym button; Quick add bottom spacing, KeyboardAvoidingView, chips (French "Petit-déjeuner" may truncate); Day log macro bars and wrapping.
- Day log: 12px calorie bar and "left today" figure.
- Whether TestPG_* must run against Postgres.

SPOTTED, NOT FIXED
Recommended next: update row 83 and its section ("App" paragraph near line 532): position, conditions and "Logged today" pill are stale. Copy, icon and route differences stand. Settle row 83 versus row 112 overlap.
- GymSessionButton logged branch is dead; gym.tsx always passes false.
- Two logged sources: streak.gymLoggedToday and today.already_checked_in.
- gym.tsx makes two getToday requests (also TodayCard).
- + menu reopens log sheet when logged; design toasts.
- Stale comments: gym.tsx header and above MuscleChart; SegmentedField label comment.
- Doc: summary-table Quick add entry says "(line 86)", wrong column; row 87 repeats BUILT entries; line 103 "hardcoded English" unchecked.
- Hardcoded: NumberEntryBar 'Done', quick-add 'Quick add', SheetContent 'Close', GymSessionButton copy.
- SLOT_KEYS duplicated in detail.tsx and quick-add.tsx.

GOTCHAS
- Use LC_ALL=C /usr/bin/grep; quote (tabs) paths.
- No test renders quick-add, gym.tsx or SegmentedField; suites only read source text.
- Line numbers shift; grep before citing.
- loop/ notes show modified; not ours.
- Say BUILT, never verified.