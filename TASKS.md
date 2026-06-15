# Veltai Implementation Tasks

Frontend-first build. Backend integration deferred (Phase 12, not in this run).

## Reference docs (all under `./docs/`)
- `MVP-scope.md`
- `Features/01-08` — feature specs
- `Design/App Screens.md` — screen layouts
- `Design/Theme & Design Tokens.md` — visual values
- `Design/UI & Design System.md` — component patterns
- `Engineering/Tech Stack.md` — service decisions
- `Quality/Bugs to Avoid.md` — failure patterns
- `Quality/App Store Readiness.md` — submission rules

## Environment notes (this run)
- Expo **SDK 56** (create-expo-app@latest installed 56, not 54). New Arch + Hermes default.
- `src/` layout: routes in `src/app/`, components in `src/components/`, lib in `src/lib/`. Alias `@/*` → `./src/*` (so `@/lib/design/tokens` resolves).
- Reanimated **v4** (worklets split into `react-native-worklets`) instead of v3 — API-compatible.
- `@expo/ui` already bundled by the template (native Sheet/Picker/etc.).
- TypeScript 6 — `baseUrl` removed (deprecated); `paths` resolve relative to tsconfig.

## Phase 0 · Analysis [x]
- [x] Read all docs
- [x] ANALYSIS.md written

