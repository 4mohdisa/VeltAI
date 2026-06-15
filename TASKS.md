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

## Phase 2 · Primitives & Forms
- [ ] Box primitive
- [ ] Text primitive (variants from type tokens)
- [ ] Pressable primitive (with haptic feedback)
- [ ] Button (primary, secondary, tertiary, destructive)
- [ ] TextField with FieldShellProps
- [ ] SliderField
- [ ] MultiSelectField (chip-style)
- [ ] SegmentedField
- [ ] Stepper

## Phase 3 · Display & Navigation
- [ ] Card
- [ ] Stat (label + big number)
- [ ] Avatar
- [ ] Badge (rank, streak)
- [ ] EmptyState
- [ ] ErrorState
- [ ] Toast (top-center info, bottom action)
- [ ] LoadingSkeleton
- [ ] Custom TabBar (token-themed)
- [ ] NavBar
- [ ] BackButton
- [ ] BottomSheet wrapper

## Phase 4 · Animations
- [ ] XpFloatUp (Reanimated worklet)
- [ ] StreakFlame
- [ ] RankUpModal
- [ ] ConfettiBurst
- [ ] Reduce Motion respected everywhere

## Phase 5 · Dashboard (B1-B4)
- [ ] B1 Dashboard home — three zones
- [ ] B2 Plan detail
- [ ] B3 Lockout status
- [ ] B4 Nutrition detail
- [ ] DailyMacroRing (with react-native-svg)
- [ ] LockoutBanner
- [ ] GymStatusCard

## Phase 6 · Profile (E1-E12)
- [ ] E1 Profile main
- [ ] E2 Settings list
- [ ] E3 Account settings
- [ ] E4 Subscription
- [ ] E5 Lockout settings (placeholder picker)
- [ ] E6 Notification preferences
- [ ] E7 Apple Health (deep-link)
- [ ] E8 Units toggle
- [ ] E9 Privacy
- [ ] E10 Support
- [ ] E11 About
- [ ] E12 Delete Account multi-step flow

## Phase 7 · Gym (D1-D6)
- [ ] D1 Gym log + 30-day calendar
- [ ] D2 Log session sheet
- [ ] D3 HealthKit auto-detect banner (placeholder)
- [ ] D4 Streak detail
- [ ] D5 Apply freeze sheet
- [ ] D6 Session history
- [ ] GymSessionButton
- [ ] StreakCounter with flame

## Phase 8 · Food — Manual (C1, C2, C9-C12)
- [ ] C1 Food log
- [ ] C2 Entry method picker (2x2)
- [ ] C9 Manual search
- [ ] C10 Custom food form
- [ ] C11 Meal detail (dynamic route)
- [ ] C12 Meal history
- [ ] MealCard

## Phase 9 · Food — AI (C3-C8)
- [ ] C3 Photo capture
- [ ] C4 Photo review with confidence indicators
- [ ] C5 Uncertainty prompt sheet
- [ ] C6 Voice entry
- [ ] C7 Barcode scan
- [ ] C8 Barcode confirm
- [ ] UncertaintyPromptCard
- [ ] Mock AI responses

## Phase 10 · Onboarding (A1-A19)
- [ ] A1 Welcome (black-bg)
- [ ] A2 Value prop carousel
- [ ] A3 Sign in / sign up (Clerk placeholder)
- [ ] A4 Struggles
- [ ] A5 Past attempts
- [ ] A6 Frustrations
- [ ] A7 Reflection (conditional copy)
- [ ] A8 Goal
- [ ] A9 Why
- [ ] A10 Body
- [ ] A11 Schedule
- [ ] A12 Gym
- [ ] A13 Eating
- [ ] A14 Cuisines
- [ ] A15 Wow moment (animated chart + plan + lockout preview)
- [ ] A16 Lockout setup
- [ ] A17 Permissions
- [ ] A18 Paywall (with "Why 14 days" copy)
- [ ] A19 Generating plan
- [ ] Progress indicator on every screen
- [ ] Resume-from-where-left-off via secure-store

## Phase 11 · Modals & Polish
- [ ] F2 Rank-up modal wired
- [ ] F3 Milestone modal (no SKStoreReviewController in run — placeholder)
- [ ] F4 AI nudge banner
- [ ] F5 Lockout blocked overlay
- [ ] F9 Confirmation sheets
- [ ] Loading skeletons on every fetch screen
- [ ] Error states with Retry
- [ ] Empty states everywhere
- [ ] Dynamic Type pass
- [ ] VoiceOver labels on every interactive
- [ ] Haptic feedback on every primary button
- [ ] Pull-to-refresh on lists
- [ ] No-hardcoded-values audit (grep for hex colors)

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
