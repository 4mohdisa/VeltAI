# Theme & Design Tokens

# Theme & Design Tokens

Concrete design tokens for Veltai. Lives at `/lib/design/tokens.ts` and is the single source of truth for every visual value in the app.

**Design language: pure monochrome, Cal AI-clean.** Black, white, and a grey scale. No other colour anywhere — no green, no orange, no semantic red/amber. Hierarchy comes entirely from type weight, size, spacing, and grey fills.

---

## Philosophy

The cleanliness comes from five disciplines, not from colour:

1. **Monochrome only.** Black, white, greys. Nothing else. A single black-filled button is the brightest thing on any screen.
2. **Fills, not borders.** Cards are defined by a light grey fill on white, not a 1px border. This is the single biggest driver of the clean look. Borders are a last resort.
3. **Two type weights, high contrast.** Numbers and key values are big and heavy. Labels are small and grey. Almost nothing in between. This creates hierarchy without colour.
4. **Heavy rounding.** Buttons are full pills. Cards have large soft radii. Rounded reads as friendly-premium; sharp reads as utilitarian.
5. **Generous vertical rhythm.** Real breathing room between every block. Cramped spacing is what makes an app look like default React Native.

### The hierarchy rule (critical for monochrome)

Because colour can't signal importance, every screen follows this:

- **Exactly one primary action**, rendered as a **solid black pill with white text**. Never two black buttons on one screen.
- **Secondary actions** are outlined (1px black or grey border, transparent fill) or text-only.
- **Surfaces** recede via grey fills (`gray50` / `gray100`), never compete with content.
- **Key numbers** are the heaviest, largest type on the screen — they earn attention through weight, not colour.

---

## Color tokens

Pure monochrome. This is the entire palette. There is nothing else.

```tsx
export const color = {
  black:   '#000000',   // text, primary buttons, active states, key numbers, icons
  white:   '#FFFFFF',   // page background, text on black

  // Grey scale — does all the work that colour used to
  gray900: '#0A0A0A',   // near-black, heavy headings
  gray800: '#171717',   // primary body text (softer than pure black)
  gray700: '#404040',   // strong secondary text
  gray600: '#525252',   // secondary text
  gray500: '#737373',   // tertiary text, captions, inactive icons
  gray400: '#A3A3A3',   // placeholder text, disabled
  gray300: '#D4D4D4',   // strong dividers, outline-button borders
  gray200: '#E5E5E5',   // hairline dividers (rare — prefer fills)
  gray150: '#EEEEEE',   // pressed-state fill on grey surfaces
  gray100: '#F4F4F5',   // primary card / tile fill
  gray50:  '#FAFAFA',   // section background, subtle zone fill
}
```

That's it. No accent object. No semantic object. If a design needs to signal "success" or "danger," it does so with **weight, iconography (SF Symbol), and copy** — not colour.

### Where the old colours went

| Was | Now |
| --- | --- |
| Accent green (CTAs, streak, XP) | `black` |
| Streak flame orange | `black` (monochrome SF Symbol flame) |
| Macro icons (red/orange/blue) | `gray500` SF Symbols |
| Warn amber (streak at risk) | `black` text + `gray100` fill, heavier weight |
| Error red (destructive) | `black` text/border; destructive intent carried by copy + confirmation, not colour |
| Success green | `black` checkmark SF Symbol |

### Usage rules

| Token | Use for |
| --- | --- |
| `black` | The one primary button per screen, key numbers, active tab, primary icons, headings that must dominate |
| `white` | Page background; text/icons on black surfaces |
| `gray800` | Default body text |
| `gray500` | Captions, labels, timestamps, inactive icons |
| `gray300` | Outline button borders, strong dividers |
| `gray100` | Card and tile fills (the default surface) |
| `gray50` | Section backgrounds, the zone behind cards |

**Never:** any hue. No green, orange, red, amber, blue. No gradients. No glass. If you're reaching for colour to show state, you're solving it wrong — use weight, size, a filled vs outlined shape, or an SF Symbol.

---

## Typography tokens

iOS system font (SF Pro). The weight contrast is deliberately extreme — heavy numbers, light labels, little in between.

