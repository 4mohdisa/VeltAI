# Lumo — Fix FAB, Voice Misrouting, Camera Screens

Three tested issues (plus a profile-photo stub cleanup). Frontend only, mock data.
`npx tsc --noEmit` clean before every commit; one commit per task.

**Camera honesty note up front:** the Scan-food and Barcode screens depend on
`expo-camera`. They were reported as a torn black sheet because that native module
wasn't in the dev binary (`Cannot find native module 'ExpoCamera'`). I fixed only
the **layout/presentation structure** and then re-verified on a **freshly rebuilt
native binary** (`npx expo run:ios`, which compiles `expo-camera` in). They now
present full-screen with no bleed-through. The one thing still unverifiable is the
**live camera feed** — the simulator has no camera, so the preview is black; that
needs a real device. Tracked as `[?]` below.

---

## Task 1 — FAB overshoot + double-plus artifact → FIXED

**Root cause of the "double-plus":** there is exactly **one** `GlassFab` in the
entire app (`src/app/(tabs)/food.tsx`), and the solid variant renders a single
`Icon name="plus"`. The "second small +" was **the meal section header's trailing
`add-circle` button** (`MealSectionHeader`, a `plus.circle.fill` on the right edge)
showing **behind** the FAB when the FAB rested on top of a section header/row. So
it was never a duplicated icon or a second FAB — it was an **overlap** exposing the
header's own "+".

**Root cause of the overlap:** the FAB floats `position: absolute`, but the
`SectionList`'s bottom padding (`space['4xl']` = 48) was **smaller than where the
FAB floats**, so the last (Dinner) rows and footer scrolled **under** the button.

**Fix (`food.tsx`):** derive the FAB offset and the list padding from one place so
they can't drift:
```ts
const FAB_SIZE = 56;
const fabBottom = insets.bottom + space['5xl'] + space.sm; // ~72pt above the home indicator → clears the glass tab bar
const fabClearance = fabBottom + FAB_SIZE + space.lg;       // list paddingBottom: nothing can sit under the FAB
```
- FAB `bottom` → `fabBottom` (comfortable gap above the native glass tab bar).
- `SectionList` `contentContainerStyle.paddingBottom` → `fabClearance`, so at rest
  (scrolled to the bottom) the last Dinner row/footer ends **above** the FAB and the
  button floats over blank space — no overlap, and the header "+" no longer peeks out.

**Verified (simulator):** one white plus on the black circle; comfortable gap above
the tab bar; the FAB is no longer aligned over a section header's "+". (`/tmp/lumo-fab.png`)

---

## Task 2 — Voice logging misrouted → FIXED

**Trace:** add-menu (`food/add.tsx`) → Voice card → `route: '/food/voice'`. That
target was already correct, and `/food/voice` (`VoiceEntryScreen`) is a clean
mic → transcript → parsed items → save flow with **no** photo-picker code.

**The actual bug:** `food/add` is presented as a **`formSheet`**, and each method
card did `router.push(route)` — which stacked the chosen flow **on top of the still-
open sheet** (`tabs → add(sheet) → voice`). That is the "opened the meal screen in a
**bottom sheet**" symptom. The **"Photo picker coming soon"** toast itself has only
ever had **one source** in the whole codebase — the profile "Change photo" button
(Task 4) — so voice was never actually calling it; removing that stub (Task 4)
guarantees voice (or anything else) can never surface it.

**Fix:**
- Added a single-cast `replace()` seam next to `navigate()` in `src/lib/nav.ts`.
- The add-menu now **replaces** the sheet with the chosen flow
  (`onPress={() => replace(m.route)}`), so Scan / Barcode / Voice / Saved each
  present cleanly instead of stacking under the sheet.

**Verified (simulator):** `/food/voice` renders the **Voice entry** screen (mic +
"Tap the mic and describe your meal" + example) — no photo picker, no toast.
(`/tmp/lumo-voice3.png`)

