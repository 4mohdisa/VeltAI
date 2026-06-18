# Lumo (was VeltAI) — Device-Test Fixes

Round of fixes from using the app on the simulator. Frontend-only, mock data, tsc
clean before every commit. The two recurring animation warnings were **root-caused**
this time (not silenced) — both are gone from Metro logs.

---

## Root-cause writeup — the two animation bugs

### A. Bottom sheet "appears instead of sliding" + `onAnimatedValueUpdate` (3rd attempt)
**What was actually wrong:** the `BottomSheet` rendered inside RN's **`<Modal>`**.
Prior passes tuned the Reanimated timing/easing — but the bug was the *mechanism*,
not the curve:
- On the New Architecture the `<Modal>` owns its **own native presentation
  `Animated.Value`**. The instant it mounts (and it mounts eagerly, with the tab
  screens) it emits `Sending 'onAnimatedValueUpdate' with no listeners registered`.
  That's why the warning appeared at app **load**, before any sheet opened — and why
  "fixing the sheet component" kept missing it.
- The Modal **presents its content immediately**, so the Reanimated slide-up was
  "consumed" off-screen → the sheet *appeared* at its final position.
- The Modal **unmounts content the instant `visible` goes false**, so the slide-down
  never had time to run → the sheet *vanished*.

**Root-cause fix:** stopped using `<Modal>`. The sheet now renders in a
react-native-screens **`<FullWindowOverlay>`** (the same primitive
`@gorhom/bottom-sheet` uses for its iOS modal). There is no Modal `Animated.Value`
→ the warning is gone. Reanimated fully owns `translateY`:
- decoupled an internal `mounted` state from the `visible` prop, so the sheet slides
  **down** to off-screen and only **then** unmounts (dismiss now animates);
- the scrim opacity is **derived from `translateY`** (a `useAnimatedStyle`), removing
  the `FadeIn`/`FadeOut` layout animations that previously ran inside the Modal;
- slide-up parks the panel its own measured height below the edge, then `withTiming`
  to 0 — visible both ways, no spring/bounce.

**Verified:** after relaunch + opening the item-edit sheet, the log-session sheet and
the add-menu, the Metro log has **0** `onAnimatedValueUpdate` lines.

### B. `[Reanimated] Writing to 'value' during component render` (SliderField:47)
**What was wrong:** `curFrac.value = frac` was assigned **in the render body** of
`SliderField` — writing a shared value while React renders is exactly what Reanimated
warns about (unsafe, can tear).
**Fix:** moved the prop→shared-value sync into a `useEffect` keyed on `frac` (the
gesture still writes it on the UI thread; the controlled-prop sync just no longer
happens during render).
**Verified:** after mounting the slider (log-session sheet), the Metro log has **0**
`Writing to value during render` lines.

> Combined clean-log check after exercising both surfaces: **0 / 0**. Neither was
> hidden by disabling strict mode or the Reanimated logger.

---

## The other fixes

| # | Fix | How verified |
|---|---|---|
| 2 | **Add-meal sheet full height** — detent `[0.5, 1]` → `'fitToContents'` so the 2×2 grid sizes the sheet. | Simulator: all four options (Scan/Barcode/Voice/Saved) + labels visible on open, clear of the home indicator. |
| 4 | **Native circular add button** — food FAB `variant="solid"` → `variant="glass"` (Liquid Glass + SF Symbol plus), with a drop-shadow wrapper for definition (the glass circle clips its own content). | Simulator: glass circular control, bottom-right, opens the add menu. |
| 5 | **Streak text clipping** — the rounded heavy stat variants had tight line heights (`statLarge` 40/44 etc.); gave them ~1.2× headroom at the token level. | Simulator: streak number + "DAY STREAK" render fully (profile/dashboard/detail). |
| 6 | **Removed the language picker** — dropped the LANGUAGE section + override reads from Preferences; defaulted i18n to `lng: 'en'`. **Kept all plumbing** (`t()`, provider, en/es/fr resources, `deviceLanguage()`, store `languageOverride`). | tsc; Preferences shows only units; app in English. |
| 7 | **Rename → Lumo + support email** (below). | grep: no user-facing "Velt"; email is `lumofit@gmail.com`. |
| 8 | **Restore-purchases explainer** — added "Already subscribed? Restore your purchase." under the button on the paywall and subscription screen; restore stays a stub. | Simulator. |
| 9 | **Apple Health toggle** — replaced the static "Connected" badge with a real Switch (settings `healthConnected`); badge shows Connected / Not connected, toast confirms, and the healthkit stub honours it so the nutrition cross-check reflects it. | Simulator: toggle on/off, badge updates, no crash. |

---

## Rename: VeltAI → Lumo

**User-facing copy changed to "Lumo":** welcome + about app name, About credits
("Lumo team"), the "Welcome to Lumo." toast, paywall copy, both camera-permission
explainers, and the subscription plan ("Lumo Premium"). **Support email → 
`lumofit@gmail.com`** (label + `mailto:`).

**Intentionally left as `veltai` (internal / not visible text):**
- the `veltai://` URL scheme and the iOS bundle id — changing them breaks deep links
  and the install.
- the `veltai.hasCompletedOnboarding` secure-store **key** — renaming it would sign
  existing users out / lose the onboarding flag.
- code comments and the design-tokens header.
- the placeholder `veltai.app` **policy/FAQ link targets** (Privacy/Terms/EULA/FAQ/
  Licenses) — these are tap targets, not shown as text, and there's no Lumo domain
  yet. `[?]` swap when the domain exists.

**OFF user-agent:** none exists — the barcode path is a local mock (`lib/food/barcode`)
with no real Open Food Facts fetch, so there was no `Veltai/1.0` string to change.

---

## Audit
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Metro logs (after exercising sheet + slider + add-menu): `onAnimatedValueUpdate`
  = 0, `Writing to value during render` = 0.**
- Simulator: add-meal full height ✓, glass circular add button ✓, streak no clip ✓,
  no language section / English ✓, "Lumo" + `lumofit@gmail.com` ✓, restore explainer
  ✓, Apple Health toggle ✓. Nothing else regressed (food log, goals, units, gym,
  onboarding→derived goals, charts).

## Git log
```
9f9c4b8 fix: apple health connection setting (stub) works
16f2a09 fix: restore-purchases explainer copy
b072924 rename: VeltAI -> Lumo (user-facing) + support email
1b18086 fix: remove language picker (keep i18n scaffolding)
fca2135 fix: streak text no longer clips
489297f fix: native circular add button
7659877 fix: SliderField no shared-value write during render
5114304 fix: add-meal sheet opens to full height
85888bb fix: bottom sheets slide up/down smoothly, kill onAnimatedValueUpdate (root cause)
```
(+ `fix: device-test fixes audit clean`.)

## `[?]` Deferred
- `veltai.app` policy/FAQ link targets + the `veltai://` scheme + bundle id + storage
  key stay `veltai` until a coordinated internal rename (would break deep links /
  sign users out); swap the `.app` URLs when a Lumo domain exists.
- Restore Purchases + StoreKit and real HealthKit authorization/reads are the
  backend / native-build phase (the UI + state are honest stubs now).
- Couldn't drive taps via `simctl` for the live slide/gesture, so the sheet
  slide-up/down was verified by the mechanism + clean logs; a manual swipe-through is
  the human check.
