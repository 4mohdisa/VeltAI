# Veltai — Initial Setup & Planning

You are setting up the Veltai iOS app codebase from scratch in the current working directory. This is a one-time bootstrap pass. By the end you will have an Expo app scaffolded, the design system wired up, every screen stubbed out as a placeholder, and a `TASKS.md` file detailing every subsequent implementation phase.

---

## Project context

Veltai is an AI-powered iOS health performance app focused on a single habit: getting the user to the gym. Differentiators are (a) photo and voice food tracking with uncertainty prompts, (b) app lockout via iOS Family Controls until the daily gym session is logged, and (c) AI-generated personalised daily plans. The product is iOS-only for MVP. No free tier — 14-day trial then A$9.99/month via RevenueCat + StoreKit.

The current working directory contains the complete product documentation:

```
./
├── MVP-scope.md
├── Database/           ← 13 SQL schema docs
├── Design/             ← UI design system, theme tokens, screens inventory
├── Engineering/        ← Tech stack, AI architecture, HealthKit, gamification
├── Features/           ← 8 feature specs (onboarding, gym, food, lockout, etc.)
└── Quality/            ← Bugs to avoid, App Store readiness checklist
```

---

## Step 1 — Read the docs first

Before writing any code, build a complete mental model. Use `ls` to discover exact filenames (the docs may contain `·` or `&` in their names due to Notion export). Then read at minimum:

1. `MVP-scope.md` — overall plan
2. Every file in `Design/` — this is your visual bible
3. `Engineering/Tech-Stack.md` (or however the file is named)
4. `Engineering/AI-Architecture.md`
5. `Engineering/HealthKit-Implementation.md`
6. `Engineering/Gamification-System.md`
7. Every file in `Features/`
8. `Quality/Bugs-to-Avoid.md`
9. `Quality/App-Store-Readiness.md`

Skim the `Database/` folder so you understand the data model, but you won't be implementing it in this pass.

When you finish reading, briefly state in one paragraph what the app does and what your understanding of the design system is. This sanity-check confirms you have context before you start changing files.

---

## Step 2 — Reorganise the folder

Move all existing markdown docs into a `./docs/` subfolder so the project root is clean for Expo:

```bash
mkdir -p docs
mv Database Design Engineering Features Quality MVP-scope.md docs/
ls -la
```

The root should now contain only `docs/` (plus any hidden files like `.git`).

---

## Step 3 — Initialise the Expo project at root

```bash
npx create-expo-app@latest . --template default
```

If it refuses because `docs/` exists, temporarily move docs out:

```bash
mv docs ../veltai-docs-temp
npx create-expo-app@latest . --template default
mv ../veltai-docs-temp ./docs
```

After init, verify:
- `package.json` exists
- `app.json` (or `app.config.js`) exists
- `/app/` directory exists with default Expo Router routes
- Expo SDK is `~54.0.0` or compatible

---

## Step 4 — Configure for iOS-only MVP

Edit `app.json`:

