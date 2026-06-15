# Theme & Design Tokens

Concrete design tokens for Veltai. Lives at `/lib/design/tokens.ts` and is the single source of truth for every visual value in the app.

---

## Philosophy

- **Black on white.** Two foundational colours. Maximum contrast.
- **One accent: Veltai Green.** For primary actions and positive feedback. Nothing else.
- **Two semantic alerts: Warn (amber), Error (red).** Used sparingly.
- **No gradients, no glassmorphism.** Pure flat with subtle borders for depth.

---

## Color tokens

### Foundation

```tsx
export const color = {
  black: '#000000',      // text, primary UI
  white: '#FFFFFF',      // background, default

  // Grayscale hierarchy
  gray900: '#171717',    // primary text alt (slightly softer than pure black for body)
  gray700: '#404040',    // secondary text
  gray500: '#737373',    // tertiary text, icons
  gray400: '#A3A3A3',    // placeholder text
  gray300: '#D4D4D4',    // dividers
  gray200: '#E5E5E5',    // borders
  gray100: '#F5F5F5',    // card backgrounds, subtle fills
  gray50:  '#FAFAFA',    // section backgrounds
}
```

### Accent — Veltai Green

```tsx
accent:        '#16A34A',  // primary CTA, success states, active streak
accentDark:    '#15803D',  // pressed state, hover (rare on mobile)
accentLight:   '#DCFCE7',  // accent backgrounds, success toasts
accentBorder:  '#86EFAC',  // borders on accent backgrounds
accentText:    '#15803D',  // accent text on accent-light bg (passes contrast)
```

**Why this green**: confident not playful, sits comfortably on white at 44pt tap targets, distinct from TrackrAI's blue, reads as "go / completed / positive" without feeling like a stock fitness app.

### Semantic

```tsx
warn:        '#F59E0B',    // streak at risk, warning banners
warnLight:   '#FEF3C7',
warnBorder:  '#FCD34D',

error:       '#DC2626',    // form errors, destructive actions
errorLight:  '#FEE2E2',
errorBorder: '#FECACA',

streakFire:  '#F97316',    // streak flame icon only
                           // distinct from warn so the flame reads
                           // as energetic, not anxious
```

### Usage rules

| Color | Use only for |
| --- | --- |
| `black` | Body text, primary UI elements, icons |
| `white` | Default page background |
| `gray900` | Body text alt (softer than pure black) |
| `gray700` | Secondary descriptive text |
| `gray500` | Captions, icon strokes |
| `gray300` | Dividers |
| `gray200` | Card borders |
| `gray100` | Card fills, subtle backgrounds |
| `accent` | Primary CTA buttons, current streak number, XP gains, completed checkmarks |
| `warn` | Streak-at-risk banners, warning toasts |
| `error` | Form errors, delete buttons, error toasts |
| `streakFire` | Streak flame icon only |

**Never use:** any other color. No gradients. No skeuomorphic UI. No "modern fitness app" purple-to-pink gradients.

---

## Typography tokens

iOS system font (SF Pro). No web fonts to load — starts up faster and looks more native.

```tsx
export const type = {
  display:    { size: 34, weight: '700', lineHeight: 40 },  // Rank-up moments
  title1:     { size: 28, weight: '700', lineHeight: 34 },  // Screen titles
  title2:     { size: 22, weight: '600', lineHeight: 28 },  // Section headers
  title3:     { size: 20, weight: '600', lineHeight: 25 },  // Card titles
  body:       { size: 17, weight: '400', lineHeight: 24 },  // Default body text
  bodyBold:   { size: 17, weight: '600', lineHeight: 24 },  // Emphasis in body
  callout:    { size: 16, weight: '400', lineHeight: 22 },  // Secondary descriptive
  footnote:   { size: 13, weight: '400', lineHeight: 18 },  // Meta info, timestamps
  caption:    { size: 11, weight: '400', lineHeight: 14 },  // Smallest labels

  // Number displays for stats
  statLarge:  { size: 48, weight: '700', lineHeight: 52 },  // Streak count, total XP
  statMedium: { size: 32, weight: '700', lineHeight: 36 },  // Macro totals
  statSmall:  { size: 22, weight: '600', lineHeight: 26 }   // Per-card stats
}
```

### Dynamic Type

All text styles respect iOS Dynamic Type. Users who size up in Accessibility settings scale these proportionally. Never hardcode `fontSize` outside this token.

---

## Spacing tokens — 8pt grid

