# UI & Design System

Visual direction, component library, and helper architecture for the Veltai iOS app.

---

## Design philosophy

Three rules, in order:

1. **Black on white.** Pure black text, pure white background. No gradients, no glassmorphism. Reads like a quality product, not a fitness gimmick.
2. **Native iOS feel.** Use Expo Apple UI native components where available. Custom components match Apple HIG patterns.
3. **Transparency by default.** Every number on screen has a source. Every action has a clear outcome. No dark patterns.

### Why black on white

- Trustworthy. Looks like a real product, not a hype reel.
- Battery-efficient on OLED iPhones in light mode.
- Accessible — maximum contrast ratio possible.
- Hard to do badly. Forces type and spacing to do the heavy lifting.

The exception: a single accent colour for primary CTAs and positive feedback (XP, streak fire, success states). Tentatively `#15803D` — finalise during design phase.

---

## Typography

- **Font family**: SF Pro (system default, free, optimised by Apple)
- **Type scale**:

| Style | Size | Weight | Use |
| --- | --- | --- | --- |
| Display | 34pt | Bold | Rank-up modals, milestone moments |
| Title 1 | 28pt | Bold | Screen headings |
| Title 2 | 22pt | Semibold | Section headings |
| Body | 17pt | Regular | Default text (iOS default size) |
| Callout | 16pt | Regular | Secondary descriptive text |
| Footnote | 13pt | Regular | Meta info, timestamps |
| Caption | 11pt | Regular | Smallest labels |
- Line height: 1.4 for body, 1.2 for display
- Use Dynamic Type — users with vision needs can scale up; we render correctly

---

## Colour palette

```
Pure black     #000000   text, primary UI
Pure white     #FFFFFF   background
Gray 700       #404040   secondary text
Gray 400       #A0A0A0   placeholder text
Gray 200       #E5E5E5   borders, dividers
Gray 100       #F5F5F5   card backgrounds, subtle fills

Accent         #15803D   primary CTA, streak, XP, success
Warn           #B45309   streak at risk, attention
Error          #B91C1C   errors only (sparing)
```

No dark mode in MVP. Phase 2.

---

## Spacing — 8pt grid

All spacing is a multiple of 8 (or 4 for tight scenarios).

Standardised values: `4, 8, 12, 16, 24, 32, 48, 64`

Defined as tokens in `/lib/design/spacing.ts` and consumed everywhere.

---

## Native Apple UI components via `expo-ui`

Use these whenever Expo's `expo-ui` provides them. They're SwiftUI rendered natively — true iOS feel with React Native control.

| Component | Use |
| --- | --- |
| `Sheet` / `BottomSheet` | All modal sheets (add meal, settings detail) |
| `Picker` (segmented + wheel) | Selecting from finite options |
| `DatePicker` | Date/time selection |
| `ContextMenu` | Long-press actions on cards |
| `Toggle` | Settings on/off |
| `Stepper` | Quantity adjustments |
| `Section` / `List` | Grouped lists in Settings |

For anything `expo-ui` doesn't cover yet, custom components built with `react-native-reanimated` and `expo-blur` to match the iOS look.

---

## Custom component library

Lives in `/components/` with strict structure:

```
/components
  /primitives          ← unstyled building blocks
    Box.tsx
    Text.tsx
    Pressable.tsx
  /forms               ← form inputs
    Button.tsx           (primary, secondary, tertiary, destructive)
    TextField.tsx
    SliderField.tsx
    MultiSelectField.tsx
    SegmentedField.tsx
  /display             ← presentation
    Card.tsx
    Stat.tsx             (label + big number)
    Avatar.tsx
    Badge.tsx            (rank, streak count)
    EmptyState.tsx
    ErrorState.tsx
    Toast.tsx
    LoadingSkeleton.tsx
  /navigation          ← nav bits
    TabBar.tsx
    NavBar.tsx
    BackButton.tsx
  /animations          ← Reanimated 3 specifics
    XpFloatUp.tsx
    StreakFlame.tsx
    RankUpModal.tsx
    ConfettiBurst.tsx
  /domain              ← feature-specific composed components
    GymSessionButton.tsx
    MealCard.tsx
    UncertaintyPromptCard.tsx
    LockoutBanner.tsx
    DailyMacroRing.tsx
```

### Component contract

Every primitive accepts standard props:

- `style` (overrides)
- `testID` (for testing)
- `accessibilityLabel` (for VoiceOver)

Every form field shares a `FieldShellProps` shape:

```tsx
type FieldShellProps = {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

---

## Reusable helper functions

Lives in `/lib/`:

```
/lib
  /formatting
    formatCurrency.ts     ← A$ with locale
    formatCalories.ts     ← "1,250 kcal"
    formatMacros.ts       ← "32g protein"
    formatDate.ts         ← "Today" / "Yesterday" / "Mon 15 Jun"
    formatDuration.ts     ← "47 min" / "1h 32m"
    formatStreak.ts       ← "13 days" with flame
  /validation
    validateEmail.ts
    validateWeight.ts
    validateAge.ts
  /healthkit
    requestPermissions.ts
    fetchTodaysWorkouts.ts
    fetchSleepLastNight.ts
    detectGymWorkout.ts
  /storage
    secureStore.ts        ← wraps expo-secure-store for tokens
    cacheStore.ts         ← wraps async-storage for non-sensitive cache
  /api
    apiClient.ts          ← typed wrapper with Clerk JWT injection
    handlers/
      gym.ts
      food.ts
      onboarding.ts
      ...
  /xp
    calculateXp.ts
    rankFromXp.ts
    streakStatus.ts
  /time
    utcDay.ts             ← UTC date math
    localToUtc.ts
    quietHoursCheck.ts
  /errors
    captureError.ts       ← Sentry wrapper with PII scrubbing
    presentError.ts       ← user-facing error toast
```

All helpers are pure functions where possible. Side-effecting helpers (storage, API) return Promises and have explicit error handling.

---

## Animation principles

- All continuous animations on UI thread via `react-native-reanimated` v3 worklets
- Never animate on JS thread (causes jank)
- Standard durations:
    - 200ms (snap)
    - 400ms (fade)
    - 800ms (reveal)
- Spring physics for natural motion, easing for linear UI moves
- All XP and streak animations precomputed for 60fps minimum
- Respect Reduce Motion — animations skip to end state if enabled

---

## Accessibility

- Every Pressable has `accessibilityLabel` and `accessibilityRole`
- Dynamic Type respected — never hardcode font size
- Minimum tap target 44x44 (iOS HIG)
- Test with VoiceOver enabled
- Sufficient contrast everywhere (already enforced by black-on-white)
- Reduce Motion respected

---

## What to never do

- Custom skeuomorphism (glass, neumorphism, gradients)
- Emoji-heavy UI (looks unprofessional for a paid health app)
- Multiple accent colours (one only)
- Modal-stacking (one sheet at a time)
- Block-the-thread animations on JS thread
- Hardcoded sizes that don't scale with Dynamic Type
- Tappable elements smaller than 44pt
- Loading spinners as the only state (always show skeleton)
- Custom toast positions (top center for info, bottom for action)

---

## Onboarding-specific design notes

- One question (or one topic) per screen — never a long form
- Progress indicator at top: "Step 3 of 13"
- Back button always available, never modal-blocked
- Skip button visible on optional screens
- Reflection screens (Phase 2) have NO inputs — only the Continue button
- Wow moment screen uses Display type size, animated reveal
- Paywall screen has visible Restore Purchases button (App Store rule)