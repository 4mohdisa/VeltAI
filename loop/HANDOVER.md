HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified; no DESIGN_GAP_ANALYSIS.md row covers this work, none changed)
- src/components/food/SavedMealsList.tsx: no hardcoded display text left.
- src/lib/i18n/locales/en.json: savedMeals gained emptyTitle, emptyMessage, itemCount_one, itemCount_other, logNow.
- es.json: those five keys; goals gained setByLume, tapToEdit, savedAsYouType.
- fr.json: those five keys; new goals group; new gymLog group.

Last checks, after all edits: tsc exit 0; all three locales parse; 65 suites, 824 tests, 4 snapshots passing.

IN PROGRESS: nothing mid-edit. Recommended next: add the es.json gymLog group.

DECISIONS
- Each new group sits at its en.json position. fr.json gymLog is followed by plan because dashboard and nutrition are missing.
- es savedMeals.emptyMessage was rewritten to match the English meaning, on instruction.
- es goals.setByLume "Definida" and fr "Définie" are feminine, agreeing with the calorie label at src/app/profile/goals.tsx:125.
- fr gymLog uses U+2019 and U+00A0 as instructed. I also applied U+00A0 before "?" in title, beyond the brief's colons. U+00A0 and U+2019 in fr savedMeals are accepted.
- fr goals uses straight apostrophes, following older strings, so French is mixed.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en', so es and fr never show on screen.
- No test covers locale files or SavedMealsList. A passing suite says nothing about them.
- The Edit tool can write a plain space for U+00A0. Patch with node using escapes and check code points.
- Briefs often ban writing to /tmp and output redirection.
- Shell is zsh: quote paths with parentheses; globs that match nothing error. Grep with LC_ALL=C /usr/bin/grep.
- Verification rounds keep following rounds that skip Jest, so the automatic flag may refire.

NOT FIXED
- fr.json lacks dashboard, nutrition, settings.scanAccuracy. es.json lacks gymLog.
- fr gymLog.celebration.streak gives "1 jours d’affilée": CelebrationCard.tsx:72 puts the number before a fixed label. A fix needs a count-based key and a log-session.tsx change, affecting all locales.
- Hardcoded "Why this plan" at src/app/dashboard/plan.tsx:120.
- entry.title stays English in plan.addTitle ("Añadir a Breakfast"); needed for the slot param at plan.tsx:101.
- lastLoggedDaysAgo_one is unreachable.
- SLOT_KEYS duplicated in add.tsx and food.tsx.

WAITING ON ISA
- Device runs: saved meal cards (labels, toasts, counts, Log now, empty state); plan title, empty state, Suggested line; VoiceOver Add label.
- Native review of all new Spanish and French strings, including French "enregistrer" meaning both save and log, and "ajout" for logging.
- Whether French standardises on U+00A0 and U+2019.