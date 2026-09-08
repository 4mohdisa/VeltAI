# Architecture pass report — items 1–6

Date: 2026-09-08. Branch: `main`, committed (not left on a branch).
Scope: the six architecture items the owner approved from the style pass's
NEEDS ARCHITECTURE DECISION list. **Item 7 (3D muscle body) was excluded and not
started.** The 23 parked screens were not touched.

| | Suites | Tests | tsc | eslint |
|---|---|---|---|---|
| **Before** | 38 | 564 | 0 errors | 0 errors, 35 warnings |
| **After** | 43 | 678 | 0 errors | 0 errors, 35 warnings |

114 tests added. No test was deleted or weakened. One test-infrastructure fix is
described under item 1.

---

## 1. Floating tab bar + Profile off the tab bar — `95443e8`

**Structural change.** `NativeTabs` → the JS `Tabs` navigator with a custom
`tabBar`. `(tabs)/profile.tsx` → `profile/index.tsx` on the root stack.

`NativeTabs` renders the system capsule and cannot host a JS-drawn bar, so the
design's floating pill required the JS navigator. What that costs, explicitly:
the free iOS 26 Liquid Glass capsule, minimize-on-scroll, automatic scroll-content
insets, and the built-in press contract.

- `LumeTabBar` — glass pill (Summary / Food / Gym) plus a separate 62pt black "+".
  The glass ladder is not duplicated: `GlassButtons` now exports `GlassSurface`,
  so the Liquid-Glass / BlurView / Reduce-Transparency branches live in one place.
- `AddMenu` — the "+" popover, routing to the sheets those actions already had.
  Cross-fades with no scale or translation under Reduce Motion.
- `TAB_BAR_CLEARANCE(insets)` replaces the inset NativeTabs gave us; all three tab
  screens pad by it.
- Profile had to *move out of the folder*: `Tabs` auto-injects every file under
  `(tabs)/` as a route, so `href: null` alone would not have been enough.

**Behaviour moved:** the Food FAB was removed. It opened `/food/add` — exactly
where the new "+" menu's "Log food" row goes — and the two occupied the same
corner. One control, same destination, nothing lost.

**Tests added (22).** A render suite mounts the real bar and presses it: `tabPress`
is emitted with `canPreventDefault`; a screen that prevents the default is not
navigated over; pressing the focused tab emits but does not re-navigate; long
press is emitted; each menu row routes where the design says. A node suite pins
that Profile is not a tab route, that the bar draws an explicit allow-list rather
than mapping auto-injected routes, and that every tab screen clears the bar.

**Test infrastructure deliberately fixed:** the render harness mocked
`@/lib/haptics` with an `impact` member the module does not export, and omitted
the three `impact*` members it does. A partial mock makes tests fail for reasons
unrelated to what they check. The mock now mirrors the real surface.

## 2. Four Summary detail views — `a65af30`

**Structural change.** Two new routes: `dashboard/week.tsx`, `dashboard/training.tsx`.

**Naming interpretation, stated because it differs from the brief:** the brief
named the missing pair "training detail, macros detail", but
`dashboard/nutrition.tsx` already *is* the macros detail. Building a second one
would have duplicated it, so the two genuinely missing views — **week** and
**training** — were built, and energy and nutrition were brought onto the same
layout. Four views, one pattern.

**Where every number comes from:** `useEnergyRange()` makes two
`api.energy.getWeek(end)` calls seven days apart (via `Promise.allSettled`, so one
failed window still shows the other's days) for fourteen real server days.
`useGymRange()` uses the `{from,to}` parameters `api.gym.listSessions` already
accepts. `minutesByDate` distinguishes three states that look alike: no session is
a real zero, a session logged without a duration is a gap, otherwise it sums.

**Not built, no source:** Steps and its series, the 2,400 kcal burn target, "of 5
sessions". A day the server could not compute (`net_balance` /
`calories_out_total` null) draws a gap and an em dash — `burnOf`/`netOf` exist so
no call site can `?? 0` past it.

**Tests added (40).** Route shape, plus a grep of the four sources (comments
stripped, because prose about a number is not a rendered number) for a literal
digit beside kcal/kJ/steps/min/sessions/g — which caught two real hits on its
first run — plus the pure date helpers across month, year and leap boundaries.

## 3. Date-aware food log — `d9da1e1`

**The highest-risk item: a real data-flow change.**

