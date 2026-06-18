# VeltAI — Frontend & State-Management Audit (read-only)

Honest map of the current state layer before backend work begins. **No code was
changed.** Scope: 57 screens in `src/app/`, 43 components in `src/components/`.
`npx tsc --noEmit` passes clean at time of audit.

---

## 1 — State management: what's actually there

**Installed libraries (`package.json`):**
- `zustand@^5.0.14` — the only app-state library actually used for stores.
- `@tanstack/react-query@^5.101.0` — installed, but **only the provider is mounted**
  (`src/app/_layout.tsx` wraps the tree in `QueryClientProvider`). **Zero `useQuery`/
  `useMutation`/`queryFn` anywhere.** It is a placeholder for the backend phase.
- `expo-secure-store@~56.0.4` — used for exactly one persisted flag (see §2).
- No `redux`, `jotai`, `recoil`, `valtio`, `swr`. **No React `createContext` anywhere.**

**Every store/context (file paths + what each holds):**

| Store | Path | Holds | Seeded from | Persisted? |
|---|---|---|---|---|
| Toast | `src/components/display/toastStore.ts` | current toast (message/tone/position) | n/a (ephemeral UI) | no |
| Settings | `src/lib/settings/store.ts` | `units`, `languageOverride`, `goalMode`, `customGoals`, `macroSplitBy` | **mock** — `seedUnits` from `mockUser.units`, `AI_GOALS` from `mockMacros.*.target` | **no** |
| Onboarding | `src/lib/onboarding/store.ts` | all onboarding answers (`OnboardingAnswers`) | hardcoded `DEFAULTS` object | **no** |

There are **no React contexts**. Cross-cutting state = these three zustand stores
+ per-screen `useState`.

**Mock vs fetch:** every store is seeded with **hardcoded/mock data**, none fetch.
- Settings: `import { mockMacros, mockUser } from '@/lib/mock/data'` →
  `AI_GOALS = { calories: mockMacros.calories.target, … }`, units from `mockUser.units`.
- Onboarding: an inline `DEFAULTS` constant (`weight: 82, height: 178, age: 28, …`).

**Server-state layer:** **none.** All "data" is static mock TS objects. React Query
is dormant. Confirmed.

**How data flows into screens (the pattern):**
- Components **import mock objects directly** from `@/lib/mock` (21 files do this).
- Some screens **copy mock into local `useState`** so in-session edits work:
  - `food.tsx` → `useState(buildSections)` built from `mockMeals` (line 68); edits
    via `setSections` (lines 101/110) stay **local** and never write back to `mockMeals`.
  - `gym.tsx` / `index.tsx` → `useState(mockStreak.gymLoggedToday)`.
  - `account.tsx` → `useState(mockUser.name)`; `saved.tsx` → `useState(mockSavedFoods)`;
    `photo-review.tsx`/`voice.tsx` → `useState(aiDetectedItems / aiVoiceItems)`.
- **No data-access abstraction** (no `useMeals()`, `useFoodLog()`, `useGymSessions()`,
  no service/repo layer). The only "hooks over state" are settings-store selectors
  `useEffectiveGoals()` and `useUnitPreferences()`.

---

## 2 — Persistence

**Only ONE thing survives an app restart:** the onboarding-completed boolean.
- `src/lib/storage/secureStore.ts` wraps `expo-secure-store`. Key
  `veltai.hasCompletedOnboarding` is written `true` on onboarding finish
  (`(onboarding)/generating.tsx`), `false` on account deletion
  (`profile/delete-account.tsx`), and read on launch to route (`app/index.tsx`).
- A second key `veltai.onboardingStep` is **written** (`OnboardingStep.tsx`) but
  **never read** — the resume-from-step feature is not wired.

**No `AsyncStorage`, no `MMKV`, no zustand `persist` middleware.** Everything else is
in-memory and resets to mock defaults on reload:

| Area | Survives reload? | Reality |
|---|---|---|
| Food log (log/edit/delete a meal) | ❌ | local `useState` rebuilt from `mockMeals` each mount |
| Settings — units / language | ❌ | settings store has no persist; back to `mockUser`/device default |
| Goals (custom calories/macros) | ❌ | settings store `customGoals` resets to `AI_GOALS` |
| Gym streak / "logged today" | ❌ | `useState(mockStreak.gymLoggedToday)`; streak number is static mock |
| Saved foods (add/unsave) | ❌ | local `useState(mockSavedFoods)` |
| Account display name / photo | ❌ | local `useState`; photo is a "coming soon" stub |
| Onboarding completed flag | ✅ | the one secure-store value |

This is expected pre-backend — documented as the reality, not a defect.

---

## 3 — The mock data layer (critical for backend)

**Location — centralized:** `src/lib/mock/` with a barrel `index.ts` re-exporting both:
- `src/lib/mock/data.ts` — `mockUser`, `mockStreak`, `mockHealth`, `mockMacros`,
  `mockMeals`, `foodCatalog`, `recentFoods`, `mockSavedFoods`, `mockPlan`,
  `mockPlanReason`, `mockGymCalendar`, `mockGymSessions`, `mockUpcomingDays`,
  `mockSubscription` (+ all the shared types: `Meal`, `FoodItem`, `SavedFood`,
  `MacroProgress`, `GymSession`, `DayStatus`, etc.).
