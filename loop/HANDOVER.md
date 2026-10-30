HANDOVER: LumeAI, branch loop/design-match. No git commands, pushes, merges or branch switches; the loop script commits. Say BUILT, never verified.

BUILT THIS SESSION
- Row 17 (difference 17, celebration card): src/components/gym/CelebrationCard.tsx, wired into save() in src/app/gym/log-session.tsx as a native Modal replacing the toast. Status records steps 1 and 2. Step 3, the device run, is not done.
- save() sends durationMin as undefined when the derived value is 0 or less.
- Quick add (src/app/food/quick-add.tsx): toast now "250 kcal added to lunch"; MEAL caption built. Row stays "DIFFERENT (MEAL caption built)".
- Test repairs: gymDurationHonesty, sheetVariant, foodDetail.
- Add sheet row set back to DIFFERENT after re-check.
- Already present, no edit needed: search macros in (tabs)/food.tsx pick() and food/detail.tsx.

Last full run: 65 suites, 824 tests passed (baseline said 823; the extra test is unexplained). tsc clean. That run predates the Quick add edits; since then only tsc, eslint and two source-reading test files have been run.

IN PROGRESS: nothing mid-edit.

DECISIONS
- Calories on the card shows "—": no body weight on that screen, and the repo forbids fabricated data.
- Reused Stat and Button over exact design type, so labels are uppercase and pill text is 17/24.
- SegmentedField inset unchanged: 11 other callers would restyle.
- MEAL caption rendered in quick-add.tsx, not through the SegmentedField label.
- Gap rows keep DIFFERENT while any real difference remains.

WAITING ON ISA
- Calories column: formula or accepted deviation.
- Search foods tile going to the food tab: accepted or not.
- How to handle the inset callers: variant change or compact option.

NOT FIXED
- Quick add: Meal control 13/17 semibold and 3pt padding, 0.6 detent, no blinking caret, 56 vs 52pt pill, hardcoded English copy, offline toast names no meal.
- Add sheet: "Add meal" title from the global +.
- Card can show "0 min"; possible stat row overflow. Footnote missing.
- An estimate of exactly 0 hides planMinutes (notes r49: keep ??).
- src/lib/data/hooks.ts recents drop macros, so re-picking logs zeros.
- Missing macros log as 0 in food/detail.tsx and quickAdd.
- Stale: src/lib/food/detailSubject.ts:25-27 comment, the _layout.tsx sheet comments, gap detail sections (around lines 978, 1048, 1419), the "Not set" test title.

GOTCHAS
- Design text sits in the __bundler payload, so grep misses it. Decode the manifest (gzip+base64); /tmp/lume-design and /tmp/lume_decode.py may be gone. Food screens are entry 71f71ac4, gym is 7dc211f6.
- Source-reading tests are invisible to --findRelatedTests; grep src/__tests__ for the path.
- Those tests pin exact source text, so edits can break them.
- zsh does not word-split unquoted variables.
- The Expo docs requirement is in AGENTS.md.
- Row numbers mean the numbered differences, not table rows.