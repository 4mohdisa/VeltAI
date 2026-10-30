HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified; Isa verifies. Expo docs requirement is in AGENTS.md. Source of truth: design/Lume App.html.

BUILT THIS SESSION (all BUILT, not verified; no DESIGN_GAP_ANALYSIS.md row covers this work, none changed)
- src/lib/i18n/locales/en.json, es.json, fr.json: savedMeals now has logged, logFailed, lastLoggedToday, lastLoggedYesterday, lastLoggedDaysAgo_one, lastLoggedDaysAgo_other, neverLogged. plan now has suggested, addTitle, title, emptyTitle, emptyMessage.
- src/components/food/SavedMealsList.tsx: lastLoggedLabel takes t and uses savedMeals keys.
- src/app/dashboard/plan.tsx: title and empty state use plan keys.

Last full suite, before the plan.tsx title edits: 65 suites, 824 tests, 4 snapshots, passing. Last tsc, after them: exit 0.

IN PROGRESS: nothing mid-edit. Recommended next: move the remaining hardcoded SavedMealsList.tsx strings to savedMeals keys: empty state (lines 85-86), item/items count (line 102), "Log now" (line 109).

DECISIONS
- lastLoggedLabel takes t as a parameter because it sits outside the component, matching confirmDeleteMeal in src/app/(tabs)/food.tsx.
- Plurals use _one and _other with count, matching deleteMealMessage and planSummary.
- plan group sits last in all three locales; savedMeals directly follows foodLog.
- plan.title English keeps the straight apostrophe, copied exactly.
- fr plan.suggested uses U+00A0 before the colon; aujourd’hui uses U+2019. Older French strings use plain spaces, an open question for Isa.

GOTCHAS
- src/lib/i18n/index.ts:41 fixes lng to 'en', so es and fr never show on screen.
- No test covers locale files, SavedMealsList or plan.tsx. A passing suite says nothing about them.
- The Edit tool can write a plain space for U+00A0. Patch with node using escapes and check code points.
- Grep of the design file found no plan empty-state wording.
- Briefs often ban writing to /tmp. Use plain commands without redirecting output.
- Shell is zsh: quote paths with parentheses; globs that match nothing error. Grep with LC_ALL=C /usr/bin/grep.
- Verification rounds keep being requested after rounds that skip Jest, so the automatic flag may refire.

NOT FIXED
- entry.title is English inside plan.addTitle, giving "Añadir a Breakfast" and "Ajouter à Breakfast". It must stay English for the slot route param at plan.tsx:101.
- lastLoggedDaysAgo_one is unreachable: days === 1 returns the yesterday string.
- fr.json lacks goals, gymLog, dashboard, nutrition, settings.scanAccuracy. es.json lacks gymLog.
- SLOT_KEYS duplicated in add.tsx and food.tsx.

WAITING ON ISA
- Device runs: saved meal card label states and toasts, plan title, empty state and Suggested line, VoiceOver Add label.
- Native review: all new Spanish and French strings, including French "ajout" versus "Enregistré" and Spanish masculine "Registrado".