- `expo.name`: `Veltai`
- `expo.slug`: `veltai`
- `expo.scheme`: `veltai`
- `expo.ios.bundleIdentifier`: `app.veltai.veltai`
- `expo.ios.supportsTablet`: `false`
- Remove `expo.android` block entirely (Phase 2)
- Confirm `expo.newArchEnabled`: `true`
- Confirm `expo.jsEngine`: `"hermes"` (or omit since it's default)
- `expo.userInterfaceStyle`: `"light"` (no dark mode for MVP)

---

## Step 5 — Install dependencies

```bash
npx expo install \
  @shopify/flash-list \
  react-native-reanimated \
  @tanstack/react-query \
  zustand \
  expo-camera \
  expo-image \
  expo-blur \
  expo-haptics \
  expo-local-authentication \
  expo-secure-store \
  expo-notifications \
  react-native-svg
```

Defer these for later phases (note them in TASKS.md but don't install yet — they need device-specific setup):
- `@clerk/expo` (auth, Phase 5 when wiring up real auth)
- `react-native-purchases` (RevenueCat, Phase 5)
- `@sentry/react-native` (Phase 11 polish)
- `react-native-health` (Phase 6 when wiring HealthKit)

---

## Step 6 — Create the theme tokens file

This is the single most important file in the codebase. Find the theme doc:

```bash
ls docs/Design/
```

Read whatever file contains the theme tokens (likely `Theme & Design Tokens.md`). Translate **every** named value into TypeScript at `/lib/design/tokens.ts`:

- `color` — black, white, grayscale, accent (Veltai Green `#16A34A`), accentDark, accentLight, accentBorder, accentText, warn, warnLight, warnBorder, error, errorLight, errorBorder, streakFire
- `type` — display, title1, title2, title3, body, bodyBold, callout, footnote, caption, statLarge, statMedium, statSmall (each with size, weight, lineHeight)
- `space` — xs, sm, md, lg, xl, '2xl', '3xl', '4xl'
- `radius` — none, sm, md, lg, xl, '2xl', full
- `shadow` — none, sm, md, lg (each as a React Native style object)
- `motion` — duration (snap, fast, medium, slow, epic), easing (standard, enter, exit)
- `zIndex` — base, card, fab, bottomSheet, topBanner, modal, fullModal, toast, debug

Export each as a const. Use exact values from the doc. Do not improvise.

Then create `/lib/design/index.ts` that re-exports everything.

**From this point on, NO file outside `/lib/design/tokens.ts` may contain a hardcoded color, spacing value, font size, border radius, or shadow.**

---

## Step 7 — Create the folder structure

Read `docs/Design/UI & Design System.md` (or the exact filename) for the canonical structure. Create these folders and put an empty `index.ts` in each (so future imports resolve):

```
/components
  /primitives
  /forms
  /display
  /navigation
  /animations
  /domain
/lib
  /design                ← tokens.ts already here from Step 6
  /formatting
  /validation
  /healthkit
  /storage
  /api
    /handlers
  /xp
  /time
  /errors
```

The `/app/` folder is Expo Router's screen folder, already created by `create-expo-app`. You will populate it in Step 9.

---

## Step 8 — Configure path aliases

In `tsconfig.json`, add path aliases so imports stay clean:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Now `import { color } from '@/lib/design/tokens'` works from anywhere.

---

## Step 9 — Scaffold every screen as a placeholder

Read `docs/Design/App Screens.md`. For every screen listed (A1-A19, B1-B4, C1-C12, D1-D6, E1-E12, F1-F9), create a corresponding file under `/app/` following Expo Router's file-based routing convention.

Routing structure:

```
/app
  /_layout.tsx                           ← root layout, sets up stack
  /index.tsx                             ← initial redirect screen (route to onboarding or tabs)
  /(onboarding)
    /_layout.tsx                         ← onboarding stack
    /welcome.tsx                         ← A1
    /value-prop.tsx                      ← A2
    /sign-in.tsx                         ← A3
    /struggles.tsx                       ← A4
    /past-attempts.tsx                   ← A5
    /app-frustrations.tsx                ← A6
    /reflection.tsx                      ← A7
    /goal.tsx                            ← A8
    /why.tsx                             ← A9
    /body.tsx                            ← A10
    /schedule.tsx                        ← A11
    /gym.tsx                             ← A12
    /eating.tsx                          ← A13
    /cuisines.tsx                        ← A14
    /wow-moment.tsx                      ← A15
    /lockout-setup.tsx                   ← A16
    /permissions.tsx                     ← A17
    /paywall.tsx                         ← A18
    /generating-plan.tsx                 ← A19
  /(tabs)
    /_layout.tsx                         ← tab navigator
    /index.tsx                           ← B1 Dashboard (the home tab)
    /food.tsx                            ← C1 Food log (the food tab)
    /gym.tsx                             ← D1 Gym log (the gym tab)
    /profile.tsx                         ← E1 Profile main (the profile tab)
  /dashboard
    /plan.tsx                            ← B2
    /lockout.tsx                         ← B3
    /nutrition.tsx                       ← B4
  /food
    /add.tsx                             ← C2 entry method picker
    /photo.tsx                           ← C3 photo capture
    /photo-review.tsx                    ← C4 photo review
    /voice.tsx                           ← C6 voice entry
    /barcode.tsx                         ← C7 barcode scan
    /barcode-confirm.tsx                 ← C8
    /search.tsx                          ← C9 manual search
    /custom.tsx                          ← C10 custom food form
    /[mealId].tsx                        ← C11 meal detail (dynamic route)
    /history.tsx                         ← C12 meal history
  /gym
    /log.tsx                             ← D2 log session sheet
    /streak.tsx                          ← D4 streak detail
    /freeze.tsx                          ← D5 apply streak freeze
    /history.tsx                         ← D6 session history
  /profile
    /settings.tsx                        ← E2 settings list
    /account.tsx                         ← E3
    /subscription.tsx                    ← E4
    /lockout-settings.tsx                ← E5
    /notifications.tsx                   ← E6
    /health.tsx                          ← E7
    /units.tsx                           ← E8
    /privacy.tsx                         ← E9
    /support.tsx                         ← E10
    /about.tsx                           ← E11
    /delete-account.tsx                  ← E12
```

For each placeholder file, render a minimal screen showing the screen ID and a TODO comment with the layout description from `App Screens.md`. Use this template:

```tsx
// B1 · Dashboard (home)
// TODO: Three-zone vertical layout
//   Top zone (sticky): streak with flame, today's XP, current rank badge
//   Middle zone: gym status (huge log button or logged checkmark) + macros ring + bar charts
//   Bottom zone: today's AI plan card + lockout status banner

import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function Dashboard() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          B1 · Dashboard
        </Text>
        <Text style={{ ...type.body, color: color.gray700, marginTop: space.md }}>
          Placeholder. See docs/Design/App Screens.md for the layout spec.
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

Every placeholder follows this exact shape: SafeAreaView + Text with the screen ID + a TODO comment. No styling beyond tokens. No logic.

---

## Step 10 — Wire up the tab navigation

In `/app/(tabs)/_layout.tsx`, create the Expo Router tab navigator with four tabs: Dashboard, Food, Gym, Profile. Use icons from `@expo/vector-icons` (e.g., Ionicons). Match the tokens — white background, black inactive, accent green for active.

In `/app/index.tsx`, render a placeholder that decides between onboarding and tabs. For now, hardcode: read a `hasCompletedOnboarding` boolean from `expo-secure-store` (with default `false`), redirect to `/(onboarding)/welcome` if false, otherwise to `/(tabs)`. The actual auth/onboarding check comes in a later phase — this scaffold just makes the navigation flow real.

In `/app/_layout.tsx`, set up the root stack and any global providers (SafeAreaProvider, etc.).

---

## Step 11 — Verify the project builds and runs

Run each of these and fix any errors before continuing:

```bash
npx tsc --noEmit
npx expo prebuild --platform ios --clean
```

Both must complete without errors.

Then quickly verify it starts:

```bash
timeout 20s npx expo start --ios &
sleep 15
kill %1 2>/dev/null || true
```

If the dev server logged a successful start before the timeout killed it, you are good.

---

## Step 12 — Commit progress

```bash
git init  # only if .git doesn't exist
git add -A
git commit -m "phase 0: Expo scaffold + design tokens + placeholder screens"
```

---

## Step 13 — Create TASKS.md

Create `./TASKS.md` at the project root with the exact content below. This file becomes the source of truth for the build sessions that follow.

```markdown
# Veltai Implementation Tasks

Frontend-first build order. Backend integration is deferred until the UI is solid and reviewable.

## Reference docs (all under `./docs/`)

- `MVP-scope.md` — overall plan and what ships when
- `Features/` — 8 feature specs with user flows, edge cases, success metrics
- `Design/App Screens.md` — screen-by-screen layout descriptions
- `Design/Theme & Design Tokens.md` — color, type, spacing values (authoritative)
- `Design/UI & Design System.md` — component philosophy and library structure
- `Engineering/Tech Stack.md` — what services are used and why
- `Engineering/HealthKit Implementation.md` — Apple Health technical detail
- `Engineering/Gamification System.md` — XP rules, ranks, anti-cheat
- `Quality/Bugs to Avoid.md` — 15 documented failure patterns from competitors
- `Quality/App Store Readiness.md` — submission checklist

## Build order

The order is deliberately counterintuitive: build the main app first, onboarding last. By the time the 19 onboarding screens are built, the component library is mature from real use, so onboarding comes together fast with no rework.

---

## Phase 0 · Foundation
- [x] Expo project initialised in `./`
- [x] iOS-only config in app.json
- [x] Dependencies installed
- [x] Theme tokens at `/lib/design/tokens.ts`
- [x] Folder structure created
- [x] Path aliases configured (`@/*`)
- [x] Every screen scaffolded as a placeholder
- [x] Tab navigation working
- [x] Onboarding stack scaffolded
- [x] `tsc --noEmit` passes
- [x] `expo prebuild` passes

## Phase 1 · Primitives & Forms
- [ ] `Box` primitive (View wrapper with token-aware style props)
- [ ] `Text` primitive (Text wrapper with type variant prop)
- [ ] `Pressable` primitive (with light haptic feedback on tap)
- [ ] `Button` (primary, secondary, tertiary, destructive variants) — uses accent for primary
- [ ] `TextField` with `FieldShellProps` shape (label, helper, error, required)
- [ ] `SliderField` (for weight, height, gym frequency)
- [ ] `MultiSelectField` (chip-style, used in onboarding)
- [ ] `SegmentedField` (for sex, eating frequency, training type)
- [ ] `Stepper` (for meals/day, age)

## Phase 2 · Display & Navigation
- [ ] `Card`
- [ ] `Stat` (label + big number, for streaks and totals)
- [ ] `Avatar`
- [ ] `Badge` (rank badge, streak count)
- [ ] `EmptyState`
- [ ] `ErrorState`
- [ ] `Toast` (top-center for info, bottom for action)
- [ ] `LoadingSkeleton` (grey shape matching eventual layout)
- [ ] Custom `TabBar` (overrides Expo defaults to match tokens)
- [ ] `NavBar` / `Header`
- [ ] `BackButton`
- [ ] `BottomSheet` wrapper (uses `expo-ui` Sheet where available)

## Phase 3 · Animation Components
- [ ] `XpFloatUp` (Reanimated 3 worklet — number floats up and fades)
- [ ] `StreakFlame` (animated flame icon with intensity)
- [ ] `RankUpModal` (full-screen reveal with badge animation)
- [ ] `ConfettiBurst` (for milestone moments)
- [ ] `Reduce Motion` check helper — all animations respect this

## Phase 4 · Tab Shell + Dashboard (B1-B4)
- [ ] B1 Dashboard home — three zones with mock data
- [ ] B2 Today's plan detail
- [ ] B3 Lockout status
- [ ] B4 Nutrition detail
- [ ] `DailyMacroRing` domain component (uses react-native-svg)
- [ ] `LockoutBanner` domain component
- [ ] `GymStatusCard` domain component (the big "log session" button)
- [ ] Wire navigation between Dashboard and detail screens

## Phase 5 · Profile Tab (E1-E12)
- [ ] E1 Profile main with rank progress bar
- [ ] E2 Settings list (uses `expo-ui` Section/List)
- [ ] E3 Account settings (with destructive Delete Account button)
- [ ] E4 Subscription (mock RevenueCat data, deep-link to iOS Settings)
- [ ] E5 Lockout settings (placeholder app picker — real picker needs Family Controls)
- [ ] E6 Notification preferences (toggles per category, quiet hours)
- [ ] E7 Apple Health (connection status, deep-link to iOS Settings)
- [ ] E8 Units (metric/imperial segmented control)
- [ ] E9 Privacy (links to web policy URLs)
- [ ] E10 Support
- [ ] E11 About
- [ ] E12 Delete Account flow (multi-step with type-to-confirm)

## Phase 6 · Gym Tab (D1-D6)
- [ ] D1 Gym log with 30-day calendar grid (sessions, freezes, missed)
- [ ] D2 Log gym session sheet (duration, RPE, energy, notes)
- [ ] D3 HealthKit auto-detect banner (placeholder, mock detection event)
- [ ] D4 Streak detail with upcoming-7-days view
- [ ] D5 Apply streak freeze sheet
- [ ] D6 Gym session history list (FlashList)
- [ ] `GymSessionButton` domain component (huge primary CTA)
- [ ] `StreakCounter` with `StreakFlame` integration

## Phase 7 · Food Tab — Manual flow (C1, C2, C9-C12)
- [ ] C1 Food log (FlashList of today's meals)
- [ ] C2 Add meal entry method picker (2x2 grid)
- [ ] C9 Manual food search (search bar + FlashList results)
- [ ] C10 Custom food form
- [ ] C11 Meal detail (edit existing)
- [ ] C12 Meal history (FlashList by date)
- [ ] `MealCard` domain component
- [ ] `MacroBadge` domain component (small calorie + macro chips)

## Phase 8 · Food Tab — AI flows (C3-C8)
- [ ] C3 Photo capture (expo-camera, with optional second photo for label)
- [ ] C4 Photo review with confidence indicators per item
- [ ] C5 Uncertainty prompt sheet (queue, live calorie preview)
- [ ] C6 Voice entry (expo-speech-recognition, live transcript)
- [ ] C7 Barcode scan (expo-camera barcode mode)
- [ ] C8 Barcode product confirm
- [ ] `UncertaintyPromptCard` domain component
- [ ] Mock AI responses for all flows (no real Gemini call yet)

## Phase 9 · Onboarding (A1-A19)
- [ ] A1 Welcome (the only black-bg screen)
- [ ] A2 Value prop carousel (three swipeable cards)
- [ ] A3 Sign in / sign up (Clerk UI — placeholder until Phase 12 wires Clerk)
- [ ] A4 What's been getting in the way? (multi-select cards)
- [ ] A5 What have you tried?
- [ ] A6 What frustrates you about fitness apps?
- [ ] A7 Reflection (conditional copy based on A4-A6)
- [ ] A8 Goal (segmented + conditional inputs)
- [ ] A9 Why (free text)
- [ ] A10 About you (4 inputs)
- [ ] A11 Your day (3 time pickers — use `expo-ui` DatePicker)
- [ ] A12 Your gym (2 sliders)
- [ ] A13 Your eating (stepper + chips)
- [ ] A14 Your cuisines (chip multi-select)
- [ ] A15 Wow moment (animated chart + tomorrow's plan + lockout preview)
- [ ] A16 Lockout setup
- [ ] A17 Permissions (HealthKit + Notifications explainers)
- [ ] A18 Paywall (with "Why 14 days" copy from docs)
- [ ] A19 First plan generating (loading screen with rotating tips)
- [ ] Progress indicator at top of every onboarding screen
- [ ] Onboarding state persistence (resume where left off via `expo-secure-store`)

## Phase 10 · Modals & Overlays (F1-F9)
- [ ] F1 XP float-up — wire to every XP-earning event
- [ ] F2 Rank-up modal — wire to rank threshold crossings
- [ ] F3 Streak milestone modal (7/30/100 day) — triggers SKStoreReviewController only on 7-day
- [ ] F4 AI nudge in-app banner (mock nudges for now)
- [ ] F5 Lockout blocked overlay (Strict mode placeholder)
- [ ] F6 LoadingSkeleton component reused everywhere
- [ ] F7 EmptyState reused
- [ ] F8 ErrorState reused
- [ ] F9 Confirmation sheets for destructive actions

## Phase 11 · Polish
- [ ] Loading skeletons on every screen that will fetch
- [ ] Error states with Retry on every fetch screen
- [ ] Dynamic Type test pass (Settings → Accessibility → Larger Text)
- [ ] VoiceOver pass on every screen
- [ ] Reduce Motion verified on every animation
- [ ] Haptics on all primary button presses (light impact)
- [ ] Pull-to-refresh on food log, gym log, history screens
- [ ] Empty states everywhere
- [ ] No hardcoded values audit (grep for hex colors, fixed font sizes)

## Phase 12 · Backend integration (later)

Out of scope for the frontend-first build. Documented here so we know what's coming next:

- Clerk auth wiring (replace placeholder sign-in)
- RevenueCat StoreKit integration (replace mock subscription state)
- Go backend connection (`/lib/api/apiClient.ts` with Clerk JWT)
- Supabase queries via backend
- HealthKit real data via `react-native-health`
- Gemini food scan API calls
- Family Controls entitlement and real app lockout
- Sentry crash reporting
- Real push notifications

---

## Session log

Append a short entry here at the end of every build session. Format:

```
### YYYY-MM-DD — Phase N
- What was completed
- Any decisions made that the docs didn't cover
- Any tasks marked [?] and why
- Anything noteworthy for the next session
```

### 2026-06-15 — Phase 0
- Expo SDK 54 project initialised at root
- Docs moved to `./docs/`
- Theme tokens implemented from `Theme & Design Tokens.md`
- Every screen scaffolded as a placeholder
- Tab navigation and onboarding stack wired
- tsc and prebuild both pass
```

---

## Step 14 — Final check and stop

After Step 13:

1. Run `npx tsc --noEmit` one final time — must pass
2. `git add -A && git commit -m "phase 0: TASKS.md created"`
3. State that Phase 0 is complete and the codebase is ready for Phase 1
4. **Stop.** Do not begin Phase 1 in this session. The user will start that with a separate prompt.

---

## Critical rules for this setup session

- **Read the docs first**, before writing any code. Confirm your understanding in one paragraph.
- **No hardcoded colors, spacing, font sizes, border radii, or shadow values** anywhere outside `/lib/design/tokens.ts`.
- **No screen logic** in this setup pass. Every screen is a placeholder showing only its ID and a TODO comment.
- **Commit after every numbered step** so progress is recoverable.
- **Stop and report** if any step fails after 3 attempts to resolve.
- **Do not skip the verification step** (`tsc`, `prebuild`).
- **Do not add dependencies** not listed in Step 5.
- **Do not initialise git** if `.git` already exists — only `git init` if missing.

When everything is done, write a one-line confirmation: "Phase 0 complete. TASKS.md created. Ready for Phase 1."