```tsx
export const type = {
  // Display & headings — heavy
  display:    { size: 36, weight: '800', lineHeight: 42 },  // rank-up / milestone moments
  title1:     { size: 30, weight: '800', lineHeight: 36 },  // screen titles ("Today", "Progress")
  title2:     { size: 22, weight: '700', lineHeight: 28 },  // section headers
  title3:     { size: 19, weight: '600', lineHeight: 25 },  // card titles

  // Body — regular
  body:       { size: 17, weight: '400', lineHeight: 24 },  // default body
  bodyMedium: { size: 17, weight: '500', lineHeight: 24 },  // mild emphasis
  bodyBold:   { size: 17, weight: '600', lineHeight: 24 },  // button labels, strong emphasis
  callout:    { size: 15, weight: '400', lineHeight: 21 },  // secondary descriptive

  // Small — labels & meta
  footnote:   { size: 13, weight: '400', lineHeight: 18 },  // meta, timestamps
  label:      { size: 13, weight: '600', lineHeight: 16 },  // uppercase tile labels
  caption:    { size: 11, weight: '500', lineHeight: 14 },  // smallest labels

  // Stat numbers — the heaviest type in the app
  statHero:   { size: 56, weight: '800', lineHeight: 60 },  // the one big number on a screen (streak, calories)
  statLarge:  { size: 40, weight: '800', lineHeight: 44 },  // total XP, big totals
  statMedium: { size: 28, weight: '700', lineHeight: 32 },  // macro values, card numbers
  statSmall:  { size: 20, weight: '700', lineHeight: 24 },  // inline stats
}
```

Labels under stats are always `label` or `caption` in `gray500`, uppercase, letter-spaced. The heavy number + tiny grey label pairing is the core Cal AI motif — use it for every stat.

### Dynamic Type

All styles respect iOS Dynamic Type. Never hardcode `fontSize` outside this token.

---

## Spacing tokens — generous rhythm

Increased from the old scale to give Cal AI's breathing room. Cards get more internal padding; sections get more separation.

```tsx
export const space = {
  xs:    4,    // icon-to-label gap
  sm:    8,    // tight inner spacing
  md:    12,   // between related elements
  lg:    16,   // standard element gap
  xl:    20,   // card inner padding (default)
  '2xl': 28,   // between cards
  '3xl': 36,   // between sections
  '4xl': 48,   // major section breaks
  '5xl': 64,   // screen top padding / hero spacing
}
```

Defaults that create the look:

- **Card padding:** `xl` (20) minimum, `2xl` (28) for hero cards
- **Gap between cards:** `2xl` (28)
- **Screen horizontal margin:** `xl` (20)
- **Section title to content:** `lg` (16)

Use named values. Never raw numbers.

---

## Border radius tokens — heavily rounded

Pushed up across the board. This is a deliberate, visible change from the old scale.

```tsx
export const radius = {
  none:  0,
  sm:    10,    // small chips, badges, inline tags
  md:    16,    // inputs, small tiles
  lg:    20,    // standard cards
  xl:    28,    // large cards, sheets, modals
  '2xl': 36,    // hero / featured cards
  pill:  999,   // all buttons, segmented controls, selection chips
  full:  9999,  // avatars, circular icon buttons
}
```

Rules:

- **All buttons → `pill`.** Primary, secondary, destructive, every button is fully rounded.
- **Selection chips, segmented controls → `pill`.**
- **Cards → `lg` (20)** default, `xl` (28) for featured.
- **Inputs / small tiles → `md` (16).**
- **Sheets → `xl` (28)** top corners (matches the native sheet corner radius below).

---

## Surface tokens — fills over borders

New section. This encodes the most important visual rule: surfaces are grey fills, not borders.

```tsx
export const surface = {
  // Page
  background:      color.white,
  backgroundAlt:   color.gray50,    // section zones

  // Cards & tiles — the default is a grey fill on white, NO border
  card:            color.gray100,   // primary card fill
  cardElevated:    color.white,     // white card on a gray50 zone (use shadow.sm)
  tile:            color.gray100,   // macro tiles, stat tiles
  tilePressed:     color.gray150,   // pressed state

  // Inputs
  input:           color.gray100,   // filled input, no border
  inputFocused:    color.white,     // white + 1px black border on focus only

  // Dividers (use rarely — prefer spacing or fills to separate)
  divider:         color.gray200,
}
```

The default card is `gray100` fill, no border, on a white page. When cards need to sit on a grey zone, flip: white card + `shadow.sm` on `gray50` background. Never both a border and a fill.

---

## Shadow / elevation

Very soft, very sparing. Used only to lift a white card off a grey zone, or for floating elements. Never on grey-filled cards (the fill already separates them).

```tsx
export const shadow = {
  none: 'none',

  // Barely-there lift for white cards on grey zones
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  // Floating action button, raised sheet
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  // Modals, peak sheets
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
}
```

---

## Native sheet tokens

For the native detented sheets (see UI & Design System). These match iOS `UISheetPresentationController`.

```tsx
export const sheet = {
  cornerRadius:    28,          // matches radius.xl, set on react-native-screens
  grabberVisible:  true,
  detents:         ['medium', 'large'],  // or 'fitToContents' for short sheets
}
```

---

## Animation tokens

```tsx
export const motion = {
  duration: {
    snap:   180,    // button press feedback
    fast:   260,    // standard transition
    medium: 380,    // fade / slide
    slow:   700,    // hero animations (XP float, rank-up)
    epic:  1100,    // milestone moments
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter:    'cubic-bezier(0, 0, 0.2, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)',
    spring:   { damping: 18, stiffness: 180 },  // for Reanimated withSpring
  },
}
```

