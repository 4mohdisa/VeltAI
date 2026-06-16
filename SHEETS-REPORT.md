# Sheets Report — create/edit → bottom sheets everywhere

**Scope:** presentation + header chrome only. Every scoped create/edit task is now
a detented bottom sheet using the standard `SheetContent` header (X-left / Done-
right glass buttons). **No editing/saving logic, validation, or data shapes were
changed; no accent colours applied; content cards untouched visually.** Verified on
the iPhone 17 Pro simulator.

## Converted to sheets (all use `SheetContent` — X left / tick right)

| Screen | Detent | Header | Notes |
|---|---|---|---|
| **Food item quick-edit** (new, from C11 tap-to-edit) | 0.7 / large | X discard · tick save | Tap any item row → edit name/qty/macros. Delete-item inside with a soft `Alert` confirm. Removed the edit pencil + placeholder toast. |
| **Custom food** (C10) | large (0.95) | X · tick (disabled until valid) | Fields + save logic unchanged. *Verified in sim.* |
| **Barcode confirm** (C8) | 0.6 | X · tick | Serving picker recomputes macros; save unchanged. |
| **Serving-size picker** (new, C9 path) | 0.45 | X · tick | Manual-search result → pick serving → save. |
| **Photo review** (C4) | full-screen route w/ glass header | X discard scan · tick proceed | Tick → uncertainty Q&A if anything's unsure, else save. Kept as a full-screen route (it directly follows the camera) but adopts the X/Done glass header. |
| **Uncertainty** (C5) | formSheet | X bails · in-body Next/Save | **Documented deviation:** multi-step Q&A keeps an explicit in-body Next/Save button (a single trailing tick can't express "Next"); the glass X bails out of the scan. |
| **Log gym session** (D2) | 0.6 / large | X · tick | Already a sheet (nav pass) — confirmed standard header. |
| **Apply freeze** (D5) | 0.5 | X · tick | Already a sheet — confirmed. |
| **Add-meal picker** (C2) | 0.5 / large | X only | A chooser, no save — X only, confirmed. |

## Intentionally left as full screens (documented exceptions)

| Screen | Why |
|---|---|
| **Photo capture** (C3), **Barcode scan** (C7) | Live camera viewfinder — Apple allows/expects full-screen for camera flows. |
| **Voice entry** (C6) | Voice-capture (mic) flow — same full-screen capture exception; its inline review follows the recording. |
| **Manual search** (C9) | A finder/search interface (keyboard-driven list), not a scoped create/edit form. Picking a result now opens the serving sheet. Could become a sheet later; left as a screen for now. |
| **Delete account** (E12) | Multi-step destructive confirmation flow (settings section), not a single scoped edit. |
| **Settings pages** (E2–E11) | Navigation / multi-control pages. Single-value edits (display name, units) are **inline** on the Account/Units pages — there are no separate single-field editor screens to convert. |
| **Detail / list views** (B2 plan, B3 lockout, B4 nutrition, C11 meal detail, C12 history, D4 streak, D6 history, D3 auto-detect) | Read/detail/navigation, not create/edit. |

## Audit result

- All **9 scoped create/edit forms** are sheets with the standard glass X-left /
  Done-right header (`SheetContent`). Verified by grep: every `SheetContent`
  consumer is a create/edit/confirm flow; every remaining `Screen` consumer is a
  detail, list, settings-navigation, or documented full-screen exception.
- No create/edit interaction pushes a full screen except the documented camera /
  voice / multi-step exceptions.
- Sheets present softly (formSheet), grabber visible, 28px corners, white content.

## `[?]` deferred / judgement calls

- **C9 manual search** left as a full screen (finder). Convertible to a sheet later
  if desired.
- **C5 uncertainty** keeps an in-body Next/Save (multi-step) instead of a trailing
  tick — documented deviation, not a blocker.
- **gym/auto-detect (D3)** standalone route left as a screen (the inline banner on
  the Gym tab is the primary UX; the route is a deep-link mirror).

## Verification

- `npx tsc --noEmit` — clean before every commit.
- `npx expo export --platform ios` — succeeds.
- Simulator: custom-food opens as a large sheet with X/disabled-tick glass header,
  grabber, 28px corners, white body, over the dashboard — confirmed.

## Git log

```
sheets: create/edit audit (+ SHEETS-REPORT.md)
sheets: photo review + uncertainty chrome
sheets: barcode confirm + serving picker
sheets: custom food form
sheets: food item quick-edit
```

## Confirmation

Editing/saving logic and data are intact (saves still mocked/toasted as before),
**no accent colours were applied** (everything stays monochrome-structural), and
content cards were not restyled. The workout-schedule and gym-selfie features were
**not** built.
