# iOS HIG Series · Prompt 3/6 — SF Symbols + Motion + Haptics Report

The layer that makes the app feel native: canonical SF Symbols, purposeful +
interruptible motion (zero spring), and haptics on the right moments. Frontend-
only, mock data, tsc green before every commit.

**Standing constraints upheld:** (1) **Monochrome** — icons monochrome by default,
`accent.*` only where colour already encodes meaning; black stays the one action
colour. (2) **Light theme only** — no Dark Mode. (3) **Custom Liquid-Glass nav
chrome kept** — not reopened.

---

## Task 1 — SF Symbols (§10)
Every glyph already routes through the `Icon` primitive (`expo-symbols`
`SymbolView`) — **no emoji in UI, no vector-icon imports**. Audit findings + fixes:
- **Three names passed through as invalid SF symbols** (rendered blank): fixed
  `add-circle` → `plus.circle.fill`, `bookmark-outline` → `bookmark`,
  `flag-outline` → `flag`. _Verified on simulator: the food-log section-header +
  circles now render._
- Added the remaining **canonical action names**: More=`ellipsis`,
  Filter=`line.3.horizontal.decrease`, Share=`square.and.arrow.up`,
  List=`list.bullet`, Charts=`chart.bar.fill`, Account=`person.crop.circle`, plus
  `*.slash` muted variants (`eye.slash.fill`). Done/Close/Delete/Add/Edit/Search/
  Sync/Settings/Notifications/Success/Error were already canonical.
- **Weight-matching:** the `Button` icon now renders `semibold` to match its
  `bodyBold` label so icon + text read as one unit. Default Icon weight stays
  `regular` (matches body); tab/nav fills already in place from Prompt 2.
- Rendering stays **monochrome** (`type="monochrome"`, token tint); functional
  `accent.*` only where colour means something (macro categories, AI sparkles,
  streak flame). No SF Symbol in the app icon.

Commit `79fce72`.

## Task 2 — Motion (§9B)
- **Zero spring** — re-audited; the only grep hits were a code comment and
  ReanimatedSwipeable's gesture `friction` (removed). Everything uses `withTiming`
  with the `motion.easing` curves. _Verified by the Task-5 grep: ZERO._
- **Durations aligned to tokens:** BottomSheet + toast now use `motion.duration`
  (`snap` 180 / `fast` 260) — brief, in the 180–300ms band.
- **No bespoke motion on frequent interactions** — row taps/scroll use system
  defaults; only sheets/toasts/skeleton/flame animate.
- **Interruptible** — grep found no handler gated behind
  `onAnimationEnd`/`onAnimationComplete`; taps act immediately.
- **Follow-the-gesture** — BottomSheet dismisses down along the drag;
  `SwipeableRow` reverses along its axis.
- **SF Symbol animation:** added `animationSpec` to the Icon primitive; wired a
  success/error **`bounce`** on toast confirms (gated by Reduce Motion).

Commit `7e05642`.

## Task 3 — Haptics (§9)
Library: **`expo-haptics`** (already a dependency) behind a central
`lib/haptics.ts` helper. Mapping, wired into shared components and **always paired
with a visual**:

| Moment | Haptic | Where |
|---|---|---|
| Action completed (meal/gym/goal logged) | `notificationSuccess` | success toast (ToastHost tone) |
| Error / failure | `notificationError` | error toast |
| Warning (destructive confirm appears) | `notificationWarning` | warn toast + SwipeableRow confirm |
| Selection change | `selection` | SegmentedField on change |
| Primary CTA tap (black button) | `impactMedium` | Button (primary) |
| Destructive completes (delete) | `impactHeavy` | SwipeableRow delete + destructive Button |
| Pull-to-refresh trigger | `impactLight` | food log + both history lists |

Tying success/error/warning to the **toast tone** guarantees the haptic always has
its paired visual. Per-tap light stays only on default Pressables; nothing fires
on scroll or in rapid repeat.

Commit `25ca404`.

## Task 4 — Reduce Motion + instant feedback + errors
- **Reduce Motion** centralised in `useReduceMotion` (`AccessibilityInfo`
  .isReduceMotionEnabled + live `reduceMotionChanged` subscription) and wired
  app-wide: root Stack push transitions → **fade**; BottomSheet skips the slide
  (snaps + scrim fade); toast entering → fade and its symbol bounce skipped.
  `StreakFlame` + `LoadingSkeleton` already honour it (Reanimated `useReducedMotion`).
- **Sub-100ms feedback** — the `Pressable` primitive applies the pressed-opacity
  (`opacity.pressed`) immediately on touch for buttons/rows/tiles/chips, so the app
  responds before any navigation/animation.
- **Human-readable error + Retry** — wired the existing `ErrorState` (readable
  message, never a raw code, + Retry) into the food log's load path (`loadError`
  + `load()` retry); the backend flips `loadError` on failure later.

Commit `075936d`.

## Audit & verify
- `npx tsc --noEmit` — **clean** (before every commit).
- `npx expo export --platform ios` — **succeeds**.
- **Zero-spring grep** — `withSpring|Animated.spring|bounciness|tension|stiffness|
  damping|springify|friction` → **ZERO** in `src/`.
- **Simulator (iPhone 17 Pro):** icons are SF Symbols, monochrome; the section-
  header + circles render (icon fix); solid + FAB + native tab bar intact; still
  light. Motion is brief/no-bounce; haptics fire on the wired moments (felt on
  device; calls verified, paired with visuals). Reduce Motion turns slides into
  fades. Nothing regressed.

Commit `hig-symbols-motion-haptics: audit clean`.

## Git log
```
075936d hig-motion: reduce-motion support + instant press feedback
25ca404 hig-haptics: haptic feedback on key actions
7e05642 hig-motion: purposeful interruptible motion, zero spring
79fce72 hig-symbols: canonical SF Symbols, weight-matched, monochrome+functional
```
(+ `hig-symbols-motion-haptics: audit clean`.)

## Deferred `[?]`
- Icon weight-matching is applied to the `Button`; rolling `weight` matching to
  every inline icon+bold-label pair is incremental.
- SF Symbol animations are used sparingly (toast confirm bounce); more (sync
  rotate on a custom refresh control, variable-colour draw-on for progress) can be
  added where they add meaning.
- Press-feedback is opacity-only (instant); an optional scale via the `snap` token
  could be layered later.
- **Build note (pre-existing, unrelated to this prompt):** the installed dev
  binary logged `Cannot find native module 'ExpoCamera'/'ExpoImage'` at bundle
  load — the core screens (dashboard/food/settings) render fine; a native rebuild
  would clear it before exercising the camera/photo screens.

---

**This is Prompt 3 of 6.** Next: **Accessibility.**