All continuous animation on the UI thread via Reanimated 3 worklets. Respect Reduce Motion (skip to end state).

---

## Z-index tokens

```tsx
export const zIndex = {
  base:        0,
  card:        10,
  fab:         20,
  bottomSheet: 30,
  topBanner:   40,
  modal:       50,
  fullModal:   60,
  toast:       70,
  debug:       100,
}
```

---

## Component-level shorthand

Each component composes from tokens, never hardcodes. These reflect the new monochrome + fills + pills + rhythm.

### Card (default — grey fill, no border)

```tsx
{
  backgroundColor: surface.card,    // gray100
  borderRadius: radius.lg,          // 20
  padding: space.xl,                // 20
  // no border, no shadow
}
```

### Card (elevated — white on grey zone)

```tsx
{
  backgroundColor: surface.cardElevated,  // white
  borderRadius: radius.lg,
  padding: space.xl,
  ...shadow.sm,
}
```

### Primary button (the one black button)

```tsx
// Container
{
  backgroundColor: color.black,
  borderRadius: radius.pill,        // fully rounded
  paddingVertical: space.lg,        // 16 — taller, more presence
  paddingHorizontal: space['2xl'],  // 28
  minHeight: 52,                    // bigger than the 44 minimum for presence
  alignItems: 'center',
  justifyContent: 'center',
}
// Text
{ ...type.bodyBold, color: color.white }
```

### Secondary button (outline)

```tsx
{
  backgroundColor: 'transparent',
  borderColor: color.gray300,
  borderWidth: 1,
  borderRadius: radius.pill,
  paddingVertical: space.lg,
  paddingHorizontal: space['2xl'],
  minHeight: 52,
}
// Text: type.bodyBold, color.black
```

### Destructive button (monochrome — intent via copy + confirm, not colour)

```tsx
{
  backgroundColor: 'transparent',
  borderColor: color.gray300,
  borderWidth: 1,
  borderRadius: radius.pill,
  minHeight: 52,
}
// Text: type.bodyBold, color.black
// The destructive nature is carried by the confirmation sheet copy,
// not by red colour. Label is explicit, e.g. "Delete account".
```

### Selection chip (pill)

```tsx
// Unselected
{
  backgroundColor: surface.card,    // gray100
  borderRadius: radius.pill,
  paddingVertical: space.md,
  paddingHorizontal: space.xl,
}
// Text: type.bodyMedium, color.gray700

// Selected — solid black (the Cal AI duration-chip pattern)
{
  backgroundColor: color.black,
  borderRadius: radius.pill,
}
// Text: type.bodyMedium, color.white
```

### Input field (filled, no border)

```tsx
{
  backgroundColor: surface.input,   // gray100
  borderRadius: radius.md,          // 16
  paddingVertical: space.lg,
  paddingHorizontal: space.xl,
  fontSize: type.body.size,
  minHeight: 52,
  // no border by default
}
// Focus: backgroundColor white + borderColor black, borderWidth 1
```

### Stat tile (the macro motif — grey tile, SF Symbol, heavy number, grey label)

```tsx
// Tile
{
  backgroundColor: surface.tile,    // gray100
  borderRadius: radius.md,          // 16
  padding: space.lg,
}
// SF Symbol icon: gray500, size ~18
// Label (e.g. "Protein"): type.label, gray500
// Value (e.g. "96g"): type.statSmall or statMedium, color.black
```

### Section header

```tsx
{
  ...type.title2,                   // 22 / 700
  color: color.black,
  marginBottom: space.lg,
}
```

### Stat hero (the one big number — e.g. streak, daily calories)

```tsx
// Number
{ ...type.statHero, color: color.black }   // 56 / 800, black not green
// Label below
{ ...type.label, color: color.gray500, textTransform: 'uppercase', letterSpacing: 1.5 }
```

---

## What this theme deliberately rejects

- **Any colour beyond black/white/grey** — no green, orange, red, amber, blue, anywhere
- Borders as the primary way to define cards (use grey fills)
- More than one black-filled button per screen
- Small or sharp corner radii on buttons (everything is a pill)
- Cramped spacing (rhythm is generous)
- Medium type weights doing hierarchy work that weight contrast should do
- Dark mode (Phase 2)
- Gradients, glassmorphism, skeuomorphism
- Emoji in UI
- Custom font families (SF Pro only)
- Colour used to signal state (use weight, shape, SF Symbol, copy)

---

## How to apply in React Native

```tsx
import { color, type, space, radius, surface } from '@/lib/design/tokens'

export const Card = ({ children }) => (
  <View style={{
    backgroundColor: surface.card,   // grey fill
    borderRadius: radius.lg,         // 20, soft
    padding: space.xl,               // 20, generous
  }}>
    {children}
  </View>
)
```

If a new design need arises that the tokens don't cover, **add to the tokens file** — but never add a colour. The palette is closed. The theme grows by addition of greys, spacing, radii, and type styles only.