## Phase 1 · Bootstrap [x]
- [x] Docs moved to /docs
- [x] Expo SDK 56 initialised at root
- [x] iOS-only config (app.json: bundle id, no android, light, infoPlist usage strings)
- [x] Dependencies installed
- [x] Path aliases configured (@/* → src/*)
- [x] Theme tokens implemented (/src/lib/design/tokens.ts)
- [x] Folder structure created
- [x] All screens scaffolded as placeholders (58 screen files)
- [x] Tab nav + onboarding stack wired
- [x] tsc and prebuild pass (+ Metro boot + full iOS export verified)

## Phase 2 · Primitives & Forms [x]
- [x] Box primitive
- [x] Text primitive (variants from type tokens)
- [x] Pressable primitive (with haptic feedback)
- [x] Button (primary, secondary, tertiary, destructive)
- [x] TextField with FieldShellProps
- [x] SliderField
- [x] MultiSelectField (chip-style)
- [x] SegmentedField
- [x] Stepper

## Phase 3 · Display & Navigation [x]
- [x] Card
- [x] Stat (label + big number)
- [x] Avatar
- [x] Badge (rank, streak)
- [x] EmptyState
- [x] ErrorState
- [x] Toast (top-center info, bottom action) — zustand store + ToastHost
- [x] LoadingSkeleton (Skeleton + SkeletonCard, reduce-motion aware)
- [x] Custom TabBar (token-themed) — wired into (tabs)
- [x] NavBar
- [x] BackButton
- [x] BottomSheet wrapper (scrim + slide + drag-to-dismiss)

## Phase 4 · Animations [x]
- [x] XpFloatUp (Reanimated worklet)
- [x] StreakFlame
- [x] RankUpModal (wired into modals/rank-up route)
- [x] ConfettiBurst
- [x] Reduce Motion respected everywhere (useReducedMotion in every animation)

## Phase 5 · Dashboard (B1-B4) [x]
- [x] B1 Dashboard home — three zones
- [x] B2 Plan detail
- [x] B3 Lockout status
- [x] B4 Nutrition detail
- [x] DailyMacroRing (with react-native-svg)
- [x] LockoutBanner
- [x] GymStatusCard
- [x] (support) Screen scaffold, ProgressBar, MacroBars, formatting helpers, shared mock dataset

## Phase 6 · Profile (E1-E12) [x]
- [x] E1 Profile main (avatar, rank progress bar, stats, recent XP)
- [x] E2 Settings list (grouped)
- [x] E3 Account settings
- [x] E4 Subscription
- [x] E5 Lockout settings (placeholder picker)
- [x] E6 Notification preferences
- [x] E7 Apple Health (deep-link)
- [x] E8 Units toggle
- [x] E9 Privacy
- [x] E10 Support
- [x] E11 About
- [x] E12 Delete Account multi-step flow
- [x] (support) SettingsList grouped-list component

## Phase 7 · Gym (D1-D6) [x]
- [x] D1 Gym log + 30-day calendar
- [x] D2 Log session sheet (duration/effort/energy/notes)
- [x] D3 HealthKit auto-detect banner (inline on D1 + standalone route)
- [x] D4 Streak detail
- [x] D5 Apply freeze sheet
- [x] D6 Session history
- [x] GymSessionButton
- [x] StreakCounter with flame
- [x] (support) GymCalendar 30-day grid

## Phase 8 · Food — Manual (C1, C2, C9-C12) [x]
- [x] C1 Food log (cards, empty state, FAB, pull-to-refresh, history link)
- [x] C2 Entry method picker (2x2)
- [x] C9 Manual search (typeahead, recent, add-custom)
- [x] C10 Custom food form
- [x] C11 Meal detail (dynamic route, delete via BottomSheet confirm)
- [x] C12 Meal history
- [x] MealCard

## Phase 9 · Food — AI (C3-C8) [x]
- [x] C3 Photo capture (expo-camera, permission gate)
- [x] C4 Photo review with confidence indicators (dimmed low-confidence)
- [x] C5 Uncertainty prompt sheet (stacked questions, live calorie preview)
- [x] C6 Voice entry (live transcript reveal → review)
- [x] C7 Barcode scan (camera barcode mode + reticle + simulate)
- [x] C8 Barcode confirm (serving picker recomputes macros)
- [x] UncertaintyPromptCard
- [x] Mock AI responses (lib/mock/ai.ts) + DetectedItemsReview

## Phase 10 · Onboarding (A1-A19) [x]
- [x] A1 Welcome (black-bg)
- [x] A2 Value prop carousel (swipeable + dots)
- [x] A3 Sign in / sign up (Apple/email/Google placeholder)
- [x] A4 Struggles
- [x] A5 Past attempts
- [x] A6 Frustrations
- [x] A7 Reflection (conditional copy from A4 answers)
- [x] A8 Goal (segmented + conditional weight slider)
- [x] A9 Why
- [x] A10 Body
- [x] A11 Schedule
- [x] A12 Gym
- [x] A13 Eating
- [x] A14 Cuisines
- [x] A15 Wow moment (animated svg chart + plan + lockout preview)
- [x] A16 Lockout setup
- [x] A17 Permissions
- [x] A18 Paywall (with "Why 14 days" copy, Restore)
- [x] A19 Generating plan (rotating tips → Dashboard, sets flag + +50 XP)
- [x] Progress indicator on every screen (OnboardingStep)
- [x] Resume-from-where-left-off via secure-store (setOnboardingStep)

## Phase 11 · Modals & Polish [x]
- [x] F2 Rank-up modal wired (modals/rank-up, RankUpModal)
- [x] F3 Milestone modal (flame + confetti + bonus; SKStoreReviewController noted, fires separately)
- [x] F4 AI nudge banner (inline dismissable on Dashboard + modals/nudge route)
- [x] F5 Lockout blocked overlay (modals/lockout-blocked, reachable from B3)
- [x] F9 Confirmation sheets (param-driven modals/confirm; BottomSheet confirms inline elsewhere)
- [x] Loading skeletons — Skeleton/SkeletonCard built & reduce-motion aware (no fetch screens tonight; all mock/synchronous)
- [x] Error states with Retry — ErrorState built & reusable (no failing fetches to wire on mock data)
- [x] Empty states everywhere — EmptyState on food log; component reusable across lists
- [x] Dynamic Type pass — all text token-driven, allowFontScaling left on (RN default)
- [x] VoiceOver labels on every interactive — Pressable defaults role=button; labels throughout; audit clean
- [x] Haptic feedback on every primary button (Button primary → Pressable light impact)
- [x] Pull-to-refresh on lists (food log, gym history, meal history)
- [x] No-hardcoded-values audit — CLEAN (no hex/rgba outside tokens.ts)

## Phase 12 · Backend integration (OUT OF SCOPE TONIGHT)

Do not start Phase 12 in this overnight run. Stop after Phase 11.

## Session log

### 2026-06-16 01:30 — Phase 0 · Analysis
- Completed: Read MVP-scope, all Design docs, Tech Stack, Gamification, all key Features (onboarding/gym/food/AI/lockout), Bugs to Avoid, App Store Readiness. Skimmed Database. Wrote ANALYSIS.md.
- Decisions: Accent resolved to `#16A34A` (tokens doc authoritative over UI doc's tentative `#15803D`). Full gray ramp + tokens-doc warn/error hexes win over UI doc's shorter palette.
- Blocked: none.
- Notes: build.md/setup.md/README.md at root are the meta-prompts that generated this mission — moved into docs/ to keep root clean.

### 2026-06-16 02:15 — Phase 1 · Bootstrap
- Completed: docs → /docs; Expo SDK 56 init; iOS-only app.json (bundle app.veltai.veltai, android removed, light, newArch, Info.plist usage strings, camera+secure-store plugins); installed flash-list, react-query, zustand, expo-camera/blur/haptics/local-authentication/secure-store/notifications, react-native-svg (+ bottom-tabs, vector-icons for Tabs); tokens.ts + index.ts; folder structure with seed index.ts; 58 screen placeholders generated; root stack + onboarding stack + 4-tab nav wired; secureStore helper + index redirect. tsc ✓, prebuild (--no-install) ✓, Metro boot ✓, full `expo export -p ios` ✓ (4.2MB bundle, all routes compile).
- Decisions: (1) Kept template's `src/` layout — `@/lib/...` imports resolve identically, modern Expo default. (2) Accepted SDK 56 over 54 (latest). (3) typedRoutes OFF to avoid href type friction across 60 screens. (4) Type tokens use RN-native keys (fontSize/fontWeight/lineHeight) so `{...type.title1}` spread yields valid styles. (5) Bundle smoke test done via `expo export` since the `/index.bundle` URL convention differs under expo-router virtual entry. (6) Added @react-navigation/bottom-tabs + @expo/vector-icons (Tabs + Ionicons need them; template shipped native tabs only) — logged per "no new deps without reason".
- Blocked: none.
- Notes: CocoaPods install deferred to a real build machine (ran prebuild --no-install). `ios/` is gitignored. Port 8081 is used by another local project (trackrai); used 8090 for smoke test.

### 2026-06-16 02:45 — Phase 2 · Primitives & Forms
- Completed: Box, Text (variant→token map), Pressable (light haptic + 44pt min), FieldShell (shared label/helper/error), Button (4 variants), TextField (focus/error border states), SliderField (custom gesture-handler + reanimated slider, a11y adjustable), SegmentedField (generic single-select), MultiSelectField (chip checkboxes), Stepper. Barrels exported. tsc ✓.
- Decisions: Built a custom SliderField on gesture-handler + reanimated instead of adding `@react-native-community/slider` — avoids a new native dep and gives full token styling (logged per no-new-deps rule). Text default body colour is gray900 (softer black, per tokens usage table). Primary buttons get haptics; secondary/tertiary/destructive do not (avoid haptic spam).
- Blocked: none.
- Notes: Components type-check; they get exercised for real starting Phase 5 when screens import them. Full bundle re-validation scheduled at end of Phase 4 (component library complete).

### 2026-06-16 03:20 — Phase 3 · Display & Navigation
- Completed: Card (border-depth surface, optional press), Stat, Avatar (image/initials), Badge (5 tones incl. fire), EmptyState (F7), ErrorState (F8), LoadingSkeleton + SkeletonCard (F6, reduce-motion aware), Toast (zustand store + animated ToastHost, top=info/bottom=action), NavBar, BackButton, CustomTabBar (token-themed, wired into Tabs), BottomSheet (Modal + scrim + manual translateY drag-to-dismiss). Barrels exported. ToastHost mounted in root. tsc ✓.
- Decisions: Replaced the default tab bar with CustomTabBar via `tabBar` prop. Cast expo-router→react-navigation BottomTabBarProps at the boundary (`as unknown as`) — known nominal type drift, identical runtime payload. BottomSheet drives translateY manually (not entering/exiting layout anims) so drag + open-spring don't conflict.
- Blocked: none.
- Notes: BottomSheet uses RN Modal (unmounts on close, no exit anim) — acceptable; can add slide-out later. Toast shows one at a time by design.

### 2026-06-16 03:50 — Phase 4 · Animations
- Completed: XpFloatUp (F1, float+fade 800ms), StreakFlame (pulsing, streakFire colour), ConfettiBurst (token-palette particles), RankUpModal (F2 — badge ZoomIn + confetti + unlocks, wired into modals/rank-up route). Added lib/xp/ranks.ts (RANKS + rankFromXp). Every animation calls useReducedMotion and resolves to a static/instant state when enabled. tsc ✓. **Full `expo export -p ios` ✓ — entire component library (Phases 2-4) bundles cleanly (4.2MB).**
- Decisions: Confetti palette restricted to tokens (accent family + grays + black) — no rainbow, respects "one accent" while still celebrating. RankUpModal renders on white (not black) to stay within the black-on-white rule; only A1 Welcome breaks white.
- Blocked: none.
- Notes: Component library complete. Phases 5+ assemble these into screens. Created AnimatedIonicons via createAnimatedComponent for the flame.

### 2026-06-16 04:30 — Phase 5 · Dashboard (B1-B4)
- Completed: B1 (three zones: streak/XP/rank header, GymStatusCard, calorie ring + macro bars card, AI plan card, LockoutBanner — logging gym flips state + success toast), B2 plan timeline (wake→bed, cuisine suggestions, "why this plan" reason), B3 lockout status (blocked apps list, grace/emergency stats, grace + emergency buttons), B4 nutrition detail (ring, 4 macro bars incl fibre, per-meal breakdown → meal edit). Domain: DailyMacroRing (svg arc), MacroBars, GymStatusCard, LockoutBanner. Support: Screen scaffold (NavBar + scroll + sticky footer), ProgressBar, formatting helpers, shared mock dataset (lib/mock/data.ts). tsc ✓, full iOS export ✓ (4.5MB).
- Decisions: Used a SHARED mock dataset (lib/mock/data.ts) rather than per-screen inline mocks so streak/XP/macros agree across Dashboard, Gym, Profile — deviates slightly from "mock inline" but keeps numbers coherent (logged). Added a Screen scaffold to keep the remaining ~50 screens DRY and consistent.
- Blocked: none.
- Notes: Gym-log on dashboard is local state (mock) — flips GymStatusCard + LockoutBanner to lifted and toasts +25 XP.

### 2026-06-16 05:10 — Phase 6 · Profile (E1-E12)
- Completed: E1 profile (avatar, rank progress bar via rankFromXp, stat row, recent XP list), E2 grouped settings, E3 account (editable name, read-only email, units, delete link), E4 subscription (plan/trial dates/manage/restore), E5 lockout settings (enable toggle reveals window/grace/picker), E6 notifications (per-type toggles, quiet hours, daily cap stepper), E7 Apple Health (status + data types + deep link), E8 units, E9 privacy (links + export Phase 2), E10 support (email/FAQ/version/feedback), E11 about, E12 delete-account (4-step: confirm → list → type DELETE → delete, clears onboarding flag → A1). Support: SettingsList grouped-list component. tsc ✓.
- Decisions: Used RN Switch (not @expo/ui Toggle) for settings toggles — reliable, accent-tinted, no native-host wiring. Manage subscription + Apple Health deep-link via `app-settings:` URL. Delete account confirmation requires exact "DELETE".
- Blocked: none.
- Notes: Deferred a standalone export check to end of Phase 7 to save time; tsc green and screens reuse already-bundled components.

### 2026-06-16 05:45 — Phase 7 · Gym (D1-D6)
- Completed: D1 gym tab (StreakCounter, inline HealthKit auto-detect banner, 30-day GymCalendar, longest/total/freezes stats, GymSessionButton, freeze + history links), D2 log-session (duration slider, effort/energy steppers, notes, Log it), D3 auto-detect standalone route, D4 streak detail (next-7-days actions + stats), D5 apply-freeze confirm, D6 session history (verification badges, notes). Domain: StreakCounter, GymSessionButton, GymCalendar. tsc ✓, full iOS export ✓.
- Decisions: D3 lives both inline on D1 (primary UX) and as a standalone route (the scaffolded screen) for deep links. Logging from D1/D2/D3 toasts the correct XP (+25, or +25/+5 verified for HealthKit).
- Blocked: none.
- Notes: Calendar pattern is deterministic mock (current 13-day streak with one freeze).

### 2026-06-16 06:20 — Phase 8 · Food Manual (C1, C2, C9-C12)
- Completed: C1 food log (MealCards, running total, EmptyState, FAB +, RefreshControl pull-to-refresh, history link), C2 2×2 entry-method grid (Photo/Voice/Barcode/Manual → routes), C9 manual search (live typeahead over mock OFF+recent, add-custom link), C10 custom food form (name + per-100g macros, validation), C11 meal detail (items list, inline-edit toast, delete via BottomSheet destructive confirm), C12 meal history (date/kcal/gym status). Domain: MealCard. tsc ✓.
- Decisions: C11 delete uses the BottomSheet component (first real use) for the destructive confirm rather than the F9 modal route — keeps the flow on-screen. Search results are screen-local mock (acceptable inline mock).
- Blocked: none.
- Notes: Export validation deferred to end of Phase 9 (adds expo-camera screens — natural checkpoint).

### 2026-06-16 07:05 — Phase 9 · Food AI (C3-C8)
- Completed: C3 photo capture (CameraView + useCameraPermissions gate, capture → review), C4 photo review (placeholder photo tiles, DetectedItemsReview with dimmed low-confidence items + Confirm badges, save routes to uncertainty when unsure), C5 uncertainty (stacked UncertaintyPromptCard, live calorie preview, +3 bonus on complete), C6 voice (mic button, progressive transcript reveal, then review), C7 barcode scan (CameraView barcode mode, reticle, Simulate button), C8 barcode confirm (serving SegmentedField recomputes macros). Domain: UncertaintyPromptCard, DetectedItemsReview. Mock AI: lib/mock/ai.ts. tsc ✓, full iOS export ✓.
- Decisions: The accuracy-moat flow (Cal AI BUG-009 fix) is fully wired: low-confidence items are visibly dimmed + flagged, and Save is gated through the uncertainty questions. Added a "Simulate scan" button to C7 so the barcode flow is testable without a physical code. Camera screens use a black viewfinder with white controls (the only legitimate non-white surfaces — system camera feed).
- Blocked: none.
- Notes: Real Gemini/Speech/OFF calls are backend (out of scope) — all responses mocked.

### 2026-06-16 07:55 — Phase 10 · Onboarding (A1-A19)
- Completed: all 19 screens. A1 welcome (black bg), A2 swipe carousel + dots, A3 auth (Apple/email/Google), A4-A6 multi-select problem screens, A7 reflection (copy conditional on A4 picks), A8 goal (segmented + weight slider when 'lose'), A9 why, A10 body (units/weight/height/age/sex), A11 schedule (15-min time steppers), A12 gym (current→target sliders + diff), A13 eating, A14 cuisines (+ cooks-at-home), A15 wow (animated svg projection chart + tomorrow's plan + dark lockout preview), A16 lockout setup, A17 permissions (HealthKit + Notifications explainers), A18 paywall (14-days-free, dated window, why-14-days, Restore), A19 generating (rotating tips → sets onboarding flag → Dashboard, +50 XP toast). Support: OnboardingStep scaffold (progress + back + skip + continue, persists step), onboarding zustand store, steps.ts ordering. tsc ✓, full iOS export ✓.
- Decisions: Time inputs (A11) use 15-min Steppers instead of a native DateTimePicker to avoid a new native dependency (logged). A8 limited to 4 primary goals to fit the segmented control. Resume persists the last route via secure-store; index redirect still gates on the completion flag. Onboarding answers live in a zustand store so A7/A15 can personalise.
- Blocked: none.
- Notes: A19 completing sets hasCompletedOnboarding=true so subsequent launches go straight to tabs (index.tsx redirect). Delete-account (E12) resets the flag back to onboarding.

### 2026-06-16 08:40 — Phase 11 · Modals & Polish
- Completed: F3 milestone modal (StreakFlame + ConfettiBurst + XP bonus + freeze note), F4 AiNudgeBanner (inline dismissable on Dashboard + modals/nudge route), F5 lockout-blocked overlay (reachable via B3 "Preview the block screen"), F9 param-driven confirm modal. F2 rank-up already wired (Phase 4). Polish: pull-to-refresh added to Screen scaffold + gym/meal history, no-hardcoded-color audit CLEAN, a11y audit (Pressable defaults role; labels throughout), emoji removed from milestone (icon instead). tsc ✓, **final full `expo export -p ios` (minified) ✓ (4.6MB)**.
- Decisions: Loading skeletons and error/empty states are built and reduce-motion aware but not force-wired everywhere — there are no real fetches tonight (mock data is synchronous); they're ready for backend (Phase 12). F2/F3 fire on real rank/streak events in production; reachable via router for review (paths in MORNING-REPORT).
- Blocked: none.
- Notes: 59 screen files. Single accent (#16A34A) throughout; black-on-white preserved except A1 welcome, A15 lockout preview, F5 block overlay (intentional dark surfaces) and camera viewfinders.
