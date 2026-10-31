HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Do not open loop/NOTES.md or loop/DECISIONS_LOG.md. Say BUILT, never verified; Isa verifies. Source of truth: design/Lume App.html. Bundle id fit.lume.app.

BUILT THIS SESSION (not verified; es and fr are unreviewed drafts)
- src/components/display/SwipeableRow.tsx: Cancel, Delete and action label translated.
- src/app/food/saved.tsx: all own strings.
- src/app/food/new-recipe.tsx: swipe title only.
- src/app/gym/new-template.tsx: swipe title and trash dialog.
- src/app/(tabs)/food.tsx: visible pending label, using food.rowAnalysing.
- src/app/food/detail.tsx: Delete item, delete dialog and toast, saved-mode removal, save-to-dishes button and toast, PADS captions.
- src/lib/i18n/locales/{en,es,fr}.json: matching keys.

GAP ROWS
No status or header count changed. Row 86 was already BUILT (not verified); reason text added. Notes added: item 28 continuation (line 957), new-template description (about line 780).

IN PROGRESS: nothing.

LAST CHECKS
tsc exit 0. foodDetail, foodDetailLogged.render and sheetVariant: 44 passed, after the final edit. Last full suite: 824 passed, at the mid-session checkpoint, before the detail.tsx and Analysing rounds.

DECISIONS
- Toast "Removed {{name}}" and "dishes" wording follow the design.
- Delete dialog kept; design has none. App rule confirms destructive actions.
- "Delete item" kept per brief; design says "Remove from log".
- food.rowAnalysing is en "Analysing", also used by VoiceOver; es and fr carry a brief-specified ellipsis.
- PADS holds labelKey because it is module scope.

WAITING ON ISA
Native review; device and VoiceOver checks; long fr and es labels; rowAnalysing wording and ellipsis; "Delete item" vs "Remove from log"; extra es keys addMenu.voice and describeOutLoud; row 86 BUILT vs section verdict DIFFERENT (about line 964).

NOT FIXED (recommended next: first item)
- detail.tsx macro labels (about 567-610): reuse nutrition.protein, carbs, fat, fibre.
- detail.tsx: Edit item, Rename food, other titles, Serving size caption and VoiceOver.
- quick-add.tsx:191 hardcoded Calories · kcal.
- scan.ts:305 "Scan failed" visible at food.tsx:887 and in VoiceOver; scanSeam.test.ts asserts it, so translate at display. scan.ts:118 placeholder does not reach failed rows.
- new-template.tsx: Remove ${name}, Remove exercise action label, others. new-recipe.tsx: most strings.
- Gap doc stale: line 957 (new-template swipe title), item 18 line 1020.
- SwipeableRow.tsx:2 says red; code uses color.primary.
- formatting.ts kcal and g; P letter; RecipesList.tsx and detailSubject.ts "my foods"; handover earlier list: P, C, F letters, date formatters, plurals.

GOTCHAS
- Briefs quote stale paths and finished work; check first. SwipeableRow is under components/display.
- zsh breaks unquoted globs and (tabs) paths; quote --include. Use LC_ALL=C /usr/bin/grep.
- Decode design from __bundler/manifest with node; screens 71f71ac4, 185bb533, 7dc211f6. Scripts in /tmp/lume-decode may be gone.
- Test i18n is English. foodDetail.test.ts searches source text, so literals moved to keys can break it.