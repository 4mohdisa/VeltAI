Handover — Phase 2, loop/phase2 branch

Rows closed this session: 69/70/71/72 (folded/no gap), 22 baseline re-run, 27–36 (sheets/calendar/scroll/tab bar/Liquid Glass/Reduce Transparency/VoiceOver/delete flow/streak/history — all BUILT, mostly no-gap token audits plus two real token swaps), 38–49 (sources/large text/gutter&labels/Macros spacing&grow-in/bar corners&width/column gap 3/axis labels/over-130% bars/pill label — all BUILT, no simulator). Baseline holds: tsc 0 errors; Jest 83 suites/874 tests/4 snapshots green throughout.

In progress: none mid-task. Next recommended: row 50 in PHASE2_ROWS.md (first unstarted DIFFERENT row; rows 51+ unexamined this session).

Real code fixes made this session (all literal→identical-token swaps, no restyling):
- `src/components/navigation/GlassButtons.tsx` — borderWidth literal → `layout.borderWidth`.
- `src/app/gym/history.tsx`, `src/app/food/history.tsx` — divider `borderTopWidth: 1` → `layout.hairline`.
- `src/components/navigation/Screen.tsx` — footer `borderTopWidth: 1` → `layout.hairline`.
- `src/components/domain/EnergyBalanceCard.tsx` — `DOT`→`space.sm`, `KEY_INDENT`→`space.lg`, dot `borderRadius: DOT/2`→`radius.full`.
- `src/components/display/SettingsList.tsx` — `CHIP=28`→`space['2xl']`.
- `src/components/display/ProgressBar.tsx` — default `height=8`→`space.sm`.
- `src/components/domain/MacroBars.tsx` — `MACRO_BAR_H=12`→`space.md`.
- `src/components/gym/MuscleChart.tsx` — `BAR_HEIGHT=8`→`space.sm`.
New tests added: `GlassButtons.reduceTransparency.render.test.tsx`, `LumeTabBar.a11y.render.test.tsx`.

Decisions/why: a literal is swapped for a token only when the value is identical AND the semantic category matches (e.g. a border-width literal → `layout.hairline`/`layout.borderWidth`, a small fixed dimension like a dot/chip/bar-height → a `space.*` token that happens to equal it — this exact pattern recurred across EnergyBalanceCard, SettingsList, ProgressBar, MacroBars, MuscleChart). Numeric coincidence across the wrong category (e.g. `RING_STROKE=10` vs `radius.sm=10`, or a flex `gap` vs `layout.hairline`) is explicitly NOT swapped. "Row names no file" rows were resolved by finding the single file whose own header comment or usage matches the row title literally (e.g. Badge.tsx's comment: "a small monochrome pill").

Gotchas spotted, not fixed (recurring across many rows, worth one consolidated pass with Isa): no icon-size, stroke-weight, or letter-spacing token category exists anywhere in tokens.ts — hit on rows 29, 31, 34, 36, 38–40, 42, 44–45, 49. Still open and unchecked: `dashboard/nutrition.tsx`'s `MACRO_BAR_W=30`, `MACRO_BAR_RADIUS_TOP=5`, `MACRO_BAR_RADIUS_BOTTOM=2`, and `dashboard/week.tsx`'s `NET_BAR_W` (flagged since row 45). Also unresolved: es/fr translation-length overflow risk on `gym.title`/`common.save`/`common.reset` labels with no truncation safeguard (row 41); `SwipeableRow.tsx`'s delete-action pane has no border radius while its wrapped row does, possible square-corner clipping on swipe (row 34) — needs a design decision, not a token guess.