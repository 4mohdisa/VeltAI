# UI & Design System

# UI & Design System

Visual direction, component library, and native-component architecture for the Veltai iOS app.

**Direction: pure monochrome, Cal AI-clean, heavily rounded, native iOS controls.** See Theme & Design Tokens for the concrete values. This page covers the patterns and the native-component contract.

---

## Design philosophy

Three rules, in order:

1. **Monochrome only.** Black, white, greys. No green, no orange, no semantic colour anywhere. Hierarchy comes from type weight, size, spacing, and grey fills — never colour.
2. **Native iOS controls, light styling.** Use real native components (SF Symbols, native tabs, native sheets, SwiftUI pickers) — but always in Veltai's light/flat/monochrome language, never dark glass.
3. **Fills over borders, pills over rectangles, space over density.** Cards are grey fills not borders. Buttons are full pills. Spacing is generous.

### Why monochrome black-on-white

- Distinct. Every fitness app is green or gradient. A disciplined monochrome app looks like a premium tool, not a hype reel.
- Trustworthy. Reads as serious, honest, considered.
- Battery-efficient on OLED in light mode.
- Maximum contrast — inherently accessible.
- Forces craft. With no colour to hide behind, type, weight, and spacing have to be right. When they are, it looks expensive.

There is **no accent colour.** The brightest element on any screen is a single solid-black button.

---

## The five disciplines (how Cal AI-clean is achieved)

1. **One black button per screen.** The single primary action is a solid black pill with white text. Everything else is outlined or text-only. Never two black buttons competing.
2. **Grey fills define surfaces.** Cards are a light grey fill (`gray100`) on white, no border. When a card must sit on a grey zone, it flips to white with a barely-there shadow. Never border + fill together.
3. **Heavy/light type contrast.** Key numbers are huge and heavy (`statHero` 56/800). Labels are tiny and grey (`label` 13/600 uppercase). Almost nothing in between.
4. **Everything rounds to pills.** Buttons, chips, segmented controls are fully round. Cards are 20px, sheets 28px. Soft, friendly, premium.
5. **Generous rhythm.** 20px card padding, 28px between cards, real breathing room. Density is the enemy of clean.

---

## Native iOS components (verified inventory)

These are the **actual native controls Veltai uses**, with exact packages and APIs. Each renders a real UIKit/SwiftUI control — true native feel, not a React Native approximation.

**Critical styling note:** this inventory was proven on a sibling app that used a *dark glass* aesthetic. Veltai uses the **light material variants and flat grey fills** instead. Where a component takes a blur/material parameter, use the **light** variant. Do not copy dark-glass parameters.

| # | Component | Package / API | Native control | Veltai styling note |
| --- | --- | --- | --- | --- |
| 1 | **Tab bar** | `expo-router/unstable-native-tabs` → `NativeTabs` | `UITabBar`  • `UIVisualEffectView` | Use **light** material (`systemUltraThinMaterial` / `systemChromeMaterial`), NOT the dark variant. Black active glyph, grey inactive. |
| 2 | **Bottom sheet** | `expo-router` `presentation: 'formSheet'`  • `sheetAllowedDetents`  • `sheetGrabberVisible: true`  • `sheetCornerRadius: 28` (react-native-screens) | `UISheetPresentationController` | White sheet, 28px corners, grabber visible. Used for: log gym session, add meal, all detail sheets. |
| 3 | **Stack + headers + push** | `expo-router` `Stack` / `presentation: 'card'` | `UINavigationController` | Standard push transitions. Headerless where we own the chrome (onboarding). |
| 4 | **SF Symbols icons** | `expo-symbols` → `SymbolView` | SF Symbol glyphs | **Replaces all Ionicons.** Monochrome — black for active/primary, `gray500` for inactive/secondary. |
| 5 | **Segmented control** | `@expo/ui/swift-ui` → `Host`  • `Picker` (`pickerStyle: segmented`) | SwiftUI segmented Picker | For units (metric/imperial), time-range toggles. Native look. |
| 6 | **Date / time pickers** | `@react-native-community/datetimepicker` → `DateTimePicker` | `UIDatePicker` | Wake time, sleep time, gym time in onboarding; meal times. |
| 7 | **Action sheet** | `ActionSheetIOS` (RN core) | `UIAlertController (.actionSheet)` | For select-style choices (training type, dietary picks). Replaces custom dropdowns. |
| 8 | **Alert dialog** | `Alert` (RN core) | `UIAlertController (.alert)` | Confirmations, destructive-action prompts (delete account, cancel subscription). |
| 9 | **Switch / toggle** | `Switch` (RN core) | `UISwitch` | Settings toggles, notification preferences, lockout enable. |
| 10 | **Text fields** | `TextInput` (RN core) | `UITextField` / `UITextView` | Styled per tokens: `gray100` fill, 16px radius, no border, black border on focus. |
| 11 | **Pull-to-refresh** | `RefreshControl` (RN core) | `UIRefreshControl` | Food log, gym log, history lists. |
| 12 | **Activity indicator** | `ActivityIndicator` (RN core) | `UIActivityIndicatorView` | Inline loading (prefer skeletons for full screens). |
| 13 | **Context menu** (optional) | `expo-router` / native long-press | `UIContextMenuInteraction` | Long-press on meal/session cards for quick actions. |

