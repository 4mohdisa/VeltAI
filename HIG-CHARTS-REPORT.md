# iOS HIG Series · Prompt 6/6 — Charts (FINAL) Report

The final pass: every chart HIG-compliant + accessible — headlines, plain-language
takeaways, labeled values, non-colour encoding, VoiceOver summaries, empty/loading
states. Frontend-only, mock data, tsc green before every commit.

**Standing constraints upheld:** (1) **Monochrome chrome** — functional accent is
used *within* charts but never the only cue (labels/markers always present). (2)
**Light theme only**. (3) **Custom Liquid-Glass nav chrome kept.**

---

## Task 1 — Chart inventory

| Chart | Type | Screen(s) | Encodes | Before this pass |
|---|---|---|---|---|
| **DailyMacroRing** | Ring | Dashboard, Nutrition | calories consumed vs target | number+label inside, energy-unit aware; no headline/takeaway, no VO summary |
| **MacroBars** | Bars | Dashboard, Nutrition | protein/carbs/fat/fibre vs target | per-row label + distinct icon shape + colour (non-colour ✓); no headline/takeaway/VO summary |
| **CalorieCrossCheck** | Columns | Nutrition | eaten vs active-burn vs goal | headline + takeaway present; "kcal" hardcoded (ignored energy unit); active-burn has flame+label (non-colour ✓) |
| **GymCalendar** | Calendar/heatmap | Gym tab, Streak detail | per-day session/freeze/missed/today | shape/symbol-encoded + legend + per-cell VO labels (A11y pass ✓); no takeaway summary |
| **CalorieCrossCheck** net line | Text insight | Nutrition | net vs goal | present |
| _Weight projection_ (`wow.tsx`) | Line | Onboarding | 90-day projection | OUT OF SCOPE — onboarding content (not touched); already direct-labelled + green data colour |
| StreakFlame / StreakCounter / GymStatusCard | Stat/hero (not charts) | — | streak number / gym status | n/a |

Non-onboarding charts in scope: **DailyMacroRing, MacroBars, CalorieCrossCheck,
GymCalendar.** What each received is detailed in Tasks 2–5 below.

## What each chart received

A reusable **`ChartCard`** frame (monochrome chrome) wraps each chart and supplies
the headline, takeaway, single VoiceOver summary, and empty/loading slots.

| Chart | Headline | Takeaway (computed) | Non-colour encoding | VoiceOver summary |
|---|---|---|---|---|
| Calories ring | "Calories today" | "910 kcal remaining today" | number + label inside; arc reinforces | "Calories today. 1,240 of 2,150, 910 left." |
| Calorie cross-check | "Calorie cross-check (kcal)" | "Net 700 kcal against your 2,150 goal." | columns labeled Eaten/Active burn/Goal; flame icon on active burn | one summary of all three + net |
| Macros | "Macros today" | "Protein 96 of 165 g" | per-bar word label + distinct SF Symbol (circle/leaf/drop/grid) + value | all four macros consumed/target |
| Gym calendar | "Last 30 days" | "13-day streak · 18 sessions, 1 freeze" | shape/symbol per day + labeled legend | streak + counts + shape-encoding description |

## Task 2 — Headlines + plain-language takeaways
Every chart states what it shows in words and a computed insight from real mock
values, with explicit units (kcal/kJ per the energy setting, g). `CalorieCrossCheck`
now respects the energy unit (was hardcoded `kcal`) and shows the unit in its
headline. Commit `849b9ff`.

## Task 3 — Labeled values + unit / Dynamic Type
MacroBars direct-label each bar with `consumed / target g` (and stack at large text
from Foundation); CalorieCrossCheck columns are labeled and now **stack vertically
at large text** so they don't overlap at 200%; the ring shows its number + unit.
Charts respect unit + energy prefs. No time-series axes are in scope (the only line
chart is the out-of-scope onboarding projection). Commit `82c4df7`.

## Task 4 — Non-colour encoding (verified)
Colour is never the only signal: MacroBars direct-labels every series (word +
distinct icon shape), no colour-only legend; the calendar is shape/symbol-encoded
with a labeled legend; the ring's number+label carry the meaning. Concept→colour is
the single closed `categoryAccent` map (protein=red, carbs=yellow, fat=blue,
fibre=turquoise, AI=purple, calories/streak=orange), applied consistently.
Commit `acf0df5`.

## Task 5 — VoiceOver summaries + empty/loading
Each chart is one accessible element with a plain-language summary (not every data
point). Empty + loading wired via `ChartCard`: skeleton rows on first load
(nutrition charts), an empty "No data yet" slot ready for the backend. Skeletons
respect Reduce Motion; the static charts have no entry animation to gate.
Commit `de83025`.

## Audit & verify
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Simulator (iPhone 17 Pro):** Nutrition shows every chart with a headline,
  takeaway, labeled values + units, and direct-labeled macro bars; functional
  accent within charts with labels; chrome monochrome + light; unit/energy prefs
  flow through; nothing regressed.
- Concept→accent map applied consistently across all charts.

Commit `hig-charts: audit clean`.

## Git log
```
de83025 hig-charts: VoiceOver summaries + empty/loading states
acf0df5 hig-charts: non-colour encoding for all series
82c4df7 hig-charts: labeled axes + values + unit/type-size handling
849b9ff hig-charts: headlines + plain-language takeaways
a3e2314 hig-charts: inventory (in the report)
```
(+ `hig-charts: audit clean`.)

---

# 🏁 HIG Series — Complete (6 / 6)

This completes the six-prompt iOS HIG series. The frontend is frozen.

| # | Prompt | Headline outcome |
|---|---|---|
| 1 | **Foundation** | Reconciled tokens + semantic alias layer, Dynamic Type, safe areas, 8pt grid, 44pt targets |
| 2 | **Navigation + Lists** | Native tab bar + solid + FAB, nav/back-labels/large-titles, food-log `SectionList`, inset-grouped settings, empty/skeleton/swipe states |
| 3 | **SF Symbols + Motion + Haptics** | Canonical SF Symbols, zero-spring timing motion, `expo-haptics` mapping, Reduce-Motion hook, instant press feedback |
| 4 | **Accessibility** | VoiceOver labels/roles/grouped rows, live-region/adjustable announcements, non-colour cues, WCAG AA contrast, 200% reflow + modal focus |
| 5 | **Colour + Liquid Glass** | No raw hex in components, one-accent discipline (black-only actions), glass = nav-layer-only, Reduce-Transparency fallback |
| 6 | **Charts** | Headlines + plain-language takeaways, labeled values, non-colour series encoding, VoiceOver summaries, empty/loading |

## Consolidated `[?]` — manual-only checks (whole series)
These need a real device or the Settings → Accessibility toggles; `simctl` can't
script them. The behaviour is wired in code and tsc-verified — they just need a
human pass to confirm visually:
- **VoiceOver gesture walk-through** (labels/roles/summaries are set; swipe-through
  confirmation is manual).
- **Grayscale / Color Filters** (non-colour cues present; the app is mostly
  monochrome so this is low-risk).
- **Reduce Transparency** toggle (solid-glass fallback wired) — `simctl ui` exposes
  `increase_contrast`/`content_size` only.
- **Reduce Motion** toggle on a device (hook + fallbacks wired; Dynamic Type and
  contrast WERE scriptable and verified via `simctl`).
- A native rebuild is recommended before exercising the camera/photo screens (a
  prior stale-binary `ExpoCamera/ExpoImage` log note, unrelated to these passes).

Monochrome identity intact, light-only throughout, custom Liquid-Glass nav chrome
preserved. **Series complete.**

