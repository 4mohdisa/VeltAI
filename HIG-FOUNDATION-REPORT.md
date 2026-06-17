# iOS HIG Series · Prompt 1/6 — Foundation Report

The load-bearing mechanics every later prompt sits on: a reconciled token layer,
Dynamic Type, safe areas, the 8pt grid, and 44pt touch targets. Frontend-only,
mock data, `npx tsc --noEmit` green before every commit.

**Standing constraints upheld:** (1) **Monochrome identity intact** — mechanics
only; no `systemBlue`/`systemGreen` etc. as UI tint, black stays the primary
action colour, `accent.*` unchanged/closed/functional. (2) **Light theme only** —
no Dark Mode, no `useColorScheme`, no dark variants; all tokens are fixed light
values.

`docs/App Screens.md` / the Notion HIG page aren't in the repo, so this works
from the prompt's section references.

---

## Task 1 — Token reconciliation + semantic alias layer

**Mismatch audit.** Every `color.*` key referenced anywhere already *resolved* —
nothing was undefined. The real drift was **two overlapping naming schemes** plus
**no intent layer**:

| Scheme | Keys | Status |
|--------|------|--------|
| Apple names | `light1/2/3`, `secondary`, `gray1/2/3`, `gray800/500/400/50` | canonical for surfaces |
| Numeric back-compat | `gray900/700/600/300/200/150/100` | most-used in components (gray500 ×82, gray700 ×24, gray100 ×27, …) |

**Reconciliation.** Settled the numeric greyscale as the canonical component
scale; kept the Apple names as documented aliases (no new hues, closed palette).
Added a **semantic intent layer** (HIG §3.0) so components can reference intent
instead of raw greys/hex:

- `color.label` (`#171717`), `color.secondaryLabel` (`#737373`),
  `color.tertiaryLabel` (`#A3A3A3`)
- `color.primary` (`#000000`, the one action colour), `color.onPrimary` (`#FFFFFF`)
- `surface.background / card / cardElevated / input / divider` — already present,
  verified.

All fixed light values; `accent.*` / `categoryAccent.*` untouched.
`[?]` The greyscale ramp has two legacy quirks preserved to avoid any visual
change (`gray700` == `gray800` hex; `gray600` lighter than `gray500`) — a cosmetic
cleanup for a later prompt, not load-bearing.

Commit `f00ad34`.

## Task 2 — Dynamic Type (strict)

**Approach.** RN already scales `fontSize` at render when `allowFontScaling` is on
(the default — never disabled). The bug at large sizes is that an explicit
`lineHeight` does **not** scale and clips. So `textStyle()` now multiplies
`lineHeight` by `PixelRatio.getFontScale()` (base fontSize passed through so RN
applies the scale once — no double-scaling). All type continues to flow through
the `Text` wrapper / `type` tokens.

**Large-size row stacking (§2.2b).** Added a reactive `useLargeText()` hook
(`useWindowDimensions().fontScale >= 1.5`, re-renders live on text-size change).
Applied stacking (label above value) to the high-traffic crowded rows:
- `SettingsList` rows (label + value)
- `MacroBars` rows (label + consumed/target)

`[?]` Pattern noted for the rest (nutrition meal rows are already vertical; the
dashboard nudge/plan cards are free-flowing text that wraps). Other crowded rows
adopt `useLargeText()` the same way in later prompts.

**Greps:** no `allowFontScaling={false}` anywhere; no raw `fontSize:` literals in
components — the only `fontSize` is `TextField`'s token-derived
`type.body.fontSize` (a `TextInput` needs an explicit size; RN scales it).

Commit `3762923`.

## Task 3 — Safe areas (strict)

