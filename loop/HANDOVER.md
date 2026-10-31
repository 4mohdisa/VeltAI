HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified)
- src/app/dashboard/nutrition.tsx: :77 kicker and title swapped to match the design (kicker Nutrition, title Macros); :79, :86, :89, :95 moved to t(). Macros snapshot in detailChrome.render.test.tsx.snap updated.
- t() also at (tabs)/index.tsx:155, (tabs)/food.tsx:449, (tabs)/gym.tsx:108 (import and hook added), profile/index.tsx:103.
- New keys in en, es, fr: nutrition.macrosTitle, loadFailed, macrosLoadFailed, fromFood, caloriesToday, caloriesTodayLabel; food.loadFailed; gym.loadFailed; profile.loadFailed.
- src/__tests__/hydrationErrorScreens.test.ts: "no screen invents a reason" now also checks six locale keys; literal check kept.

GAP ROWS: none built or edited. No row covers the Macros screen. Profile row (line 94, Settings root) left DIFFERENT.

IN PROGRESS: nothing mid-edit.

LAST CHECKS
- After the profile edit: tsc exit 0; hydrationErrorScreens 10 of 10 passing.
- Last full suite was before these edits; don't assume it is green.
- Keys: en 159, fr 159, es 161 (extras addMenu.voice, addMenu.describeOutLoud).

DECISIONS
- Literal check kept because saved.tsx still uses a literal; it also covered screens since translated.
- Kept briefed key names, so food sits beside foodLog and gym beside gymLog; Isa to decide.
- Profile row not set to BUILT: the design has no load-failure state and the row covers the whole screen.
- profile.loadFailed is separate from gym.loadFailed by request, with identical text.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en'; es and fr never show.
- Render tests have no i18n instance, so snapshots show raw keys, not text.
- hydrationErrorScreens reads source only and doesn't confirm screens use the keys.
- fr apostrophes mixed: plain in foodLog, food; U+2019 elsewhere; caloriesToday uses the \u2019 escape.
- Decode the design in memory with node -e. Old decoded files remain in /tmp/lume-design.
- Avoid \u0027 inside node -e; use String.fromCharCode(39).

NOT FIXED
- Hardcoded: food/saved.tsx:83 (recommended next; add key to test list); (tabs)/gym.tsx:56, :102, :114, :123; profile/index.tsx:62, :82-83; (tabs)/index.tsx:150; EnergyBalanceCard.tsx:131 (asserted in energyBalanceCard.render.test.tsx:62); gym/freeze.tsx:48; StreakCounter.tsx:15.
- (tabs)/index.tsx:115 dashboard.streakLoadError not in test key list.
- DESIGN_GAP_ANALYSIS.md:393, :420 gym.tsx line ranges now two lines out.
- "Calories today" chart may not match the design's "Where the calories came from"; not compared.
- Summary detail views never compared with the design (gap file :62-65, :1456).

WAITING ON ISA
- Device runs: Macros kicker and title, VoiceOver label, each load-failure message.
- Native review of new es and fr strings ("du repas", "de la comida", "de sport").
- Whether to record the Macros and Profile changes in the gap file.