- `src/lib/mock/ai.ts` — `aiDetectedItems`, `aiUncertaintyPrompts`, `aiVoiceItems`,
  `aiVoiceTranscript`, `CONFIDENCE_THRESHOLD`, `DetectedItem` type.

**Centralized vs scattered:** the **data definitions are well-centralized** (two
files, typed, one barrel) — easy to delete/replace. **But consumption is direct and
scattered:** 21 files `import { mock… } from '@/lib/mock'` and read it inline or copy
it into `useState`. There is **no seam** (hook/service) between UI and mock, so the
backend swap is a **per-screen wiring job**, not a one-file change. The types are
reusable as API contracts, which softens it.

**Abstraction between UI and data source:** essentially none for feature data. The
cleanest existing seams are (a) the settings store selectors and (b)
`src/lib/healthkit/index.ts`, which already hides a stub behind real-looking async
functions (`readActiveEnergyAndSteps()`, `writeNutritionToHealth()`) — a good model
for what the food/gym layers *don't* yet have.

**Per-feature data source today:**

| Feature | Data source | Notes |
|---|---|---|
| Food log (C1) | `mockMeals` → local `useState` sections | edits local-only |
| Search / manual add | `foodCatalog`, `recentFoods` (mock) | |
| Scan — photo (C4) | `aiDetectedItems` (pre-baked) in `useState` | instant, no real inference |
| Scan — voice (C6) | `aiVoiceItems` + `aiVoiceTranscript` | progressive fill (see §4) |
| Scan — barcode (C8) | `lib/food/barcode.ts` mock `lookupBarcode()` | local mock DB, no real OFF |
| Uncertainty (C5) | `aiUncertaintyPrompts` | |
| Saved foods (C13) | `mockSavedFoods` → local `useState` | |
| Gym / streak / calendar | `mockStreak`, `mockGymCalendar`, `mockGymSessions`, `mockUpcomingDays` | static |
| Goals | settings store `customGoals` / `AI_GOALS` (from `mockMacros`) | in-memory |
| Settings (units/language) | settings store (from `mockUser` / device) | in-memory |
| Dashboard | `mockMacros`, `mockStreak`, `mockPlan`, `mockUser` + effective goals | static + store |
| Nutrition detail | `mockMacros`, `mockMeals`, effective goals, healthkit stub | |
| Apple Health | `lib/healthkit` stub → `mockHealth` | `react-native-health` not installed |
| Onboarding | onboarding store (in-memory) | **answers never flow to the app** (see §5) |
| Subscription / paywall | `mockSubscription`; restore = success toast | no real IAP |

---

## 4 — Async patterns already in place

**The scan "fills in":** only the **voice** flow actually animates a fill —
`src/app/food/voice.tsx` uses `setInterval(…, 220)` to reveal the transcript word by
word (`shownWords`), then shows `aiVoiceItems`. The **photo** flow does **not** have a
"loading row that fills in": `photo-capture.tsx` does `router.replace('/food/photo-review')`
instantly and `photo-review.tsx` renders the pre-baked `aiDetectedItems` immediately
(no analyzing/skeleton state). Barcode is likewise instant. So the described
"capture → loading row fills in" is **voice-only today; photo/barcode are instant
pre-baked results.**

**Other async mocks (all `setTimeout`-driven booleans):**
- Food log first load: `setTimeout(…, 700)` → skeleton; `loadError` → `ErrorState`
  with Retry; `itemCount===0` → `EmptyState` (`(tabs)/food.tsx`).
- Saved foods / meal history: `setTimeout(…, 600)` → `SkeletonList`.
- Nutrition charts: `setTimeout(…, 600)` → `ChartCard loading` skeleton.
- Pull-to-refresh: `setTimeout(…, 700)`.
- `lib/healthkit`: `async` functions that `return mockHealth` / `return true`
  immediately (already promise-shaped).

**Loading / empty / error states wired (from the HIG passes):**
- `EmptyState`, `ErrorState` (message + Retry), `LoadingSkeleton`/`SkeletonList`,
  `ChartCard` (loading/empty slots) all exist and are used on: food log (all three),
  saved foods, search, gym history, meal history, nutrition charts.

**Will they translate to real async?** **Yes, cleanly.** They're driven by boolean
state (`loading`/`loadError`/`empty`), so swapping a `setTimeout` for a real
fetch/React-Query state is a drop-in. The one place that *won't* translate as-is is
the photo scan, which has **no** loading state to fill — that UI slot needs to be
built when real inference lands.

---

## 5 — Frontend correctness gaps

- **Placeholder / "coming soon" content:** one literal stub —
  `profile/account.tsx` "Photo picker coming soon" toast (avatar change is fake).
