# iOS HIG Series · Prompt 2/6 — Navigation + Lists Report

Navigation chrome and lists per HIG §4 + §6. Frontend-only, mock data, tsc green
before every commit. Builds on Prompt 1 (semantic aliases, `useLargeText`, the
`Screen` wrapper).

**Standing constraints upheld:** (1) **Monochrome** — mechanics only, no system
colours as tint, black is the one action colour, `accent.*` functional-only.
(2) **Light theme only** — no Dark Mode, no `useColorScheme`, no dark variants.

---

## Task 1 — Native tab bar (§4.1)
The tab bar was **already native** — `expo-router/unstable-native-tabs`
`NativeTabs` (so system selected-state tinting + iOS 26 Liquid Glass come free).
Verified SF Symbols use filled-when-selected / outlined-when-default for
house/dumbbell/person; labels always visible; 4 parallel tabs. Made the **central
+ a solid black circle with a white glyph** (`GlassFab variant="solid"` →
`color.primary` fill, `color.onPrimary` icon) floating above the bar — the one
primary action. _Verified on simulator: native bar, Food fills when selected, the
solid + floats clear of the bar._

Commit `3c29569`.

## Task 2 — Nav bars, back labels, large titles (§4.2)
The app deliberately uses **custom Liquid-Glass nav chrome** (the iOS 26 material)
rather than the stock `UINavigationBar` — an existing product decision — so I
honoured §4.2's *mechanics* within it:
- **Back labels the previous screen:** `GlassBackButton` gained an optional label
  (chevron → "‹ Settings" pill), threaded NavBar → Screen as `backLabel`; applied
  to the Settings drill-downs (Preferences, Goals, Notifications) and history
  screens (Gym/Food).
- **Large titles** (left-aligned, scroll away) on the list roots: Food leads with
  "Today"; added "Gym" to the Gym root.
- **Swipe-back** verified working (native stack; no `gestureEnabled:false`).
- Nav bars keep ≤2 right actions and never stack.

`[?]` Full native large-title *pin-to-small-title* collapse and back labels on
every drill-down are deferred — the custom chrome approximates the collapse by
scroll-away. Adopting the stock native header app-wide is a larger change tracked
for later.

Commit `0a403e3`.

## Task 3 — Food log as a native sectioned list (§6.1/§6.2) — centerpiece
Rebuilt C1 (`(tabs)/food.tsx`) from hand-rolled `MealCard`s into a native
**`SectionList`**:
- **One section per meal** (Breakfast/Lunch/Dinner/Snacks); section header shows
  the meal name + its **calorie subtotal** and a **+** to add to that meal.
- **Food items as rows** (consistent 60pt): primary label left, secondary macros
  (`footnote`/`secondaryLabel`), **calories right-aligned**; hairline separators;
  rounded inset group (`surface.card`).
- Tapping a row opens the shared **FoodItemEditSheet**; edits/deletes recompute
  subtotals + the daily total live. Empty slots show an "Add to {slot}" row.
- The **search bar pins** above the list. _Verified on simulator._

Commit `1c9abb2`.

## Task 4 — Inset-grouped settings-style screens (§6.2)
`SettingsList` now renders the standard iOS inset-grouped look: **white elevated
rows** (`surface.cardElevated`) on a **subtle grouped background** (added a
`grouped` prop to `Screen` → `surface.backgroundAlt`), section header
(`footnote`/`secondaryLabel`) + optional footer, rows ≥44pt, label left /
value·chevron·control trailing. Opted in: Settings, Preferences, Goals,
Notifications, Apple Health, Account, About, Privacy, Support, Subscription + the
Profile tab. _Verified on simulator (white rows on grouped bg, ACCOUNT/APP/ABOUT
headers, chevrons, monochrome)._

Commit `5ed14dc`.

## Task 5 — Empty, loading & swipe states (§6.3)
Every list now has all three states:
- **Empty** (SF Symbol + what's-missing + what-to-do + optional CTA via
  `EmptyState`): food log (no meals), Saved foods (none / no match), search (no
  results), gym history, meal history.
- **Loading**: new **`SkeletonList`** (Reanimated pulse, Reduce-Motion aware)
  shown on first load for the food log, Saved foods, search and both history
  lists — not bare spinners; pull-to-refresh keeps its inline spinner.
- **Swipe**: new **`SwipeableRow`** using gesture-handler's **`ReanimatedSwipeable`**
  (Reanimated-driven, not JS) → swipe-to-delete on food rows and Saved foods, with
  a **confirm** (destructive rule). The **tap → edit-sheet Delete** is the
  accessible non-gesture alternative.

Commit `edfcc51`.

## Audit & verify
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds** (single iOS bundle).
- **Simulator (iPhone 17 Pro, non-CI Metro):** native tab bar (SF Symbols, Food
  fills when selected) + solid black/white **+** FAB; food log = native sectioned
  list (meal sections + subtotals, item rows + right-aligned calories +
  separators, empty "Add to Dinner" row); Settings = inset-grouped; large title
  "Today"; monochrome + light; nothing regressed (dashboard, food, settings all
  render). Skeleton resolves on first load; swipe/empty verified in code (gesture
  not drivable via simctl).
- **Dynamic Type (Prompt 1)** still holds — rows use the `Text` wrapper / tokens
  and `useLargeText` stacking.

Commit (audit) — see log.

## Confirmation
Monochrome + light intact; **native tab bar in use**; every list has an empty +
loading state; swipe actions are Reanimated with a tap alternative. No feature
logic touched (food-entry logic, streak/freeze, onboarding, paywall, goals,
Apple Health) — nav + list structure only.

## Git log
```
edfcc51 hig-lists: empty + skeleton + swipe states
5ed14dc hig-lists: inset-grouped settings-style screens
1c9abb2 hig-lists: food log as native sectioned meal/item list
0a403e3 hig-nav: nav bars, back labels, large titles
3c29569 hig-nav: native tab bar with SF Symbol selected/unselected
```
(+ `hig-nav-lists: audit clean`.)

## Deferred `[?]`
- Stock native nav header with pin-to-small-title collapse + back labels on every
  drill-down (custom Liquid-Glass chrome retained for now).
- Swipe-to-delete on additional row types (meal-detail items) — pattern is ready.
- Skeleton/empty on lower-traffic lists (plan, gym sessions on dashboard).
- A simulator screenshot of the swipe/skeleton states (gesture + sub-700ms flash
  aren't easily captured via simctl).

---

**This is Prompt 2 of 6.** Next: **SF Symbols + Motion + Haptics.**
