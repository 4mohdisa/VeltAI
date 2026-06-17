# iOS HIG Series · Prompt 5/6 — Colour Discipline + Liquid Glass Audit

A light verification-and-cleanup pass: finish the semantic-token migration, confirm
one-accent discipline, and audit Liquid Glass usage per HIG §3 + §11. Frontend-only,
mock data, tsc green before every commit.

**Standing constraints upheld:** (1) **Monochrome** — black is the one action
colour, `accent.*` functional-only, no system colours as tint. (2) **Light theme
only** — no Dark Mode (which is why this pass is short). (3) **Custom Liquid-Glass
nav chrome kept**, honoring HIG mechanics within it.

---

## Task 1 — Raw-hex / raw-colour sweep
Swept `src/` for raw colour literals in components. **One** existed: the barcode
not-found scrim `rgba(0,0,0,0.82)` → routed to `color.overlayStrong`. No raw hex
and no named-colour strings remain in components; `'transparent'` (a no-fill
keyword, not a colour value) is the only literal and is allowed. **Raw hex now
lives only in `tokens.ts`.**

Commit `8bfaa71`. _Exceptions: none._

## Task 2 — One-accent discipline + functional-colour audit (§3.1/§3.2)
- **Black is now the ONLY filled-action colour.** The single accent-as-fill was the
  swipe-to-delete panel (`accent.red`) → converted to monochrome (`color.primary`),
  matching the app's destructive `Button` (which is already grey-outline, "intent
  via copy + confirmation, not red"). Destructive meaning is carried by the trash
  glyph + label + the confirm dialog.
- **Accents are functional-only**, no decorative use. Verified accent→concept
  mapping is consistent:

  | Concept | Accent | Where |
  |---|---|---|
  | AI moments | purple (`categoryAccent.ai`) | sparkles (dashboard, plan, nudge) |
  | Calories / energy | orange (`calories`/`streak`) | calorie ring, active-burn, streak flame |
  | Protein / Carbs / Fat / Fibre | red / yellow / blue / turquoise | MacroBars, iconAccents |
  | Positive data series | green (`positive`) | onboarding projection chart |

- Palette stays the **closed token set** — the raw-hex grep is zero, so no stray
  one-off hues were introduced across the recent passes.

Commit `3fc2792`.

## Task 3 — Liquid Glass usage audit (§11)
Audited every glass surface. **Liquid Glass is navigation-layer-only:**

| Glass surface | Where | Verdict |
|---|---|---|
| GlassBackButton | NavBar | ✅ nav |
| GlassCloseButton / GlassSaveButton | SheetContent, FoodItemEditSheet headers | ✅ nav (sheet header) |
| Tab bar | NativeTabs (system glass, iOS 26) | ✅ nav |
| Food + FAB | **solid** variant (black) — not glass | ✅ |

**No glass on content:** `Card` = solid `surface.card`; sheet content area = solid
white; **no `GlassView`/`BlurView` in any display/domain component** (grep
confirmed). No glass-on-glass, none on chips/badges. Nothing needed moving — a
clean verification.

Commit `9647dfa`.

## Task 4 — Glass legibility + Reduce Transparency (§11)
- **Reduce Transparency:** new `useReduceTransparency` hook
  (`AccessibilityInfo.isReduceTransparencyEnabled` + live subscription), centralised
  in the Glass components. When on, `GlassCircle` (back/close/save) and the glass
  FAB render a **solid opaque monochrome surface** (`surface.card` + hairline) — no
  blur.
- **Reduce Motion:** the `GlassView` drops `isInteractive` under Reduce Motion, so
  there's no specular/motion response.
- **Legibility:** glyphs are black-on-light on glass and on the solid fallback (high
  contrast); nav title / back label / Done use `color.black` over glass regardless
  of backdrop. This aligns with the A11y contrast pass.

Commit `cab0742`.

## Audit & verify
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Greps:** raw hex / `rgba(` in components → **ZERO** (only `tokens.ts`); accent
  used as `backgroundColor` fill → **ZERO**.
- **Simulator (iPhone 17 Pro):** glass appears only on the nav back pill —
  Preferences content is all solid monochrome, selected segments are **black** (no
  accent as action), darker secondary greys legible (A11y contrast holds), still
  monochrome + light; nothing regressed.
- Contrast from the A11y pass holds (no regressions from the token edits).

Commit `hig-color-glass: audit clean`.

## Git log
```
cab0742 hig-glass: legibility + reduce-transparency fallback
9647dfa hig-glass: glass on navigation layer only, off all content
3fc2792 hig-color: one-accent discipline + functional-only audit
8bfaa71 hig-color: finish semantic-token migration, no raw hex in components
```
(+ `hig-color-glass: audit clean`.)

## Deferred `[?]`
- **Reduce Transparency** can't be toggled via `simctl` (it exposes
  `increase_contrast` + `content_size`, not reduce-transparency) — the solid
  fallback is wired and tsc-verified; confirm by hand in Settings → Accessibility →
  Reduce Transparency.
- The `GlassFab` `glass` variant now has the fallback, though the app only uses the
  `solid` variant today.

---

**This is Prompt 5 of 6.** The final prompt is **Charts**.
