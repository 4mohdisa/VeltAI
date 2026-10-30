# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- design/Lume App.html is source of truth. Gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted).
- Isa r39: celebration card approved; row 18 edit cycle dropped; already-logged routes to /gym/session; Summary card never calls logGymSession() with no args; food detail search shows macros.
- Isa r55: compare code with design/ before each row; fix only real differences.
- Gym duration: derived value logged when above 0, else undefined; keep ?? for template estimate.
- Card variant='elevated' is the repo mapping for the design's white card. Session mode state is derived, not set in effects.
- R57: Search foods tile routing to food tab is a real difference; dedicated search sheet parked.
- R58: SegmentedField inset not changed globally; compact prop is opt-in.
- R63: celebration calories show a dash (no body weight; no fabricated data).
- R64: Quick add detent is fitToContents (src/app/_layout.tsx:160). R72: pill height by padding, no Button edit.
- R78: recent macros scaled per 100 g from stored totals (items hold totals, FoodResult holds per-100 values).
- Flagged reports are cleared by verification-only runs (tsc, eslint, related tests, no edits).
- Prompts: one task, one editable source file; doc-only rounds run no tests; every prompt names the design/ file, gap row, branch, and says no git.

## Built (not verified)
- NumberEntryBar (shared) in food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card.
- Gym 'How did it go?' chooser; modes adjust, ticklist, picker. Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() in log-session.tsx. Step 3 (device run) open.
- Gym duration honesty; food macros carried through pick, search and detail.
- Quick add: toast, MEAL caption, detent, confirm pill 52pt via padding.
- SegmentedField compact prop, applied to quick-add Meal control (row 87 still DIFFERENT: 8pt chip horizontal padding, no selection background transition).
- Recents macros in hooks.ts useFoodSearch (scaled per 100 g).
- new-recipe.tsx ingredientFrom: protein, carbs, fat scaled by grams; edit path works back to per-100 g. Flagged for verification (tsc passed, no tests cover it); verification round queued.

## Open differences
- Add sheet: title not meal-named; tile gap ~14pt not 12pt; SF Symbols not design SVGs.
- Quick add: no blinking caret; confirm 17/24 vs 17/22 (Blocked); own flex:1 KeyboardAvoidingView at quick-add.tsx:114; offline toast names no meal; hardcoded English copy.
- Row 17: footnote 'Push logged - streak extended' missing; Time dash on empty plan; card can show '0 min'; possible stat overflow.
- ingredientFrom: fibre still saved as 0 (FoodResult carries fibre per 100 g; recents do not yet). Literal \n in comment at new-recipe.tsx:49. Calories rounded before edit-path reverse; recents round kcalPer100 (small drift).
- Macros as 0 still in quickAdd and food/detail.tsx.
- Estimate of exactly 0 hides planMinutes (keep ?? per r49).
- Stale: detailSubject.ts:25-27 comment; gap detail sections near 978, 1048, 1419; gymDurationHonesty.test.ts 'Not set' title; DESIGN_GAP_ANALYSIS.md:86-87 says FoodNumberEntryBar (real: NumberEntryBar); food Search section lacks recents macros note and ingredientFrom note.
- Slot label: design uses 'Snacks' in chips and SLOTS; time-of-day default says 'Snack' (design inconsistency, decoded line 756).
- i18n: hardcoded toast copy in index.tsx, log-session.tsx, quick-add.tsx.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.

## Blocked on Isa
- Row 23 one-tap log: A = route onLog to log-session; B = accepted deviation. Asked r43, unanswered.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Quick add confirm 17/22: Button lacks label or size prop. Choose: add prop, change bodyBold for all callers, or accept 17/24.
- Owner device checks (ask once): Quick add sheet fit, MEAL caption, toast, compact chips, NumberEntryBar above keyboard; celebration flow; recipe macros (add recent and searched food, check totals, change grams, save).

## Next
1. Verification-only run for new-recipe.tsx ingredientFrom (tsc, eslint, related tests). Clears the flag.
2. ingredientFrom: scale fibre by grams; carry fibre in useFoodSearch recents. Fix literal \n at new-recipe.tsx:49.
3. quickAdd and food/detail.tsx: stop logging missing macros as 0.
4. Add sheet title 'Add to {meal}' when opened from a meal.
5. Doc-only: stale comments, row 87 wording, NOTES and gap-analysis stale lines.
6. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove; cardio ParameterForm; template editor; kg/lb; volume kg only; estimated duration logged; adjust and ticklist arrive checked, so 'Save progress?' fires on untouched back-out.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset restyle (11 caller files). Dedicated food search sheet (R57).
- mixHex in GymCalendar.tsx to shared helper; goals.tsx hardcoded copy; es/fr locales lack new keys; CONFLICT_KEYWORDS not type-linked; unused addMenu keys; router.setParams rewrites history; dev catalog has calories only.
- Blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx; labels in add.tsx and log-session.tsx; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx; source-text tests do not run behaviour.

## Loop notes (condensed)
- R1-39: early rejections. R43 asked row 23, unanswered. R50, R60, R75 checkpoints green.
- R76-78: compact and recents built. R79: verification cleared flag.
- R80: new-recipe ingredientFrom macros built; flagged for no test run. Verification round queued.

## Gotchas
- Design text in __bundler payload (gzip+base64). Food 71f71ac4, gym 7dc211f6. Decoded copies in /tmp/lume-design may vanish.
- Source-reading tests pin source text and are invisible to --findRelatedTests; grep src/__tests__.
- Shared Button in src/components/forms affects all callers; override locally first.
- Pill 52pt: 24 line + 12 + 12 padding, minHeight 52.
- zsh does not word-split unquoted variables. Expo rules in AGENTS.md.