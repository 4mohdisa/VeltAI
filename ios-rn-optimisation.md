# iOS React Native Optimisation Checklist

> A consolidated reference for performance, state management, and best practices for an iOS-only React Native app.

---

## 1. Performance Budgets (Set These First)

Before optimising anything, define hard targets measured on **real devices in Release mode**.

| Metric | Target |
|---|---|
| Cold start → first interaction | p50 < 2.0s, p90 < 3.0s |
| Warm resume | p50 < 1.0s, p90 < 1.5s |
| JS thread per frame | < 8ms routine, < 16.67ms spike (60Hz) |
| UI hitch rate | ≤ 10ms/s on critical screens |
| Memory | No upward drift across repeated navigation loops |
| App size delta | Flag any release build increase > 2–5% |

> **Reference:** [React Native Performance Overview](https://reactnative.dev/docs/performance) · [Apple Hitch Rate Guidance](https://developer.apple.com/documentation/xcode/analyzing-the-performance-of-your-shipping-app)

---

## 2. Engine & Architecture

### 2.1 Hermes (Default — Keep It)
- Hermes V1 is the default from RN 0.84+; keep it enabled unless you have a **measured** regression.
- Precompiled iOS binaries are on by default in 0.84+ — do not disable without a concrete reason.
- JSC is community-maintained from RN 0.81+ and no longer the core default; only fall back to it if Hermes causes a proven blocker.

```bash
# Opt out of precompiled RN Core only if building from source
RCT_USE_PREBUILT_RNCORE=0 bundle exec pod install
```

> **Reference:** [React Native Hermes Guide](https://reactnative.dev/docs/hermes) · [RN 0.84 Release Notes](https://reactnative.dev/blog/2024/04/22/release-0.74)

### 2.2 New Architecture
- Removes the async bridge; prefer JSI-based direct interop and lazy TurboModule creation.
- Shift focus from "avoid bridge calls" to "keep startup dependency graphs small and component trees stable."
- Some teams report animation regressions after migrating — validate on release builds on real iPhones.

> **Reference:** [New Architecture Introduction](https://reactnative.dev/docs/the-new-architecture/landing-page)

---

## 3. Startup Optimisation

### 3.1 Reduce First-Screen Import Graph
- Enable `inlineRequires` in Metro to defer module evaluation until first use.
- Lazy-load cold screens and rarely-used feature modules out of the initial import graph.
- Do **not** use RAM bundles with Hermes — Hermes bytecode already memory-maps efficiently.

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    getTransformOptions: async () => ({
      transform: { inlineRequires: true },
    }),
  },
});
```

> **Reference:** [React Native JS Loading](https://reactnative.dev/docs/ram-bundles-inline-requires)

### 3.2 Reduce Native Launch Work
- Minimise embedded third-party dynamic frameworks — each one adds dyld load time before your code runs.
- Remove or defer Objective-C `+load` methods and C++ static constructors.
- On Xcode 15+, use **mergeable dynamic libraries** to preserve debug ergonomics while improving release launch time.
- Prefer **static linking** in CocoaPods where possible to reduce the number of dynamic binaries at launch.

> **Reference:** [Apple App Launch Time](https://developer.apple.com/documentation/xcode/improving-your-app-s-performance) · [CocoaPods Static Libraries](https://guides.cocoapods.org/syntax/podspec.html#static_framework)

### 3.3 Use Signposts for Custom Instrumentation

```swift
import os

let log = OSLog(subsystem: "com.example.app", category: "performance")

func measureHomeBootstrap() {
    os_signpost(.begin, log: log, name: "HomeBootstrap")
    // hydrate view models, prepare first screen
    os_signpost(.end, log: log, name: "HomeBootstrap")
}
```

> **Reference:** [Apple OSSignpost](https://developer.apple.com/documentation/os/logging/recording_performance_data)

---

## 4. Rendering & React Architecture

### 4.1 Reduce Unnecessary Re-renders
- Apply `React.memo`, `useMemo`, and `useCallback` **only where you have measured a render problem** — not as blanket defaults.
- Avoid creating new objects in render paths (inline object/array literals in JSX props cause re-renders on every pass).
- Avoid broad context updates that re-render large subtrees; split context by domain.

### 4.2 Stable Selectors with Zustand / Redux
- Use fine-grained selectors returning primitives over object selectors that produce new references each render.
- With Zustand, use selector equality (`shallow`) to prevent unnecessary re-renders.
- With Redux, use `createSelector` (Reselect) for memoised derived state.

```ts
// Zustand — prefer stable primitive selectors
const count = useStore((s) => s.count);              // ✅ stable
const obj   = useStore((s) => ({ count: s.count })); // ❌ new object every render