```tsx
export const space = {
  xs:    4,   // tight (icon + label gap)
  sm:    8,   // standard inner padding
  md:   12,   // between elements
  lg:   16,   // card padding, section gap
  xl:   24,   // between sections
  '2xl': 32,  // between major sections
  '3xl': 48,  // top of screen padding
  '4xl': 64   // hero-screen padding
}
```

Use named values. Never raw numbers like `padding: 14`.

---

## Border radius tokens

```tsx
export const radius = {
  none:  0,
  sm:    6,   // small chips, badges
  md:   10,   // buttons, inputs
  lg:   14,   // cards
  xl:   20,   // sheets, modals
  '2xl': 28,  // featured cards
  full: 9999  // pills, avatars
}
```

iOS HIG corner radii cluster around 10–14 for most elements. Stay there.

---

## Shadow / elevation

Use sparingly. Most UI is flat with borders. Shadows only for elevated surfaces (sheets, floating buttons).

```tsx
export const shadow = {
  none: 'none',

  // Subtle lift (prefer border in most cases)
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }
  },

  // Floating action button, modal
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },

  // Bottom sheet
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }
  }
}
```

---

## Animation tokens

```tsx
export const motion = {
  duration: {
    snap:   200,    // immediate feedback (button press)
    fast:   300,    // standard transition
    medium: 400,    // fade in/out
    slow:   800,    // hero animations (XP float, rank-up)
    epic:  1200     // milestone moments (confetti)
  },

  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter:    'cubic-bezier(0, 0, 0.2, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)'
  }
}
```

All continuous animations run on UI thread via Reanimated 3 worklets.

---

## Z-index tokens

```tsx
export const zIndex = {
  base:        0,
  card:        10,
  fab:         20,   // floating action button
  bottomSheet: 30,
  topBanner:   40,   // in-app banners
  modal:       50,   // standard modal
  fullModal:   60,   // rank-up, milestone modals
  toast:       70,   // toasts always on top
  debug:       100   // dev only
}
```

---

## Component-level shorthand

Common combinations used everywhere. Each component picks from the tokens above, never hardcodes.

### Card

```tsx
{
  backgroundColor: color.white,
  borderColor: color.gray200,
  borderWidth: 1,
  borderRadius: radius.lg,
  padding: space.lg
}
```

### Primary button

```tsx
// Container
{
  backgroundColor: color.accent,
  borderRadius: radius.md,
  paddingVertical: space.md,
  paddingHorizontal: space.lg,
  minHeight: 44   // iOS HIG tap target
}
// Text
{ ...type.bodyBold, color: color.white }
```

### Secondary button

```tsx
{
  backgroundColor: color.white,
  borderColor: color.black,
  borderWidth: 1,
  borderRadius: radius.md,
  paddingVertical: space.md,
  paddingHorizontal: space.lg,
  minHeight: 44
}
// Text: type.bodyBold, color.black
```

### Destructive button

```tsx
{
  backgroundColor: color.white,
  borderColor: color.error,
  borderWidth: 1
}
// Text: type.bodyBold, color.error
```

### Input field

```tsx
{
  backgroundColor: color.white,
  borderColor: color.gray300,
  borderWidth: 1,
  borderRadius: radius.md,
  paddingVertical: space.md,
  paddingHorizontal: space.lg,
  fontSize: type.body.size,
  minHeight: 44
}
// Focus state: borderColor: color.black
// Error state: borderColor: color.error
```

### Section header

```tsx
{
  ...type.title2,
  color: color.black,
  marginBottom: space.md
}
```

### Streak counter (hero)

```tsx
// Number
{ ...type.statLarge, color: color.accent }
// Label below
{ ...type.caption, color: color.gray500, textTransform: 'uppercase', letterSpacing: 1 }
```

---

## What this theme deliberately rejects

- Dark mode (Phase 2)
- Multiple accent colours
- Gradient backgrounds
- Glassmorphism / frosted glass effects
- Skeuomorphic icons
- Emoji-heavy UI
- Animated background patterns
- Custom font families
- Drop shadows on small elements (use borders)
- Border-radius below 6 or above 28 (stay in the iOS-native range)
- Any color outside the tokens above

---

## How to apply this in React Native

Expected file: `/lib/design/tokens.ts` exports all tokens. Every component imports from it:

```tsx
import { color, type, space, radius } from '@/lib/design/tokens'

export const Card = ({ children }) => (
  <View style={{
    backgroundColor: color.white,
    borderColor: color.gray200,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg
  }}>
    {children}
  </View>
)
```

If any new design need arises that isn't covered by these tokens, **add to the tokens file** rather than hardcoding the new value. The theme should grow by addition, not by exception.