// Veltai design tokens — the single source of truth for every visual value.
// Translated verbatim from docs/Design/Theme & Design Tokens.md.
//
// RULE: No file outside this one may contain a hardcoded color, spacing value,
// font size, border radius, shadow, opacity, or animation duration. If a new
// value is needed, ADD it here rather than hardcoding it elsewhere.
//
// NOTE on typography: the doc expresses styles as { size, weight, lineHeight }.
// We expose them with React-Native-native keys ({ fontSize, fontWeight,
// lineHeight }) so that `style={{ ...type.title1 }}` yields a valid RN TextStyle.

import type { TextStyle, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export const color = {
  // Foundation
  black: '#000000', // text, primary UI
  white: '#FFFFFF', // background, default

  // Grayscale hierarchy
  gray900: '#171717', // primary text alt (slightly softer than pure black for body)
  gray700: '#404040', // secondary text
  gray500: '#737373', // tertiary text, icons
  gray400: '#A3A3A3', // placeholder text
  gray300: '#D4D4D4', // dividers
  gray200: '#E5E5E5', // borders
  gray100: '#F5F5F5', // card backgrounds, subtle fills
  gray50: '#FAFAFA', //  section backgrounds

  // Accent — Veltai Green (the one and only accent)
  accent: '#16A34A', //      primary CTA, success states, active streak
  accentDark: '#15803D', //  pressed state
  accentLight: '#DCFCE7', // accent backgrounds, success toasts
  accentBorder: '#86EFAC', // borders on accent backgrounds
  accentText: '#15803D', //  accent text on accent-light bg (passes contrast)

  // Semantic
  warn: '#F59E0B', //        streak at risk, warning banners
  warnLight: '#FEF3C7',
  warnBorder: '#FCD34D',
  warnText: '#B45309', //    warn text on warn-light bg (passes contrast)

  error: '#DC2626', //       form errors, destructive actions
  errorLight: '#FEE2E2',
  errorBorder: '#FECACA',

  streakFire: '#F97316', //  streak flame icon ONLY

  // Additive (not in original doc — added here rather than hardcoded elsewhere)
  overlay: 'rgba(0, 0, 0, 0.45)', // modal/sheet scrim
  overlayStrong: 'rgba(0, 0, 0, 0.7)', // full-screen modal scrim (rank-up, lockout)
} as const;

// ---------------------------------------------------------------------------
// Typography (iOS system font — SF Pro)
// ---------------------------------------------------------------------------

export const type = {
  display: { fontSize: 34, fontWeight: '700', lineHeight: 40 }, // Rank-up moments
  title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 }, //  Screen titles
  title2: { fontSize: 22, fontWeight: '600', lineHeight: 28 }, //  Section headers
  title3: { fontSize: 20, fontWeight: '600', lineHeight: 25 }, //  Card titles
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24 }, //    Default body text
  bodyBold: { fontSize: 17, fontWeight: '600', lineHeight: 24 }, // Emphasis in body
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 22 }, //  Secondary descriptive
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 }, // Meta info, timestamps
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 14 }, //  Smallest labels

  // Number displays for stats
  statLarge: { fontSize: 48, fontWeight: '700', lineHeight: 52 }, //  Streak count, total XP
  statMedium: { fontSize: 32, fontWeight: '700', lineHeight: 36 }, // Macro totals
  statSmall: { fontSize: 22, fontWeight: '600', lineHeight: 26 }, //  Per-card stats
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

// ---------------------------------------------------------------------------
// Spacing — 8pt grid
// ---------------------------------------------------------------------------

export const space = {
  xs: 4, //    tight (icon + label gap)
  sm: 8, //    standard inner padding
  md: 12, //   between elements
  lg: 16, //   card padding, section gap
  xl: 24, //   between sections
  '2xl': 32, // between major sections
  '3xl': 48, // top of screen padding
  '4xl': 64, // hero-screen padding
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  sm: 6, //    small chips, badges
  md: 10, //   buttons, inputs
  lg: 14, //   cards
  xl: 20, //   sheets, modals
  '2xl': 28, // featured cards
  full: 9999, // pills, avatars
} as const;

// ---------------------------------------------------------------------------
// Shadow / elevation (use sparingly — most UI is flat with borders)
// ---------------------------------------------------------------------------

export const shadow = {
  none: {} as ViewStyle,

  // Subtle lift (prefer border in most cases)
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  // Floating action button, modal
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  // Bottom sheet
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
} as const satisfies Record<string, ViewStyle>;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const motion = {
  duration: {
    snap: 200, //   immediate feedback (button press)
    fast: 300, //   standard transition
    medium: 400, // fade in/out
    slow: 800, //   hero animations (XP float, rank-up)
    epic: 1200, //  milestone moments (confetti)
  },

  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  // Reanimated bezier control points mirroring the CSS easings above.
  bezier: {
    standard: [0.4, 0, 0.2, 1],
    enter: [0, 0, 0.2, 1],
    exit: [0.4, 0, 1, 1],
  },
} as const;

// ---------------------------------------------------------------------------
// Z-index
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  card: 10,
  fab: 20, //         floating action button
  bottomSheet: 30,
  topBanner: 40, //   in-app banners
  modal: 50, //       standard modal
  fullModal: 60, //   rank-up, milestone modals
  toast: 70, //       toasts always on top
  debug: 100, //      dev only
} as const;

// ---------------------------------------------------------------------------
// Layout / interaction (additive — for consistent tap targets & opacity)
// ---------------------------------------------------------------------------

export const layout = {
  tapTarget: 44, //   iOS HIG minimum tap target (pt)
  screenPadding: space.lg,
  hairline: 1, //     border width
  borderWidth: 1,
} as const;

export const opacity = {
  full: 1, //         high-confidence food item
  medium: 0.7,
  low: 0.45, //       low-confidence food item (uncertainty)
  disabled: 0.4,
  pressed: 0.85,
} as const;