---

## Task 3 — Camera + barcode screens: full-screen layout (structural) → DONE; live feed `[?]`

**Reported symptom:** torn black sheet with the food log showing through the top.
**Cause:** presented as a default card with the camera module missing, so it never
cleanly covered.

**Structural fixes (no blind pixel-tuning):**
- **`src/app/_layout.tsx`** — registered `food/photo-capture` and `food/barcode-scan`
  as `presentation: 'fullScreenModal'` (slide-from-bottom) so they cover edge-to-edge.
- **`photo-capture.tsx` / `barcode-scan.tsx`** — black backdrop fills the screen;
  `CameraView` uses `StyleSheet.absoluteFill` so the preview always fills even if the
  module is degraded; `<StatusBar style="light" />` over the dark camera; controls
  placed with safe-area insets — **X top-left**, **capture button bottom-centre**
  above the home indicator with the **hint text above it**, **reticle centred** for
  barcode.

**Honesty / verification status:** these CANNOT be claimed pixel-correct from code
alone. After a **native rebuild** (`npx expo run:ios`, done this session — it
compiles `expo-camera`), both screens now **present full-screen with no food-log
bleed-through**, X / capture / reticle / hint laid out correctly
(`/tmp/lumo-cam.png`, `/tmp/lumo-barcode.png`). The **live camera feed is black**
because the **iOS simulator has no camera** — that is the only thing still
unverified and it needs a **real device**.

- **`[?]` Camera/barcode live-feed visual QA on a real device** (simulator shows a
  black preview; layout + full-screen presentation are verified, the actual camera
  image is not).

---

## Task 4 — Profile photo stub → REMOVED (option b)

Chose **(b) remove the affordance** (recommended). Deleted the "Change photo" button
from `profile/account.tsx` — it only fired the dead `Photo picker coming soon.` toast.
A real custom avatar needs the native image picker, which isn't trivial without a
native rebuild, so the **initials avatar ("BA")** is the clean v1. This was the
**only** source of that toast in the app, so there is now **no "coming soon" toast
anywhere** (a grep finds only an explanatory code comment).

**Verified (simulator):** Account shows the initials avatar with no "Change photo"
button. (`/tmp/lumo-account.png`)

---

## Task 5 — Audit

- **`npx tsc --noEmit`** — clean (before every commit).
- **`npx expo export --platform ios`** — succeeds.
- **`grep -rni "coming soon\|photo picker" src/`** — only an explanatory comment in
  `account.tsx`; no runtime toast.
- **Simulator (rebuilt binary, Metro on 8081):**
  - FAB: one plus, comfortable gap above the tab bar, no header-"+" peek. ✓
  - Voice: routes to the voice flow; no photo-picker toast. ✓
  - Account: initials avatar only, no dead toast. ✓
  - Camera + barcode: full-screen, no bleed-through; controls placed correctly
    (live feed black = no simulator camera). ✓ (feed QA `[?]` on device)
  - No regressions: top header still scrolls away, inputs keep the persistent
    border (colour-only focus), bottom sheets slide, goals/charts intact. ✓

---

## Git log
```
6fc4608 fix: fab-voice-camera audit clean
0247d12 fix: profile photo — remove dead stub (or real picker)
ceb1c7c fix: camera/barcode full-screen layout structure (unverified pending rebuild)
0969316 fix: voice logging routes to voice flow, not photo picker
42b7e6b fix: FAB position (no row overlap) + remove double-plus
```

## `[?]` Deferred
- **Camera/barcode live camera-feed visual QA on a real device.** The full-screen
  layout and presentation are verified on the rebuilt binary; the actual camera
  image cannot be seen in the simulator (no camera hardware).

## tsc + export
- `npx tsc --noEmit`: **clean.**
- `npx expo export --platform ios`: **succeeds.**

## Profile-photo option chosen
- **(b) — removed "Change photo".** Initials avatar is v1; no dead stub remains.