- **Stubbed actions that just toast (not dead-ends, but not functional):**
  `profile/subscription.tsx` "Purchases restored" success toast (no real IAP / restore);
  manage-subscription has no real flow. Notifications quiet-hours pickers work
  visually but nothing persists.
- **Navigation dead-ends:** none found that crash — buttons either navigate to a real
  route or fire a toast. All referenced food/gym/profile routes exist.
- **`TODO`/`FIXME`/`HACK`:** **none.**
- **`@ts-ignore`/`@ts-expect-error`/`eslint-disable`:** **none.**
- **Type casts:** no `as any`/`as unknown`. **9× `as never`**, all on
  `router.push(<string> as never)` (onboarding nav + `food/add.tsx` + `OnboardingStep`)
  — a workaround for `typedRoutes: false`. Minor type-safety hole: navigation target
  strings are **not statically checked**, so a bad route string compiles.
- **`npx tsc --noEmit`:** **passes clean** (no suppressed errors).
- **Real product gap — onboarding answers are discarded:** `useOnboarding` is read
  **only by onboarding screens**; nothing in the main app consumes it. After
  onboarding the dashboard shows `mockMacros`/`mockUser`, **not** the user's entered
  weight/goal/targets. The "AI recommendation" goals are `mockMacros.target`, not
  derived from onboarding input. This is the most material wiring gap for the backend
  (onboarding → user profile/goals).
- **Stale-binary (can't run on the currently installed dev build):**
  - `expo-camera`: `food/photo-capture.tsx`, `food/barcode-scan.tsx` (the camera screens).
  - `expo-image`: `components/display/Avatar.tsx` → used by `(tabs)/profile.tsx` and
    `profile/account.tsx`.
  - These error with `Cannot find native module 'ExpoCamera' / 'ExpoImage'` on the
    installed binary. The **code is fine**; it's a stale native build. A prebuilt
    `ios/` dir exists, so the fix is a native rebuild: `npx expo run:ios`
    (pod install + xcodebuild) — JS-only reloads won't clear it.

---

## 6 — Readiness verdict

### ✅ Done & solid (frontend, won't need rework)
- Design system + HIG layers: tokens/semantic aliases, Dynamic Type, safe areas, 44pt
  targets, SF Symbols, zero-spring motion, haptics, accessibility (VoiceOver/contrast/
  reflow), monochrome+glass discipline, charts — all landed and `tsc`-clean.
- Navigation shape: native tab bar, sectioned food list, inset-grouped settings,
  sheets, routes all wired and reachable.
- Reusable async-state UI: `EmptyState` / `ErrorState(retry)` / `SkeletonList` /
  `ChartCard` — ready to host real loading/empty/error.
- The mock **data model/types** (`Meal`, `FoodItem`, `SavedFood`, `DetectedItem`,
  `MacroGoals`, units canonical-storage) — usable directly as API contracts.
- The healthkit and barcode modules already sit behind async function seams.

### 🟡 Mock / temporary (expected — swap during backend)
- **All feature data** is static mock from `src/lib/mock/{data,ai}.ts`. **Centralized
  (good)** but **consumed directly with no hook/repo seam (a per-screen wiring job)**.
- **Nothing persists** except the onboarding flag — meals, goals, units, language,
  streak, saved foods all reset on reload (in-memory zustand + local `useState`).
- React Query is mounted but unused — the intended home for server state.
- Scan results are pre-baked; barcode lookup is a local mock DB; subscription/IAP and
  avatar upload are toast stubs; Apple Health is a stub returning mock.
- **Swap cleanliness: moderate.** Easy where a store/selector already exists
  (goals/units) or an async seam exists (health/barcode); more manual where screens
  read mock directly or hold local `useState` copies (food log, saved, gym, scan).

### 🔴 Actual gaps to fix (real frontend defects, not "needs backend")
1. **Onboarding → app data is not wired.** Collected answers are discarded; the app
   shows generic mock, not the user's inputs/goals. Needs a real frontend bridge
   (onboarding store → settings/user state) regardless of backend.
2. **Photo/barcode scan have no loading/analyzing state** — instant pre-baked results.
   The "fills in" UX exists only for voice; the photo slot must be built for real async.
3. **Untyped navigation (`router.push(… as never)`)** — enabling `typedRoutes` would
   catch bad route strings at compile time.
4. **Stale native binary** blocks camera + avatar screens until `npx expo run:ios`
   rebuild (code is correct; binary is behind).
5. Minor: subscription restore/manage and account photo are non-functional stubs;
   the `onboardingStep` resume value is written but never read.

---

## Readiness statement

**The frontend is genuinely ready to begin backend integration** — it's `tsc`-clean,
the UI/UX and async-state slots are finished, and the mock data is centralized and
typed for use as API contracts. **Before wiring, close two real frontend gaps:**
(1) bridge onboarding answers into app state, and (2) add a loading/analyzing state to
the photo/barcode scan; and plan for a **per-screen** data swap (introduce a thin
hooks/repo seam) since components read mock directly today. Persistence, server state,
and the stale native rebuild are expected backend-phase work, not blockers to starting.