// Zustand with shallow equality for object slices
import { useShallow } from 'zustand/react/shallow';
const { count, name } = useStore(useShallow((s) => ({ count: s.count, name: s.name })));
```

> **Reference:** [Zustand Preventing Re-renders](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow) · [Redux Reselect](https://redux-toolkit.js.org/api/createSelector)

### 4.3 Component Architecture Best Practices
- Co-locate state close to where it's consumed; lift only when genuinely shared.
- Separate data-fetching containers from pure presentational components.
- Use `React.lazy` + `Suspense` for heavy, non-critical screen sections.
- Avoid anonymous functions in `renderItem` of lists — extract and memoize.

---

## 5. List Performance

### 5.1 FlatList Tuning (Start Here Before Switching Libraries)

```tsx
<FlatList
  data={items}
  renderItem={renderItem}            // memoised with useCallback
  keyExtractor={(item) => item.id}
  initialNumToRender={8}
  maxToRenderPerBatch={8}
  updateCellsBatchingPeriod={40}
  windowSize={9}
  getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
/>
```

- Memoise `renderItem` with `useCallback` and cell component with `memo`.
- Add `getItemLayout` wherever item height is fixed or predictable — removes layout measurement overhead.
- Avoid `removeClippedSubviews` on iOS if you use transforms or absolute positioning — it can cause missing content.

> **Reference:** [React Native FlatList Docs](https://reactnative.dev/docs/flatlist)

### 5.2 FlashList (Validate Before Adopting)
- Can outperform FlatList for long feeds due to recycling, but changes component assumptions (cells are reused, not unmounted).
- Validate on **iOS release builds** specifically — open issues exist around variable-height items on iOS.
- Run comparisons with real data volumes, not synthetic lists.

> **Reference:** [FlashList by Shopify](https://shopify.github.io/flash-list/)

---

## 6. Animation

### 6.1 Use Native Driver for Non-Layout Animations

```tsx
Animated.timing(opacity, {
  toValue: 1,
  duration: 180,
  useNativeDriver: true, // ✅ runs on UI thread, JS can block without killing animation
}).start();
```

- `useNativeDriver: true` moves animation serialisation to native — JS thread blocks won't kill it.
- Use `LayoutAnimation` for simple layout transitions triggered by state changes.
- Use `InteractionManager.runAfterInteractions` (or `requestIdleCallback`) to defer non-critical work until after animations complete.

### 6.2 Reanimated for Complex / Gesture-Driven Animation
- Prefer **Reanimated 3** for gesture-driven, long-lived, or layout-tied animations — it runs on the UI thread.
- Profile Reanimated in release builds, especially on **ProMotion (120Hz)** devices where frame budget is halved to ~8.3ms.

> **Reference:** [React Native Animations](https://reactnative.dev/docs/animations) · [Reanimated 3](https://docs.swmansion.com/react-native-reanimated/)

### 6.3 Reduce GPU Overdraw
- Simplify layered translucency, large shadows, and blur effects during scroll or transitions.
- Use Apple **Animation Hitches** in Instruments to identify whether bottlenecks are commit, render, GPU, or image decode.
- Use `UIKit.prepareForDisplay` to async-decode images off the main thread when image decode shows up in hitch traces.

> **Reference:** [Instruments Animation Hitches](https://developer.apple.com/documentation/xcode/detecting-frame-rate-drops-using-animation-hitches)

---

## 7. State Management Best Practices

### 7.1 Choosing the Right Tool
| Scope | Recommended Approach |
|---|---|
| Local UI state | `useState` / `useReducer` |
| Shared app state (simple) | Zustand |
| Shared app state (complex / time-travel) | Redux Toolkit |
| Server / async state | TanStack Query (React Query) |
| Form state | React Hook Form |
| Navigation state | React Navigation's own state |

### 7.2 Server State — Use TanStack Query
- Replaces manual fetch + `useState` + `useEffect` patterns for all async data.
- Built-in caching, background refetch, stale-while-revalidate, deduplication, and pagination.
- Pairs cleanly with Zustand (server state in Query, client state in Zustand).

```ts
const { data, isLoading } = useQuery({
  queryKey: ['transactions', userId],
  queryFn: () => fetchTransactions(userId),
  staleTime: 1000 * 60 * 5, // 5 min cache
});
```

> **Reference:** [TanStack Query](https://tanstack.com/query/latest)

### 7.3 Zustand Patterns
- Keep stores small and domain-scoped (one store per feature, not one global megastore).
- Derive computed values outside the store using selectors rather than storing derived state.
- Persist only what you need with `zustand/middleware/persist` + `AsyncStorage` — avoid persisting large datasets.

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      setToken: (token: string) => set({ token }),
      clear: () => set({ token: null }),
    }),
    { name: 'auth', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

### 7.4 Avoid These State Anti-Patterns
- **Storing derived state** — compute on read, not on write.
- **Prop drilling more than 2 levels** — extract to a store or context.
- **Calling setState in useEffect without cleanup** — causes memory leaks and stale closures.
- **Subscribing to an entire store** — always select the minimal slice needed.
- **Global loading/error booleans for multiple async ops** — use TanStack Query per request instead.

---

## 8. Memory Management

### 8.1 Clean Up Subscriptions and Timers

```tsx
useEffect(() => {
  const sub = EventEmitter.addListener('event', handler);
  const timer = setInterval(tick, 1000);

  return () => {
    sub.remove();
    clearInterval(timer);
  };
}, []);
```

### 8.2 Common iOS Memory Leak Sources
- Event subscriptions not removed on unmount.
- Timers and async tasks that survive component unmount.
- Image caches that never evict (FastImage, SDWebImage with no size limits).
- `URLSession` delegates or sessions never invalidated — Apple explicitly warns a `URLSession` leaks until invalidated.
- Stateful native modules that fail to run `invalidate()` cleanup.

### 8.3 Memory Testing Workflow
1. Loop the same user journey (navigate in, navigate out, repeat ×10).
2. Watch the memory gauge in Xcode.
3. Switch to **Allocations** to find growing object categories.
4. Open **Memory Graph** to trace reference chains and identify retain cycles.

> **Reference:** [Instruments Memory Profiling](https://developer.apple.com/documentation/xcode/gathering-information-about-memory-use)

---

## 9. Assets & Images

| Asset Type | Recommended Format |
|---|---|
| Product photos / large remote imagery | HEIF or JPEG, server-resized to display size |
| Icons with alpha / small UI raster art | PNG |
| Simple vector icons shipped in-app | PDF in asset catalog |
| Large optional media packs | Background Assets (replaces ODR) |

- **Serve images at display size** — avoid scaling large images down on-device at scroll time.
- **Cache aggressively** for repeated views (FastImage or SDWebImage with explicit cache config).
- **Avoid decoding during visible scrolling** — use `prepareForDisplay` to decode asynchronously.
- Use asset catalogs consistently; they cooperate with App Thinning and Xcode compression.

> **Reference:** [Apple Asset Catalogs](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/) · [Apple App Size Reduction](https://developer.apple.com/documentation/xcode/reducing-your-app-s-size)

---

## 10. Networking & Caching

- Use `URLCache` + request-level `CachePolicy` for cacheable GET endpoints — avoid re-fetching stable data.
- Page long feeds; avoid loading unbounded lists on first screen.
- Don't block first useful paint on non-critical network work — hydrate above-the-fold content first.
- For background sync: use `BGAppRefreshTask` (short refresh) or `URLSessionConfiguration.background(withIdentifier:)` (large transfers) — the system handles failures and battery impact.

> **Reference:** [Apple URL Loading System](https://developer.apple.com/documentation/foundation/url_loading_system) · [Background Tasks](https://developer.apple.com/documentation/backgroundtasks)

---

## 11. Build Configuration

- **Release optimisation:** Keep at `Fastest, Smallest [-Os]`; benchmark before switching to `-Oz`.
- **Dead code stripping:** Confirm `DEAD_CODE_STRIPPING = YES` in release scheme.
- **Symbol stripping:** `STRIP_INSTALLED_PRODUCT`, `STRIP_STYLE`, `STRIP_SWIFT_SYMBOLS` — all enabled for deployment.
- **Bitcode:** Deprecated — treat any existing bitcode config as legacy cleanup.
- **App Thinning Size Report:** Generate for every release candidate; track thinned variants, not the universal IPA.

```bash
xcodebuild -exportArchive \
  -archivePath iOSApp.xcarchive \
  -exportPath Release/MyApp \
  -exportOptionsPlist OptionsPlist.plist