Audited all ~55 screens: **every `SafeAreaView` already imports from
`react-native-safe-area-context`** (none from RN's built-in). Hardened the shared
`Screen` scaffold (§1.1): footer CTAs now sit above the home indicator
(`paddingBottom + insets.bottom`) and footer-less scroll content gets the bottom
inset so the last row clears the home indicator. Tab screens stay clear via the
native tab bar; the food FAB already uses the bottom inset. `index.tsx` is a
redirect spinner (no inset-sensitive UI).

Commit `e9b37a2`.

## Task 4 — 8pt spacing grid

Spacing audit: **all** margins/paddings/gaps already use the `space` tokens
(4/8 multiples). Width/height literals are all fixed-size visual elements (icon
chips, calendar dots, image tiles, camera reticles) or touch targets — none are
stretched layout containers, so no flex conversion was needed. Pointed the
semantic `44`/`52` literals (touch targets, list-row/button heights) at the
existing `layout.tapTarget` / `layout.buttonHeight` tokens in `SettingsList`,
`NavBar`, `Stepper`, `MultiSelectField`, `GymStatusCard`. Card padding (16pt+)
and radius (≥12pt) already satisfied by tokens.

`[?]` One raw spacing literal kept intentionally: `delete-account.tsx`
`marginTop: 2` — a sub-grid optical nudge aligning an icon to its first text line.

Commit `89c9697`.

## Task 5 — Touch targets (strict)

Hardened the `Pressable` primitive (§5.1): managed tap targets are now a full
**44×44** box (`minWidth` added alongside `minHeight`) and get an **8pt
`hitSlop`** so visually-tight icon buttons are comfortably tappable (callers can
override). Bumped the Glass header buttons (close/back/save) 40→`layout.tapTarget`
(44) and `SegmentedField` segments 40→44. The `BackButton`'s 36pt visual now sits
in a ≥44pt Pressable + hitSlop (visual < target is HIG-fine). `StatusBar` is
already dark-content (`expo-status-bar` `style="dark"`) for the light theme.

Commit `0b07230`.

## Task 6 — Audit & verify

- `npx tsc --noEmit` — **clean**.
- `npx expo export --platform ios` — **succeeds** (single iOS bundle).
- **Simulator (iPhone 17 Pro, non-CI Metro):**
  - Dynamic Type bumped to **accessibility-extra-large**: text scales
    dramatically, the **macro rows stack** (label/value above the bar), and
    Preferences text **wraps without clipping**; back at normal size everything
    restores cleanly.
  - Touch targets (back chevron, segmented control, close) comfortably tappable.
  - App stays **monochrome + light** with functional accents only (orange
    streak/ring, red/yellow/blue macro bars) — no system colours crept in.
  - Nothing regressed (dashboard, food, gym, settings).
- **Greps:** no `allowFontScaling={false}`; no raw `fontSize:` in components; all
  `color.*` keys resolve.

Commit (audit) — see log.

### Verification greps
```
allowFontScaling={false}            → NONE
raw fontSize: in components         → NONE (only TextField → type.body.fontSize)
unresolved color.* keys             → NONE
```

---

## Confirmation
Monochrome identity intact, still **light-only**, **no iOS system colours**
introduced as tint — black remains the primary action colour and the `accent.*`
palette is unchanged and functional-only. No feature logic touched (food entry,
streak/freeze, onboarding content, paywall, goals, Apple Health) — this pass was
tokens / type / spacing / safe-area / touch-targets only.

## Git log
```
<audit>  hig-foundation: audit clean
0b07230  hig-foundation: 44pt touch targets + hitSlop audit
89c9697  hig-foundation: 8pt grid + flexbox layout audit
e9b37a2  hig-foundation: safe-area-context on all screens
3762923  hig-foundation: dynamic type app-wide + large-size row stacking
f00ad34  hig-foundation: reconcile tokens + semantic alias layer
```

## Deferred `[?]`
- Greyscale ramp cosmetic cleanup (`gray700`==`gray800`, `gray600`<`gray500`).
- `useLargeText()` stacking rollout to the remaining crowded rows.
- `delete-account` 2pt optical nudge (intentional sub-grid exception).
- Components (vs screens) still reference numeric greys directly; migrating them
  to the new semantic `label/secondaryLabel/…` aliases is incremental later work.

---

**This is Prompt 1 of 6.** Next: **Prompt 2 — Navigation + Lists.**
