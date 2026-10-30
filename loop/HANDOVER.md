HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified; no DESIGN_GAP_ANALYSIS.md row covers this work, none changed)
- src/lib/i18n/locales/en.json: added savedMeals (logged, logFailed) and plan (suggested, addTitle).
- es.json: added savedMeals and plan, Isa's values.
- fr.json: added savedMeals, Isa's values. No plan group yet.
- src/components/food/SavedMealsList.tsx:61, :65: toasts use savedMeals keys.
- src/app/dashboard/plan.tsx:87, :99: use plan.suggested and plan.addTitle.

Last full suite, before the plan.tsx and es.json plan edits: 65 suites, 824 tests, 4 snapshots, passing. Last tsc, after them: exit 0.

IN PROGRESS: nothing mid-edit. Recommended next: add plan.suggested and plan.addTitle to fr.json, then a checkpoint run of the full suite.

DECISIONS
- savedMeals is its own group, directly after foodLog, because no group fits and foodLog parity (23 keys across locales) had to hold.
- plan group sits last in en.json and es.json, as plan.tsx had no t() calls.
- plan.suggested has no trailing space; plan.tsx:87 keeps a literal JSX space.
- fr savedMeals.logged uses U+00A0 before the colon and logFailed uses U+2019, per brief. Older French strings use plain spaces, an open question for Isa.

GOTCHAS
- src/lib/i18n/index.ts fixes lng to 'en', so es and fr never show on screen.
- No test covers locale files, SavedMealsList toasts or plan.tsx. A passing suite says nothing about them.
- The Edit tool wrote a plain space when given U+00A0. Check code points with node afterwards.
- plan.tsx path is src/app/dashboard/plan.tsx, not under (tabs).
- Briefs often ban writing to /tmp. Use plain commands without redirecting output.
- Shell is zsh: unquoted $VAR does not word-split, and globs that match nothing error. Grep with LC_ALL=C /usr/bin/grep; xargs cannot take the LC_ALL= prefix.
- Slot value 'Snacks' maps to key snack; slot.toLowerCase() finds nothing.

NOT FIXED
- entry.title is English in plan.addTitle under es and fr, giving "Añadir a Breakfast". It must stay English for the slot route param at plan.tsx:101.
- plan.tsx lines 34 to 39: screen title and "No plan yet" empty state hardcoded.
- SavedMealsList.tsx:26-33 lastLoggedLabel hardcoded, needs plurals.
- fr.json lacks plan, goals, gymLog, dashboard, nutrition, settings.scanAccuracy.
- es.json lacks gymLog, settings.scanAccuracy, some newer goals keys; still has addMenu.voice, addMenu.describeOutLoud.
- SLOT_KEYS duplicated in add.tsx and food.tsx.

WAITING ON ISA
- Device runs: both SavedMealsList toasts, plan Suggested line, VoiceOver Add label, plus earlier food tab items.
- Decisions: "Add to Lunch" capitals, "Delete" versus "Removed", negative margin at add.tsx, "Snacks".
- Native review: all new French and Spanish strings, plus earlier flagged wording.