- The store is keyed by ISO date (`byDate`), tracks the day on screen
  (`selectedDate`), and keeps `meals` as a *mirror* of the selected day written by
  one `commit()` helper. Keeping `meals` was deliberate: dozens of call sites and
  several tests read it meaning "the day on screen", and with the default
  selection it means exactly what it always did.
- Item mutations address a row by id across **every cached day**. A scan started
  on Tuesday must still resolve onto Tuesday after the user swipes to Wednesday;
  scoping to the visible day would silently drop it.
- `hydrateFoodLog(date?)` and `useFoodLog(date?)` default to the selected day. The
  endpoint takes one exact date and no range, so a day is the smallest unit.
- `logInputFromItem` now **requires** a date instead of computing `todayISO()`
  inside itself, and `logMeal` threads one through. Every direct-API food write
  (quick add, label scan, saved meals, recipes, both scan paths) moved from
  `todayISO()` to `selectedFoodDate()`.

**Bug fixed on the way:** the offline queue replays the body it captured. With the
date computed inside the mapper, a write queued on Monday and flushed on Tuesday
landed on **Tuesday**. It now lands on Monday, where it happened.

**UI:** a `WeekStrip` above the log — seven day chips, a dot under any day with
food logged, previous/next week, future days inert. Dots come from
`useLoggedDays`, grouped from the user's own rows; a failed call draws **no** dots,
because a dot is a claim that a day has a log.

**Tests added (29).** Wrong-day writes, a scan resolving onto a day the user left,
one day's totals leaking into another, `reset` missing a cached day, the wire body
carrying the logged day, and the timezone traps in the date helpers (`fromIso`
avoids UTC parsing; `addMonths` clamps Jan 31 to Feb 28 rather than overflowing
into March).

**Tests deliberately updated: none.** Every pre-existing suite — scan seam,
production readiness, no-fabricated-data, reset registry — passes unchanged. That
was the design goal of keeping `meals` as a mirror, and it is the strongest
evidence the refactor preserved behaviour.

## 4. One food-detail sheet — `d3ffe78`, corrected by `97877cc`

**Structural change.** `food/serving.tsx`, `food/barcode-confirm.tsx`,
`food/[meal].tsx` and `FoodItemEditSheet` → one `/food/detail` route with five
modes (search, barcode, saved, logged, review).

The capability inventory was compiled by reading all four *before* any code moved.
Everything survived: the fixed 50/100/150/200 serving options for a search hit and
the product's own options for a barcode one; the async lookup and its loading
state; the "Product not found" recovery with "Scan again"; macros scaled from
per-100g values with an override that resets when the serving changes; per-item
"save to my foods"; delete behind an Alert with warning-then-heavy haptics; every
field on decimal-pad coerced to a non-negative integer with a blank name falling
back.

A fifth mode was added rather than flattened: a scan row under review is
**rename-only**, because the review card re-scales its own energy from the
estimate and an editable macro field there would be scaled twice.

The subject travels in a small store, not route params — a food name and its
macros are personal data, and this repo does not put that in a query string.

### The one thing that went wrong, and how it was fixed

The item 4 commit justified dropping the meal-level "Delete meal" partly on the
claim that nothing routed to `/food/[meal]`. **That claim was wrong.**
`dashboard/nutrition.tsx:110` pushed it as `router.push(\`/food/${meal.id}\`)`, and
the caller grep missed it because it is a template literal.

So a live capability had been dropped. It is restored in `97877cc` as a long press
on the food log's meal header, behind the same Alert confirmation and haptics.
The long press is a compromise: the design gives that row exactly one control, so
a second visible one would be undesigned chrome, but a long press is
undiscoverable without the accessibility hint that now announces it. **Flagged for
a human** — swipe-to-delete on the header or an overflow menu is probably right,
and that is a design call.

Also note: the nutrition meal row now pushes the food tab rather than a per-meal
screen. Its rows and their editing live there, so nothing else went with the route.

**Tests added (27).** The four old files are absent; no source imports
`FoodItemEditSheet` or navigates to the dead routes; each call site opens the new
one through the store and never via params; and the sheet's source still contains
the Scan-again path, save-to-my-foods, and the Alert+haptics delete.

## 5. Two new routes — `0f5dea9`

