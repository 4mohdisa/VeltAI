# Accent Report — Apple Health functional colour

**Scope:** functional `accent.*` colour applied to charts, AI moments, category
icons, and the streak flame ONLY. **Cards/tiles, buttons, nav/tab bar/glass, body
text, headings, labels, and borders all stay monochrome.** No features built; logic
and data intact. The last prompt of the design-system series.

## Single source of truth

Added `categoryAccent` to `tokens.ts` so every functional surface pulls the same
colour (no ad-hoc hexes):

| Concept | Token | Hex |
|---|---|---|
| Protein | `categoryAccent.protein` (accent.red) | `#EB4B62` |
| Carbs | `categoryAccent.carbs` (accent.yellow) | `#F1A33B` |
| Fat | `categoryAccent.fat` (accent.blue) | `#3A82F7` |
| Fibre | `categoryAccent.fibre` (accent.turquoise) | `#81CFFA` |
| Calories / energy / streak | `categoryAccent.calories`/`.streak` (accent.orange) | `#EC6330` |
| AI | `categoryAccent.ai` (accent.purple) | `#B25FEA` |
| Positive data series | `categoryAccent.positive` (accent.green) | `#67CE67` |

The `iconAccents` reference map (Icon.tsx) was aligned to these.

## What got colour (and only the icon / bar / arc / line — never the surface)

| Surface | Colour | Where |
|---|---|---|
| **Macro icons + progress bars** | protein red · carbs yellow · fat blue · fibre turquoise | `MacroBars` (Dashboard B1, Nutrition detail B4). Tile fill, label, and value number stay monochrome. |
| **Calorie ring arc** | orange on a `light2` track | `DailyMacroRing` (Dashboard, Nutrition). Centre number stays black. |
| **Streak flame** | orange | `StreakFlame` default (Dashboard hero, Gym hero, milestone). Streak number stays black; calendar dots stay monochrome. |
| **AI sparkles** | purple | Dashboard "AI" badge icon (via new `Badge.iconColor`), Today's-plan reason icon, AI nudge banner icon. Badge surface stays grey. |
| **Weight projection chart** | green line + endpoints | A15 wow moment. Baseline gridline + axis labels stay grey. (Replaces the earlier monochrome-line note.) |

### Colour choices made
- **Carbs → yellow (`#F1A33B`)** rather than orange, to keep orange exclusively for
  the energy/calorie/streak family (ring + flame). Yellow reads fine on white at
  the small icon/bar scale.
- **AI → purple (`#B25FEA`)** (not blue) so it never collides with the **fat → blue**
  macro colour.
- **Carbs icon = `leaf.fill`, fat = `drop.fill`, protein = `circle.fill`** per the
  UI doc category icon map.

## Discipline audit (Task 6) — clean, no drift

Verified by grep across `src`:
- Every `categoryAccent`/`accent.*` usage is on an **icon, progress bar, ring arc,
  or chart line** — i.e. it encodes a category / AI moment / energy / data series.
- **Zero** `backgroundColor: accent…` — no coloured surfaces/cards/tiles.
- `Button.tsx` has **no** accent — the primary button stays solid black; the
  one-black-button rule is intact.
- One colour per concept, consistent everywhere (driven by `categoryAccent`).
- No gradients; no Liquid Glass on content.

## Verification

- `npx tsc --noEmit` — clean before every commit.
- `npx expo export --platform ios` — succeeds.
- App confirmed running on the simulator this session (the custom-food sheet
  rendered correctly on the live bundle).

### `[?]` — live screenshot of the dashboard accents not re-captured
`xcrun simctl openurl` to **grouped** routes (`(tabs)`, `(onboarding)`) returned
"Unmatched Route" on a cold/just-installed app this session, so I couldn't grab a
fresh dashboard/gym/wow screenshot to show the colour. Root-stack routes (e.g. the
custom-food sheet) matched and rendered fine, confirming the app + live bundle work.
The accent changes are isolated colour swaps validated by tsc, export, and the grep
audit; they appear when the app is run normally (tap through onboarding → dashboard).
Not a code blocker.

## Git log

```
accent: discipline audit (+ ACCENT-REPORT.md)
accent: charts and data viz
accent: AI moments
accent: streak flame orange
accent: calorie ring + energy
accent: macro category colours
```

## Confirmation

Chrome, cards, tiles, buttons, tab bar, nav/glass, body text and headings all
stayed monochrome. Colour appears only where it encodes meaning. The
workout-schedule and gym-selfie features were **not** built — the design-system
series is now complete (monochrome base + Apple Health functional colour + Liquid
Glass nav + native sheets + SF Pro Display/Rounded).
