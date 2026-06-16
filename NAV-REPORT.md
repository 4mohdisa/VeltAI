# Nav Report — Liquid Glass navigation layer + sheets + rounded font

**Scope:** navigation/chrome layer + sheet header pattern + font loading only.
Content cards untouched, **no accent colours applied**, logic/routing/data intact.
Verified running on the iPhone 17 Pro simulator (iOS 26).

## Task 0 — SF Pro Rounded ✅ (loaded; stats now render rounded)

- Mounted `SF-Pro.dmg` with `hdiutil`; the volume held `SF Pro Fonts.pkg`, which I
  expanded with `pkgutil --expand-full`. Copied the three weights we use into
  `assets/fonts/`: **SF-Pro-Rounded-Semibold/Bold/Heavy.otf**. Unmounted the dmg.
  Fonts are committed (not gitignored).
- Loaded via `useFonts()` in `src/app/_layout.tsx` under names
  `SFProRounded-Semibold/Bold/Heavy`.
- Wired the foundation resolver: `textStyle()` maps `family:'rounded'` → the face
  by weight (600→Semibold, 700→Bold, 800→Heavy) and omits `fontWeight` (the face
  encodes it).
- **Confirmed on simulator:** the big stat numbers (streak **13**, calories
  **1,240**, **21/47/2**) render visibly **rounded** vs the SF Pro Display body
  text. The deferred blocker from the foundation pass is resolved.

## Task 1 — Liquid Glass tab bar ✅

- `(tabs)/_layout.tsx` uses `NativeTabs` (expo-router). **Removed** the
  `blurEffect="systemChromeMaterial"` override so the iOS 26 system **Liquid
  Glass** capsule renders itself.
- **Confirmed on simulator:** the tab bar is the floating inset glass capsule
  (translucent, content scrolls under it), not a flat opaque bar. Active = black,
  inactive = system grey. SF Symbols house.fill / fork.knife / dumbbell.fill /
  person.fill.

## Task 2 — Liquid Glass nav buttons ✅

- New `GlassBackButton` / `GlassCloseButton` / `GlassSaveButton` (and a `GlassFab`)
  in `src/components/navigation/GlassButtons.tsx`, built on **`expo-glass-effect`**
  `GlassView` (`glassEffectStyle="regular"`, `colorScheme="light"`,
  `isInteractive`). `isLiquidGlassAvailable()` is true on this iOS 26 build, so the
  **real system Liquid Glass** is used; the documented fallback is a clean light
  `BlurView` circle for older OSes. Icons inside are black; press feedback is
  opacity only (no spring).
- `NavBar` now uses `GlassBackButton` (replacing the old grey-circle back button).

## Task 3 — Standard sheet header (X-left / Done-right) ✅

- New `SheetContent` wrapper: leading **GlassCloseButton (X)**, optional centred
  `title3`, trailing **GlassSaveButton (tick/Done)**, **white** content background
  (content is never glass). The native formSheet supplies the grabber + 28px
  corners (configured in the root `Stack` from the prior pass).
- Applied to: **log-session** (X dismiss / tick = log + XP toast), **add-meal
  picker** (X only — a picker has no save), **apply-freeze** (X cancel / tick
  apply, disabled at 0 freezes). Sheet bodies were not changed.
- **Confirmed on simulator:** opening the Log-session sheet shows the X-left /
  tick-right glass header, grabber, white body, 28px corners, no bounce.
- Not converted: `modals/confirm` and `food/uncertainty` keep their existing
  in-body buttons — a confirm sheet needs an explicit labelled destructive action,
  and uncertainty is a multi-step Next/Save flow that doesn't map to a single tick.
  Noted as intentional.

## Task 4 — Glass FAB ✅

- The food-log add button is now `GlassFab` (Liquid Glass circle, black `plus`,
  BlurView fallback), positioned absolute and lifted clear of the tab bar via
  `insets.bottom + space['5xl'] + space.lg`. Opacity press feedback (no spring).
- Code verified (tsc + bundle clean). Note: the iOS deep-link used for screenshots
  doesn't switch the native selected tab, so the FAB wasn't captured in a shot, but
  it bundles and renders on the Food tab.

## Glass rendering — honest assessment

- **Tab bar:** true system Liquid Glass (NativeTabs on the iOS 26 SDK) — verified
  visually as the floating capsule.
- **Nav buttons / FAB:** `expo-glass-effect` `GlassView`. `isLiquidGlassAvailable()`
  returns true on this iOS 26 build, so real Liquid Glass is used; on white sheet
  backgrounds the effect reads as a subtle light glass circle (expected). BlurView
  fallback is in place for non-26 OSes.

## Deferred `[?]`

- None blocking. (FAB not captured in a screenshot due to the deep-link/tab quirk,
  but it's wired and bundles.)

## Verification

- `npx tsc --noEmit` — clean (before every commit).
- `npx expo export --platform ios` — succeeded earlier in the pass; the live bundle
  compiled clean (`iOS Bundled … 2000 modules`, 0 errors) and runs on device.

## Git log

```
nav: glass FAB
nav: standard X-left/Done-right sheet header
nav: glass back/close/save buttons
nav: liquid glass tab bar
nav: load SF Pro Rounded for stat numbers
```

## Confirmation

Content cards were **not** restyled, **no** chart/AI accent colours were applied,
and routing/data/logic are intact. The workout-schedule and gym-selfie features
were **not** built. Changes are limited to the nav/chrome layer, the sheet header
pattern, and font loading.
