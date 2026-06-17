# iOS HIG Series · Prompt 4/6 — Accessibility Report

VoiceOver, value announcements, non-colour cues, WCAG AA contrast, 200% reflow and
focus order per HIG §7 + §8. Frontend-only, mock data, tsc green before every commit.

**Standing constraints upheld:** (1) **Monochrome** — contrast fixed within the
grey palette, no system colours; black stays the one action colour. (2) **Light
theme only**. (3) **Custom Liquid-Glass nav chrome kept** — text over it stays
high-contrast black.

---

## Task 1 — VoiceOver labels, roles, hints, grouped rows (§7.1)
- **Decorative icons** (no label) are now hidden from VoiceOver
  (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`)
  so they never read as stray fragments; **labeled icons** expose as `image`.
- **SettingsList rows:** toggles get `role="switch"` + `checked` state; link/plain
  rows get `accessible` + a combined `"label, value"` label; chevron hidden.
- **Composite food rows** are one element: `accessible` + role `button` +
  `"Oats with whey, 250 g, protein 28, carbs 40, fat 8, 320 kcal"` + an edit/swipe
  hint — read as one unit, not four fragments.
- **Headers** use the `header` trait (meal section titles include the subtotal).
- `accessibilityHint` added to the add FAB (and `GlassFab` gained hint support);
  tabs announce selected state natively.

Commit `08a88b6`.

## Task 2 — Dynamic value + live regions (§7.1)
- **Toasts** are a polite live region (`role="alert"` + `accessibilityLiveRegion`)
  and `AccessibilityInfo.announceForAccessibility` speaks the message — so "Meal
  logged…", goal saved, and errors are announced (paired with the visual + haptic).
- **Stepper** is now a single **`adjustable`** element: VoiceOver swipe up/down
  increments/decrements via `accessibilityActions` and announces the new value via
  `accessibilityValue`. **SliderField** was already `adjustable`.
- The calorie ring already carries an "X of Y" label; loading/error states
  announce through the toast and don't trap focus.

Commit `a642721`.

## Task 3 — Colour is never the only signal (§8.3)
Audited every accent-encoded surface — most were already non-colour:
- **Gym calendar** — encoded by **shape/symbol** (filled+checkmark = session,
  snowflake = freeze, ring = today, thin outline = missed), with a legend; added a
  VoiceOver label to each day cell.
- **Macro categories** — full word labels ("Protein/Carbs/Fat") **plus distinct
  icon shapes** (circle/leaf/drop), not colour alone.
- **Scan confidence** — removed the row opacity dimming (which both relied on
  opacity *and* hurt contrast) and replaced the pill with an explicit **"Low
  confidence" text + icon badge**, with the state spoken in the row label.
- **Status** — toasts already pair an SF Symbol + text (not colour).

Commit `42d20e4`.

## Task 4 — WCAG AA contrast (§8.2)
Darkened the secondary/tertiary greys at the **token level** (monochrome), so they
pass on white, the grouped background and the grey card:

| Token(s) | Before | After | white / gray50 / card |
|---|---|---|---|
| secondary text (`gray500`/`secondaryLabel`/`secondary`/`gray600`) | #737373 / #848484 | **#6B6B6B** | 5.33 / 5.11 / 4.78 (≥4.5 ✓) |
| tertiary (`gray400`/`tertiaryLabel` — placeholder/disabled/chevrons) | #A3A3A3 | **#8A8A8A** | 3.45 / 3.31 / 3.09 (≥3:1 ✓) |

Secondary text now clears **4.5:1 everywhere** (it failed ~4.2:1 on grey cards
before). Tertiary clears **3:1** for UI glyphs/chevrons (placeholder/disabled text
is WCAG-exempt). **Text over Liquid Glass** (nav title, back label, Done, FAB +)
uses `color.black`/`onPrimary` = high contrast regardless of backdrop; tab labels
are native.

Commit `5c0a240`.

## Task 5 — 200% text reflow + focus order + modal focus (§7.2 / §7.1)
- **200% Dynamic Type:** food item rows now wrap (`numberOfLines={0}`) and stack
  the trailing calories under the name/macros at large text; Goals macro grams/%
  fields stack vertically. (SettingsList + MacroBars already stacked from
  Foundation.) _Verified at AX5: rows wrap with no clipping, FAB still reachable,
  no horizontal scrolling._
- **Modal focus:** `accessibilityViewIsModal` on `SheetContent` + `BottomSheet`
  traps VoiceOver inside the sheet so the rotor can't reach the dimmed backdrop.
- **Focus order / headers:** titles use the `header` trait (NavBar, SheetContent,
  food-log "Today", meal section heads) for rotor heading navigation.
- Reduce Motion (Prompt 3 hook) still covers all animations.

Commit `5159173`.

## Audit & verify
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Coverage:** `accessibilityRole` 7→15 files, `accessibilityHint` 0→3,
  `accessibilityState` 5→7, `accessibilityViewIsModal` 0→2,
  `announceForAccessibility` 0→1.
- **Simulator (iPhone 17 Pro):** darker secondary greys legible + still
  monochrome/light; **AX5 (largest text)** the food log wraps with no clipping and
  the FAB stays reachable; the app is inherently **grayscale-safe** (monochrome
  base + text/shape cues). VoiceOver labels/roles/grouping + modal focus wired.
  Nothing regressed.

Commit `hig-a11y: audit clean`.

## Git log
```
5159173 hig-a11y: 200% text reflow + logical focus order + modal focus
5c0a240 hig-a11y: WCAG AA contrast on text + states
42d20e4 hig-a11y: non-colour cues for all colour-encoded meaning
a642721 hig-a11y: dynamic value + live-region announcements
08a88b6 hig-a11y: VoiceOver labels, roles, hints, grouped rows
```
(+ `hig-a11y: audit clean`.)

## Deferred `[?]`
- VoiceOver labels are applied to the shared components + food/settings/gym
  surfaces; the long-tail of one-off screens (onboarding steps, paywall detail)
  inherit the primitives but a per-screen sweep is incremental.
- A live VoiceOver gesture walk-through + Grayscale-filter screenshot aren't
  scriptable via `simctl` (enable VoiceOver/Grayscale in Settings → Accessibility
  to verify by hand); coverage was verified by props + the 200%/contrast renders.
- 200% stacking is applied to the high-traffic rows; remaining one-line rows adopt
  `useLargeText` the same way as needed.

---

**This is Prompt 4 of 6.** Next: the **Colour/Contrast token pass** (small,
light-only), then **Charts + Liquid Glass**.
