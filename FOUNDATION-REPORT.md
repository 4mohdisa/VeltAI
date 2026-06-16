# Foundation Report — Apple Health tokens, typography, icon system

**Scope:** foundation/system layer only — `src/lib/design/tokens.ts`, the `Text`/
`AppText` primitive, and the `Icon` primitive. **No screens, layouts, routes,
data, or logic were changed.** No screen was recoloured beyond what naturally
follows from the (subtly different) Apple Health grey values.

**Note on the doc:** `docs/Design/Theme & Design Tokens.md` on disk still reflects
the prior monochrome pass (it was not updated). The authoritative new spec is the
prompt itself, which I followed exactly.

## Task 1 — Colour tokens

- Rewrote `color` to the Apple Health monochrome base: `white`, `light1`
  (#F2F2F7), `light2` (#E5E5EA), `light3` (#D1D1D6), `black`, `gray1` (#1C1C1E),
  `gray2` (#2C2C2E), `gray3` (#3A3A3C), `secondary` (#848484), plus the retained
  `gray800` (#171717), `gray500` (#737373), `gray400` (#A3A3A3), `gray50`
  (#FAFAFA). Kept `overlay`/`overlayStrong` black-alpha scrims.
- Added the **`accent`** palette (orange/blue/turquoise/red/green/yellow/purple/
  ocean) as a separate export, documented **functional-use-only** (charts, AI,
  category/health icons, data viz, small status — never chrome/structure). It is
  **not applied to any screen** in this prompt.
- Remapped **`surface`** to the new greys: card/tile/input → `light1`,
  cardElevated/inputFocused → `white`, tilePressed/divider → `light2`,
  backgroundAlt → `gray50`.

### Grey remapping / back-compat

Components still import the old names (`gray100/150/200/300/600/700/900`). Rather
than mass-migrate screens (out of scope), I kept **back-compat aliases inside the
`color` object** mapping each removed name to its closest Apple Health grey:

| old | → new value | note |
|---|---|---|
| gray100 | #F2F2F7 (light1) | card/tile fill |
| gray150 | #E5E5EA (light2) | pressed |
| gray200 | #E5E5EA (light2) | dividers/tracks |
| gray300 | #D1D1D6 (light3) | outline borders |
| gray600 | #848484 (secondary) | secondary text |
| gray700 | #171717 (gray800) | strong secondary text |
| gray900 | #1C1C1E (gray1) | headings |

`gray800/500/400/50` keep the same names and (near-)same values. Verified: every
`color.grayXXX` reference in the codebase resolves (no broken colour names).
These aliases are slated for removal as components migrate in later prompts.

## Task 2 — Typography (SF Pro Display + Rounded)

- Each `type` token now carries a **`family: 'display' | 'rounded'`** field.
  `statHero/Large/Medium/Small` and `display` = `'rounded'`; everything else =
  `'display'`. Typed via a new `TypeToken` type (`satisfies Record<string,
  TypeToken>`), so it stays type-safe.
- Added a **`textStyle(variant)`** resolver that returns a valid RN `TextStyle`
  (fontSize/fontWeight/lineHeight + `fontFamily` from the family map). Safe to use
  because nothing in the codebase spreads raw type tokens into styles (verified) —
  only the `Text` primitive (now uses the resolver) and `TextField` (reads
  individual fields).
- Updated `src/components/primitives/Text.tsx` to **`AppText`**, exported as both
  `AppText` and `Text` (back-compat) so existing `import { Text }` keeps working.
  Screens were **not** mass-migrated.

### SF Pro Rounded — `[?]` deferred (documented blocker)

`fontFamily.rounded` is currently `undefined` (falls back to San Francisco), so
stat numbers do **not** yet render visibly rounded. **Blocker:** iOS does not
expose the system *rounded* design via a public React Native `fontFamily` name,
and Apple's `SF-Pro-Rounded-*.otf` faces are not present in this repo (and aren't
something I can fetch here). The full plumbing is ready — the `family` field, the
resolver, and the `fontFamily` map are all wired. **To enable rounded later:** add
the SF Pro Rounded `.otf` files to `assets/fonts/`, load them via `expo-font`
(`useFonts`/config plugin), and set `fontFamily.rounded` to the loaded face name.
Nothing else changes. Falling back to system default per the prompt's instruction
("do not break the build chasing it").

## Task 3 — SF Symbol colour convention

- `Icon` already accepts a `color` prop (defaults to `color.black`); it accepts
  any monochrome **or** `accent.*` colour.
- Documented the **convention** in a header comment block: monochrome by default
  (`color.black` active / `color.secondary` inactive) for all chrome/structure;
  `accent.*` only for functional health/category/AI/data icons.
- Added an exported **`iconAccents`** reference map (flame→orange, sparkles→purple,
  protein→blue, carbs→green, fat→yellow, fibre→turquoise, heart→red,
  hydration→ocean, sleep→purple) so a later prompt knows which symbols get which
  colour. **Not applied** to any existing screen icon here. The streak flame note
  (`accent.orange`) is supported by the primitive but applied later.

## Verification

- `npx tsc --noEmit` — clean (all colour/type references resolve).
- `npx expo export --platform ios` — succeeds (4.3 MB bundle).
- App build chain is green; the only visible change on screens is the subtly
  different Apple Health grey values. Stat numbers remain system-weight until the
  rounded font is bundled.

## Deferred `[?]`

- SF Pro Rounded face not bundled → stats fall back to system default (see above).

## Git log

```
foundation: SF Symbol colour convention
foundation: SF Pro Display + Rounded typography + AppText
foundation: Apple Health colour tokens + accent palette
```

## Confirmation

No screens, layouts, routing, data, or logic were changed. Only the
token/typography/icon **system layer** was touched. The workout-schedule, gym
selfie, and Liquid Glass / sheet items were **not** built (later prompts).