### Blur / glass surfaces — used sparingly, light only

`expo-blur` → `BlurView` is available, but Veltai's default surfaces are **flat grey fills, not glass.** The Cal AI cleanliness depends on flat fills. Reserve blur for at most the tab bar's native material. Do **not** wrap cards in BlurView (that was the sibling app's dark-glass pattern — not ours).

### Native system modules (services, not visual)

- `expo-haptics` (Taptic Engine) — light impact on primary buttons, selection on toggles/chips
- `expo-secure-store` (Keychain) — auth tokens, onboarding state
- `expo-status-bar`, `expo-splash-screen` — app shell

---

## Icon system — SF Symbols

All icons are SF Symbols via `expo-symbols`. No Ionicons, no vector-icons. Monochrome only.

| Use | SF Symbol | Colour |
| --- | --- | --- |
| Streak | `flame.fill` | `black` (NOT orange) |
| Gym / sessions | `dumbbell.fill` | `black` active / `gray500` inactive |
| Food | `fork.knife` | `black` active / `gray500` inactive |
| Dashboard | `house.fill` | `black` active / `gray500` inactive |
| Profile | `person.fill` | `black` active / `gray500` inactive |
| Protein (macro) | `circle.fill` or custom | `gray500` |
| Carbs (macro) | `leaf.fill` | `gray500` |
| Fat (macro) | `drop.fill` | `gray500` |
| Calories | `flame` | `gray500` or `black` |
| Add | `plus` | context-dependent |
| Camera scan | `camera.fill` | context |
| Voice | `mic.fill` | context |
| Barcode | `barcode.viewfinder` | context |
| Lockout | `lock.fill` | `black` |
| AI | `sparkles` | `black` or `gray500` |
| Settings | `gearshape.fill` | `gray500` |
| Subscription | `creditcard.fill` | `gray500` |
| Back | `chevron.left` | `black` |
| Chevron (row) | `chevron.right` | `gray400` |

Macro icons are monochrome grey, not the red/orange/blue of Cal AI. The discipline is total.

---

## Typography

SF Pro (system). Extreme weight contrast — see Theme & Design Tokens for the full scale. The signature pairing: a heavy `statHero`/`statMedium` number with a tiny grey uppercase `label` beneath it. Use it for every stat on every screen.

---

## Custom component library

Lives in `/components/`. These are the components we build (everything not covered by a native control above). All compose from tokens, all monochrome.

```
/components
  /primitives
    Box.tsx
    Text.tsx              (type variant prop)
    Pressable.tsx         (haptic feedback built in)
    Icon.tsx              (wraps expo-symbols SymbolView)
  /forms
    Button.tsx            (primary=black pill, secondary=outline pill, text)
    TextField.tsx         (gray100 fill, no border, black on focus)
    SliderField.tsx
    MultiSelectField.tsx  (pill chips, black when selected)
    SegmentedField.tsx    (wraps @expo/ui SwiftUI Picker)
    Stepper.tsx
  /display
    Card.tsx              (gray100 fill, 20px radius, NO border)
    StatTile.tsx          (SF Symbol + heavy number + grey label)
    StatHero.tsx          (the one big number on a screen)
    Avatar.tsx
    Badge.tsx             (rank, monochrome)
    EmptyState.tsx
    ErrorState.tsx
    Toast.tsx
    LoadingSkeleton.tsx   (grey shimmer)
  /navigation
    Header.tsx            (native-feeling nav header)
    BackButton.tsx        (chevron.left SF Symbol, gray100 circle)
    SheetContent.tsx      (wrapper for native formSheet content)
  /animations
    XpFloatUp.tsx         (Reanimated 3, black "+25" floats up)
    StreakFlame.tsx       (monochrome flame, animated intensity)
    RankUpModal.tsx       (full-screen, monochrome)
    ConfettiBurst.tsx     (monochrome/greyscale particles)
  /domain
    GymSessionButton.tsx  (the big black pill CTA)
    MealCard.tsx          (gray100 fill, SF Symbol method indicator)
    UncertaintyPromptCard.tsx
    LockoutBanner.tsx     (gray100 fill, black lock icon — NOT amber)
    DailyMacroRing.tsx    (monochrome — black progress on gray200 track)
    StreakCounter.tsx
```

Note the tab bar is **not** in this list anymore — it's a native component (`NativeTabs`), not custom.

### Component contract

Every component accepts: `style`, `testID`, `accessibilityLabel`.

Every form field shares:

```tsx
type FieldShellProps = {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

### The DailyMacroRing in monochrome

The macro ring (currently green) becomes: **black progress arc on a `gray200` track.** The calorie number in the centre is `statHero` black. Macro bars beside it are black fill on `gray200` track. No colour.

---

## Reusable helper functions

Lives in `/lib/` (unchanged from before):

```
/lib
  /design        ← tokens.ts (the closed monochrome palette)
  /formatting    ← formatCalories, formatMacros, formatDate, formatDuration, formatStreak
  /validation    ← validateEmail, validateWeight, validateAge
  /healthkit     ← requestPermissions, fetchTodaysWorkouts, fetchSleepLastNight, detectGymWorkout
  /storage       ← secureStore (Keychain), cacheStore
  /api           ← apiClient (Clerk JWT), handlers/
  /xp            ← calculateXp, rankFromXp, streakStatus
  /time          ← utcDay, localToUtc, quietHoursCheck
  /errors        ← captureError (Sentry, PII-scrubbed), presentError
```

Pure functions where possible; side-effecting helpers return Promises with explicit error handling.

---

## Animation principles

- All continuous animation on UI thread via `react-native-reanimated` v3 worklets
- Never animate on JS thread
- Durations from `motion` tokens (snap 180 / fast 260 / medium 380 / slow 700 / epic 1100)
- Spring physics for natural motion
- 60fps minimum on all animations
- Respect Reduce Motion — skip to end state
- Animations are monochrome (XP floats are black, confetti is greyscale)

---

## Accessibility

- Every Pressable: `accessibilityLabel` + `accessibilityRole`
- Dynamic Type respected — never hardcode font size
- Minimum tap target 44pt (primary buttons are 52pt for presence)
- VoiceOver tested
- Contrast is inherently strong (monochrome)
- Reduce Motion respected

---

## What to never do

- **Any colour beyond black/white/grey** — no green, orange, red, amber, blue
- Borders as the primary card definition (use grey fills)
- More than one black-filled button per screen
- Dark glass / BlurView cards (that's the sibling app, not Veltai)
- Ionicons or any non-SF-Symbol icons
- Colour to signal state (use weight, shape, SF Symbol, copy)
- Skeuomorphism, gradients, neumorphism
- Emoji in UI
- Modal-stacking (one sheet at a time)
- JS-thread animations
- Hardcoded sizes that don't scale with Dynamic Type
- Tap targets under 44pt
- Spinners as the only loading state (use skeletons)

---

## Onboarding-specific design notes

- One question or topic per screen — never a long form
- Progress indicator at top (e.g. "Step 3 of 13") — a thin black progress bar on `gray200`
- Back button always available (chevron.left SF Symbol in a `gray100` circle)
- Skip visible on optional screens (text-only, `gray500`)
- Reflection screens have NO inputs — only the primary button
- Wow moment uses `display` type, animated reveal, monochrome chart (black line on white)
- Paywall has visible Restore Purchases button (App Store rule), and the "Why 14 days" copy
- The one primary button per screen is the black pill at the bottom ("Continue")