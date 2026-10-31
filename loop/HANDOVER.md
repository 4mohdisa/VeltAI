HANDOVER: LumeAI (remote 4mohdisa/VeltAI), branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html.

BUILT THIS SESSION (not verified; es and fr are unreviewed drafts)
- src/app/food/detail.tsx: macro labels (both layouts), tile, serving and calories VoiceOver labels, Serving size caption, Edit values manually, meal chips and caption, "for {n} g", Edit item and Rename food titles, Save name and Save changes (line 301).
- src/app/food/quick-add.tsx: all screen copy, including seven strings the brief missed.
- src/lib/i18n/locales/{en,es,fr}.json: matching food.* keys.
- src/__tests__/foodDetail.test.ts: one assertion now looks for food.editValuesManually.

GAP ROWS (DESIGN_GAP_ANALYSIS.md)
No status or header count changed. BUILT sentences added: food detail items 3, 7, 11, 14, 17; quick add row (line 87). Those rows stay open because layout or mode differences remain.

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0. foodDetail.test.ts: 31 passed, after the final edit. foodDetailLogged.render (35 with foodDetail) last ran before the sub-label re-check. Full suite not run this session. Tests run in English, so es and fr are not exercised.

DECISIONS
- Calories label uses gymLog.celebration.calories; nutrition.calories does not exist and the brief barred new keys.
- grams: num(grams), not raw grams, keeps the displayed number unchanged.
- Meal chip fallback foodLog.addMeal was requested but cannot currently trigger.
- quick-add.tsx:73 name 'Quick add' stays English: it is saved data.
- Design lacks Edit values manually, for {n} g, Edit item, Rename food and Save name, so app English stays.
- quick-add reuses dashboard.kcal and foodLog.addedToMeal (masculine in es and fr; offline toast is feminine).

WAITING ON ISA
Device and VoiceOver checks; long labels (Petit-déjeuner, Carbohidratos, Tamaño de la porción, Enregistrer les modifications); es and fr wording; "Snacks" untranslated; keep or drop for {n} g; title as mode vs food name; gymLog calories key.

NOT FIXED (recommended next: first item)
- detail.tsx:259-260: Edit food title and Save changes; reuse food.saveChanges.
- detail.tsx:168, 225: Add to {slot} labels.
- detail.tsx: Food, Nothing to show, Looking up product, No longer in your log, Product not found, Scan again, Confirm product, g unit, Name field.
- SLOT_KEYS in four files: food.tsx, add.tsx, quick-add.tsx, detail.tsx.
- Gap doc: line 87 still says copy hardcoded and cites quick-add.tsx:116 (now about 125); other quick-add references about 11 lines out; detail.tsx references at least 7 out; stale line 957 and item 18.
- scan.ts:305 Scan failed; new-template.tsx, new-recipe.tsx strings; formatting.ts kcal and g.

GOTCHAS
- Briefs repeat finished work and stale paths; check first. Tests are in src/__tests__.
- zsh breaks echo === and unquoted (tabs) paths. Use LC_ALL=C /usr/bin/grep.
- Decode from __bundler/manifest with node; screen 71f71ac4. /tmp/lume-decode may be gone.