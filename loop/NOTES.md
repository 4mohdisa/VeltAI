# Lume Loop Notes

## Goal
Match design/Lume App.html across the 41 rows of DESIGN_GAP_ANALYSIS.md. Branch loop/design-match only. Say BUILT, never verified. Stop when all rows are BUILT or only owner items remain.

## Decisions (never delete)
- RevenueCat over Stripe. Onboarding stabilised. v1 scope locked; extras go to Parked.
- design/Lume App.html is source of truth. Gap analysis is authoritative.
- 7-day trial, $49.99/yr, $8.99/mo, no card up front.
- Isa r24: cardio stays Distance km; no food search chips; Goals as built (rows 76, 78, 97 accepted).
- Isa r39: celebration card approved; row 18 edit cycle dropped; already-logged routes to the day; Summary card never calls logGymSession() with no args; food detail search shows macros.
- Gym duration: derived value logged when above 0, else undefined; keep ?? for template estimate (r48-49).
- Card variant='elevated' is the repo mapping for the design's white card.
- Session mode state is derived, not set in effects.
- Isa r55: compare code with design/ before each row; fix only real differences.
- R57: Search foods tile routing to food tab is a real difference; dedicated search sheet parked.
- R58: SegmentedField inset not changed globally (11 callers). Quick add gets a compact option via a prop, added in one round and applied in the next.
- R59, R70: prompts name the design file and the gap-analysis section they clear.
- R63: celebration calories show a dash (no body weight; no fabricated data).
- R64: Quick add detent is fitToContents at src/app/_layout.tsx:160.
- R71: a blocked read gets one re-run with the file allowed; no edits to shared components unless the row needs it.
- R72: Quick add pill height by padding, no Button edit.
- Flagged reports are cleared by verification-only runs (tsc, eslint, related tests, no edits).
- Prompts: one task, one editable source file; one-line status edits to DESIGN_GAP_ANALYSIS.md allowed; doc-only rounds run no tests; every prompt names the design/ file, the gap row and the branch, and says no git.

## Built (not verified)
- NumberEntryBar (shared): food quick-add, food detail, gym session, PlannedValuesForm.
- Food Add sheet chooser; Search routes to food tab; + disc logs 100 g with toast.
- Goals: borderless input, hints, elevated card.
- Gym 'How did it go?' chooser; modes adjust, ticklist, picker.
- Row 19: already-logged routes to /gym/session.
- Row 17 steps 1-2: CelebrationCard.tsx opens from save() as native Modal. Step 3 (device run) open.
- Gym duration honesty; food macros carried through pick, search and detail.
- Quick add: toast '{kcal} added to {meal}'; MEAL caption; detent fitToContents; confirm pill 52pt via padding.

## Open differences
- Add sheet: title not meal-named ('Add meal' from global +); tile gap ~14pt not 12pt; SF Symbols not design SVGs.
- Quick add: Meal control 13/17 semibold, 3pt padding (in progress: compact option, then caller); no blinking caret; confirm label 17/24 vs 17/22 (Blocked); own flex:1 KeyboardAvoidingView at quick-add.tsx:114; 56 vs 52pt pill to recheck.
- Row 17: footnote 'Push logged - streak extended' missing; Time dash on empty plan; card can show '0 min'; possible stat overflow.
- Recents in hooks.ts useFoodSearch drop macros; re-pick logs zeros. quickAdd and detail.tsx log missing macros as 0.
- Estimate of exactly 0 hides planMinutes (keep ?? per r49).
- Stale: detailSubject.ts:25-27 comment; _layout.tsx sheet comments; gap detail sections near 978, 1048, 1419; gymDurationHonesty.test.ts 'Not set' title; DESIGN_GAP_ANALYSIS.md:86-87 names FoodNumberEntryBar (real name NumberEntryBar).
- i18n: hardcoded toast copy in index.tsx, log-session.tsx, quick-add.tsx.
- Food Search sheet (pill input, thumbnails, row metrics): plan first.
- Remaining gym rows: Isa approval per item.

## Blocked on Isa
- Row 23 one-tap log: A = route onLog to log-session; B = accepted deviation. Asked r43, unanswered.
- Row 17 Calories: formula or accepted deviation (needs profile weight). Dash for now.
- Search foods tile routing: accepted or not.
- Inset callers: variant change or compact option (compact option in progress for Quick add).
- Quick add confirm label 17/22: Button has no label or size prop. Choose: add a label prop, change bodyBold for all callers, or accept 17/24.
- Owner device checks (ask once, when no other owner item is pending): Quick add sheet fit, MEAL caption, toast, NumberEntryBar above keyboard; celebration modal flow.

## Next
1. SegmentedField compact prop (in src/components/forms/SegmentedField.tsx) per current prompt.
2. Quick add applies compact to the Meal control in src/app/food/quick-add.tsx; check the 3pt padding and 13/17 semibold against design/Lume App.html entry 71f71ac4.
3. hooks.ts useFoodSearch recents keep protein, carbs, fat.
4. Add sheet title 'Add to {meal}' when opened from a meal.
5. Stale comments, stale test title, gap detail sections. Doc-only.
6. If no non-gym one-file task remains: stop with 'only owner decisions remain'.

## Parked (not v1)
- Gym: row order, per-set remove; cardio ParameterForm; template editor; kg/lb; volume kg only; estimated duration logged (revisit if only measured counts); adjust and ticklist arrive checked, so 'Save progress?' fires on untouched back-out.
- Row 17: rest-day and /gym/session exits show no card; pop-in; ring vs flame.
- Global SegmentedField inset restyle (11 callers).
- Food search: dedicated search sheet (R57).
- mixHex in GymCalendar.tsx to shared helper.
- goals.tsx hardcoded copy 'Between 1,200 and 10,000 kcal.' and 'Daily targets'.
- es/fr locales lack new keys. CONFLICT_KEYWORDS not type-linked. Unused addMenu keys.
- router.setParams rewrites history. Dev catalog has calories only.
- Blinking caret; Math.round in draft(); Goals accessibilityState; English hints in food.tsx; labels in add.tsx and log-session.tsx; /gym/session shows planned not logged rows.
- No render tests on food.tsx, detail.tsx, quick-add.tsx, log-session.tsx.
- Source-text tests (gymDurationHonesty, foodDetail) do not run behaviour.

## Loop notes (condensed)
- R1-39: early rejections; data path and i18n handled. R43 asked row 23, unanswered. R45 rejected for branch rule.
- R50 gate green. R55-56 Add sheet and Quick add re-checked DIFFERENT. R60 checkpoint green at 824 (extra test unexplained).
- R62-74: flagged reports cleared by verification-only runs. R70-72: pill built by padding.
- R73: handover; notes rewritten. R75 checkpoint green per Jev and loop note.
- R76: Quick add Meal control prompt rejected for not naming the design/ file. Rewritten with design/Lume App.html entry 71f71ac4 and row 87.

## Gotchas
- Design text is in the __bundler payload. Decode manifest (gzip+base64). Food 71f71ac4, gym 7dc211f6.
- Source-reading tests pin exact source text and are invisible to --findRelatedTests; grep src/__tests__.
- Shared Button in src/components/forms: changing it affects all callers, so override locally first.
- Pill 52pt: 24 line + 12 + 12 padding, minHeight 52.
- zsh does not word-split unquoted variables. Expo docs rule is in AGENTS.md.
- Row numbers mean numbered differences, not table rows.