```

> **Reference:** [Apple Build Settings Reference](https://developer.apple.com/documentation/xcode/build-settings-reference) · [App Thinning](https://help.apple.com/xcode/mac/current/#/devbbdc5ce4f)

---

## 12. Profiling Workflow

**Always profile on a real iPhone in Release mode** — dev mode and Simulator produce misleading results.

```bash
# Run in Release for profiling
npm run ios -- --mode Release

# Export Hermes sampling profile
npx react-native profile-hermes ./profiles
```

| Tool | Use For |
|---|---|
| **Xcode Organizer** | Field regressions: launch time, hang rate, hitch rate, memory, battery |
| **Instruments — Time Profiler + App Life Cycle** | Slow startup, hot call stacks, main thread cost |
| **Instruments — Animation Hitches** | Scroll jank, dropped frames, commit/render/GPU breakdown |
| **Instruments — Allocations + Memory Graph** | Object growth over time, retain cycles |
| **Instruments — Energy Log** | Battery drain, thermal pressure |
| **Hermes Sampling Profiler** | JS hot paths, functions blocking JS thread |
| **React Profiler** | Component-level re-render cost and frequency |
| **Flipper** | Dev-time inspection: layout, network, images, SQLite logs |

> **Reference:** [Instruments Documentation](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/) · [React Native Profiling](https://reactnative.dev/docs/profiling)

---

## 13. CI Performance Guards

Add these four test gates to your iOS pipeline:

1. **Launch metric test** — `XCTApplicationLaunchMetric` per critical start path.
2. **Hitch or signpost test** — for main feed or primary navigation flow.
3. **Memory regression test** — `XCTMemoryMetric` for repeated navigation into heavy screens.
4. **Size gate** — archive and check thinned variants on every build.

```swift
func testLaunchPerformance() {
    measure(metrics: [XCTApplicationLaunchMetric()]) {
        XCUIApplication().launch()
    }
}
```

> **Reference:** [XCTest Performance Metrics](https://developer.apple.com/documentation/xctest/performance_tests)

---

## 14. Production Monitoring

| Tool | Strongest Signal |
|---|---|
| **Sentry** | App starts, mobile vitals, release-over-release regressions |
| **Firebase Performance** | Automatic app start, screen render, HTTP traces |
| **New Relic** | Distributed tracing, session replay, network visibility |
| **Xcode Organizer + MetricKit** | Launch time, hitch rate, memory, battery for shipped builds |

> **Reference:** [Sentry React Native](https://docs.sentry.io/platforms/react-native/) · [Firebase Performance](https://firebase.google.com/docs/perf-mon) · [MetricKit](https://developer.apple.com/documentation/metrickit)

---

## 15. Prioritised Action Order

| Priority | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Profile only on real iPhone in Release | Low | Very High |
| 2 | Enable `inlineRequires`, lazy-load cold screens | Low–Medium | High |
| 3 | Reduce first-screen re-renders and list cell churn | Medium | Very High |
| 4 | Resize, compress, and cache images properly | Medium | High |
| 5 | Remove unnecessary dynamic frameworks + static initialisers | Medium | High |
| 6 | Move animations off the JS thread | Medium–High | High |
| 7 | Adopt fine-grained selectors and stable state slices | Medium | High |
| 8 | Add CI launch, memory, hitch, and size guards | Medium | High (long-term) |
| 9 | Migrate problematic native modules to New Architecture | High | Medium–High |
| 10 | Evaluate FlashList after measurement confirms FlatList is the bottleneck | Medium–High | Variable |

---

*Sources: [React Native Performance Docs](https://reactnative.dev/docs/performance) · [Apple Developer Performance](https://developer.apple.com/performance/) · [Hermes Engine](https://hermesengine.dev/) · [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/) · [Reanimated 3](https://docs.swmansion.com/react-native-reanimated/) · [FlashList](https://shopify.github.io/flash-list/)*
