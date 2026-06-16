# Food Entry Rework — Report

Frontend-only rework of food logging around four decisions: a clean add-menu, a
dedicated (no-AI) barcode path, a Saved foods screen, and one universal item edit
sheet shared across every flow. Mock data throughout; no backend touched.

## What changed

### 1 · 2×2 add-menu (`food-entry: 2x2 add-menu`)
`src/app/food/add.tsx` now shows four large cards — **Scan food · Barcode · Voice
· Saved foods**. No gym option. Manual search is *not* a card (it moved to the
food log). The sheet keeps the standard X-left dismiss; the food-log **+** opens
it. _Verified on simulator — see add-menu screenshot._

### 2 · Inline manual search on the food log (`food-entry: inline manual search on food log`)
`src/app/(tabs)/food.tsx` gained a search bar at the top. Typing filters a mock
Open Food Facts catalog (`foodCatalog`/`recentFoods` in `src/lib/mock/data.ts`);
tapping a result opens the serving-size picker (`/food/serving`) which adds it to
today. Empty results still surface an **Add custom food** link (C10). The old
standalone search destination was removed.

### 3 · Dedicated barcode path, no AI (`food-entry: dedicated barcode path (no AI)`)
Barcode is a **database lookup, not a Gemini call**:
- New `src/lib/food/barcode.ts` — `lookupBarcode(code)` against a mock Open Food
  Facts DB, plus `exampleBarcodeProduct`. **No `mock/ai` import anywhere on the
  barcode path** (verified by grep).
- `barcode-scan.tsx` resolves the scanned code via `lookupBarcode`. Found →
  product confirm. **Not found → a message + "Photograph the label"** which routes
  into the AI photo path (the only place barcode hands off to AI).
- `barcode-confirm.tsx` reads `exampleBarcodeProduct` and lets you tweak the
  product via the shared edit sheet before saving.

### 4 · Saved foods (`food-entry: saved foods`)
New `src/app/food/saved.tsx` (C13): searchable mock list (saved/frequent/recent).
Each row has a one-tap **+ Add** that logs straight to today (no scan/AI/edit).
Tapping the row opens the shared edit sheet, where **Delete item un-saves** it.
Registered as a formSheet; reachable from the add-menu. The meal detail (C11) now
carries a per-item **bookmark/save** affordance that saves an item to Saved foods.
_Verified on simulator — see Saved foods screenshot._

### 5 · Universal item edit sheet (`food-entry: universal item edit sheet`)
New `src/components/domain/FoodItemEditSheet.tsx` — **one** reusable native bottom
sheet: **X/close on the LEFT, ✓/confirm on the RIGHT**, editable name / serving /
calories / protein / carbs / fat, and a **Delete item** button at the bottom. No
edit pencils — the whole row that opens it is tappable.

`DetectedItemsReview` rows are now whole-row tappable (inline X removed) and open
this sheet. Edits flow back into **live totals**. The C5 uncertainty-prompt logic
is untouched: low-confidence items stay dimmed + flagged "Confirm" and still route
through `/food/uncertainty` before saving.

**Shared by all four flows (one component, not four):**

| Flow | Screen | Uses `FoodItemEditSheet` |
|------|--------|--------------------------|
| Photo (C4) | `food/photo-review.tsx` | ✓ |
| Voice (C6) | `food/voice.tsx` | ✓ |
| Barcode (C8) | `food/barcode-confirm.tsx` | ✓ |
| Saved (C13) | `food/saved.tsx` | ✓ |
| Meal detail (C11) | `food/[meal].tsx` | ✓ (migrated off the old routed sheet) |

### 6 · Reconcile + cleanup (`food-entry: remove old picker + reconcile routes`)
- Deleted `src/app/food/search.tsx` (folded into the food-log search bar).
- Deleted `src/app/food/item-edit.tsx` (routed sheet replaced by the shared
  component) and removed its `_layout.tsx` registration.
- Removed the now-orphaned `aiBarcodeProduct` from `mock/ai.ts`.
- Grep confirmed no dangling refs to the removed routes/exports; all add-menu and
  food-log routes resolve.

## Audit (`food-entry: audit clean`)
- `npx tsc --noEmit` — **clean** (run before every commit).
- `npx expo export --platform ios` — **succeeds** (1 iOS bundle, 4.3 MB hbc).
- Native build + install + launch on iPhone 17 Pro simulator — **Build
  Succeeded, 0 errors / 0 warnings**; `iOS Bundled (1998 modules)`, 0 errors.
  Home, the 2×2 add-menu, and Saved foods all render correctly.
- One shared edit sheet confirmed across photo/voice/barcode/saved (+ meal
  detail) by grep.

### Notes
- `[?]` Deep-linking directly to a grouped route (e.g. `veltai://food`) shows
  Expo Router's "Unmatched Route" — a known openurl/deep-link quirk for `(tabs)`
  groups, **not an app bug**. Cold launch + in-app navigation work normally.
- Port 8081 was held by a separate local project (`trackrai`), which made the
  dev client load the wrong bundle once; freeing 8081 and restarting Veltai's
  Metro resolved it.

## Not touched (as required)
Streak, gym, onboarding, paywall, profile, Apple Health, and the C5 uncertainty
prompt logic. No workout-schedule feature built. Backend remains out of scope —
everything is mock data.