- **`/food/calendar`** — a month day-picker over the item 3 store. Dots come from
  the user's own logged days; a failed fetch draws none. Future days are inert.
  "Jump to today" and month paging; the week strip's month label is the way in.
- **`/gym/muscles`** — layout and routing only, as instructed. It renders the real
  `muscle_volume_map` from `useGymPatterns`, sorted strongest-first with a stable
  tiebreak, and is labelled **"Last 30 days"** — the server's own patterns window,
  **not** the design's "Last 7 days". Relabelling it 7 would be a lie about the
  numbers; slicing a fake 7-day window out of a 30-day aggregate would be worse.
  No front/back split and no per-muscle exercise lists, because no response
  carries them. The design's hint promises drag-to-spin and tap-to-zoom; nothing
  here spins, so the copy explains what volume means instead.

Both verified running on the simulator: each pushes with the floating glass back
control, its kicker and large title, and its honest empty state.

## 6. Profile root merged with the settings list — `36be0d6`

**Structural change.** `profile/settings.tsx` deleted; its contents merged into
`profile/index.tsx` (on its new root-stack location from item 1).

Consolidation, not removal: every group, row, label, handler and `t()` call site
survives — verified by diffing the rows out of both files, which match exactly.
That includes Restore Purchases with its double-tap guard (a second StoreKit
restore races the first and can show "Subscription restored" followed by "No
purchases to restore"), Sign out, Delete my account, and the legal links
`legalParity` pins.

---

## Hard constraints — all held

- **No fabricated data.** Every value traces to a store or API. Where the design
  shows something with no source, the element is not built. The new routes are
  honest about their empty states, and item 2's tests actively grep for invented
  numbers.
- **Auth / RLS / entitlement gate** untouched.
- **Confidence bands and the "Why?" panel** still derive from real server values;
  `ScanReviewCard`'s band, score and factors were rewired, never resynthesized.
- **Debug-capture gating** untouched.
- **`productName.test.ts`** passes; no `veltai`/`lumo` string introduced.
- **Reduce Motion**: the two new animations (the "+" rotation and the menu
  entrance) are gated; no springs.
- **Item 7 not started.** The 23 parked screens not touched.

## ⚠️ UNVERIFIABLE without a physical device

- **Liquid Glass on the new tab bar.** `expo-glass-effect` falls back to
  `BlurView` in the simulator, so the real iOS 26 material on the pill is
  unconfirmed. The bar renders and is legible in the fallback.
- **The "+" menu's open/close animation and the 45° glyph rotation.** Simulator
  input was declined this session, so the menu could not be opened by hand; its
  behaviour is covered by render tests that mount the bar and press it, but the
  motion itself was not seen.
- **Reduce Motion / Reduce Transparency branches** on the new bar and menu.
- **Dynamic Type at accessibility sizes** on the new week strip, calendar grid and
  detail sheet.
- **Haptics** on the new controls.
- **The tab bar on a device without a home indicator.** `tabBarBottomOffset`
  handles `insets.bottom === 0` and there is a unit test for it, but only the
  iPhone 17 Pro simulator was exercised.

## Things that surfaced and need a human call

1. **Discoverability of the restored meal-wide delete** (item 4). A long press
   preserves the capability but not its findability.
2. **~200 lines of chart chrome duplicated** across the four Summary detail
   routes. Each copy carries a `ponytail:` comment naming
   `src/components/display/DetailChart.tsx` as the extraction target.
3. **`useLoggedDays()` fetches the whole food-log history unpaginated** to draw
   the dots. Fine at a year of logging; the fix is a `/api/food/days` endpoint,
   which is a backend change and out of scope.
4. **Writes now target the day on screen.** Logging while browsing a past day
   lands on that day. That is what "an explicit target date" means, but it is a
   product decision worth confirming.
5. **`dashboard/nutrition.tsx`'s meal rows now push the food tab** rather than a
   per-meal screen, a side effect of item 4.

## Commits

```
95443e8  feat(nav): the design's floating tab bar, and Profile off the tabs
a65af30  feat(summary): four detail views on one layout
d9da1e1  feat(food): the log is date-aware, and writes name the day they belong to
d3ffe78  feat(food): one detail sheet instead of four
0f5dea9  feat(routes): the month day-picker and the muscle-focus view
36be0d6  feat(profile): one Profile screen instead of a root plus a settings list
97877cc  fix(food): restore the meal-wide delete item 4 dropped
```
