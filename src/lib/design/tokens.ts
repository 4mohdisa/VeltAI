// Veltai design tokens — the single source of truth for every visual value.
// Translated from docs/Design/Theme & Design Tokens.md (MONOCHROME pass).
//
// Design language: pure monochrome, Cal AI-clean. Black, white, and a grey
// scale — no other colour anywhere. Hierarchy comes from type weight, size,
// spacing and grey fills, never colour.
//
// RULE: No file outside this one may contain a hardcoded colour, spacing value,
// font size, border radius, shadow, opacity or animation duration. The palette
// is CLOSED — the theme grows only by adding greys, spacing, radii and type.
//
// NOTE on typography: the doc expresses styles as { size, weight, lineHeight }.
// We expose them with RN-native keys ({ fontSize, fontWeight, lineHeight }) so
// that `style={{ ...type.title1 }}` yields a valid RN TextStyle.

import type { TextStyle, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Color — pure monochrome. This is the entire palette.
// ---------------------------------------------------------------------------

export const color = {
  black: '#000000', // text, primary buttons, active states, key numbers, icons
  white: '#FFFFFF', // page background, text on black

  // Grey scale — does all the work colour used to.
  gray900: '#0A0A0A', // near-black, heavy headings
  gray800: '#171717', // primary body text (softer than pure black)
  gray700: '#404040', // strong secondary text
  gray600: '#525252', // secondary text
  gray500: '#737373', // tertiary text, captions, inactive icons
  gray400: '#A3A3A3', // placeholder text, disabled
  gray300: '#D4D4D4', // strong dividers, outline-button borders
  gray200: '#E5E5E5', // hairline dividers (rare — prefer fills)
  gray150: '#EEEEEE', // pressed-state fill on grey surfaces
  gray100: '#F4F4F5', // primary card / tile fill
  gray50: '#FAFAFA', //  section background, subtle zone fill

  // Black alpha — for modal/sheet scrims only (monochrome, allowed).
  overlay: 'rgba(0, 0, 0, 0.45)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',

  // ----------------------------------------------------------------------
  // TEMPORARY compatibility aliases (all map to monochrome). These let the
  // app compile + render monochrome immediately; call sites are migrated to
  // the real tokens during R3–R5 and this block is DELETED in R6.
  // ----------------------------------------------------------------------
  accent: '#000000', //       was Veltai green → black
  accentDark: '#000000',
  accentText: '#000000',
  accentLight: '#F4F4F5', //  → gray100 fill
  accentBorder: '#D4D4D4', // → gray300
  warn: '#000000', //         was amber → black
  warnLight: '#F4F4F5',
  warnBorder: '#D4D4D4',
  warnText: '#404040', //     → gray700
  error: '#000000', //        was red → black (intent via copy/confirm)
  errorLight: '#F4F4F5',
  errorBorder: '#D4D4D4',
  streakFire: '#000000', //   was orange → black flame
} as const;

// ---------------------------------------------------------------------------
// Surface — fills over borders. The most important visual rule.
// ---------------------------------------------------------------------------

export const surface = {
  background: color.white,
  backgroundAlt: color.gray50, // section zones

  card: color.gray100, //         primary card fill (NO border)
  cardElevated: color.white, //   white card on a grey zone (use shadow.sm)
  tile: color.gray100, //         macro tiles, stat tiles
  tilePressed: color.gray150, //  pressed state

  input: color.gray100, //        filled input, no border
  inputFocused: color.white, //   white + 1px black border on focus only

  divider: color.gray200, //      use rarely — prefer spacing/fills
} as const;

// ---------------------------------------------------------------------------
// Typography — extreme weight contrast (heavy numbers, light labels).
// ---------------------------------------------------------------------------

export const type = {
  // Display & headings — heavy
  display: { fontSize: 36, fontWeight: '800', lineHeight: 42 }, // rank-up / milestone
  title1: { fontSize: 30, fontWeight: '800', lineHeight: 36 }, //  screen titles
  title2: { fontSize: 22, fontWeight: '700', lineHeight: 28 }, //  section headers
  title3: { fontSize: 19, fontWeight: '600', lineHeight: 25 }, //  card titles

  // Body — regular
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24 }, //       default body
  bodyMedium: { fontSize: 17, fontWeight: '500', lineHeight: 24 }, // mild emphasis
  bodyBold: { fontSize: 17, fontWeight: '600', lineHeight: 24 }, //   button labels
  callout: { fontSize: 15, fontWeight: '400', lineHeight: 21 }, //    secondary descriptive

  // Small — labels & meta
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 }, // meta, timestamps
  label: { fontSize: 13, fontWeight: '600', lineHeight: 16 }, //    uppercase tile labels
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14 }, //  smallest labels

  // Stat numbers — the heaviest type in the app
  statHero: { fontSize: 56, fontWeight: '800', lineHeight: 60 }, //   the one big number
  statLarge: { fontSize: 40, fontWeight: '800', lineHeight: 44 }, //  big totals
  statMedium: { fontSize: 28, fontWeight: '700', lineHeight: 32 }, // macro values
  statSmall: { fontSize: 20, fontWeight: '700', lineHeight: 24 }, //  inline stats
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

// ---------------------------------------------------------------------------
// Spacing — generous rhythm
// ---------------------------------------------------------------------------

export const space = {
  xs: 4, //    icon-to-label gap
  sm: 8, //    tight inner spacing
  md: 12, //   between related elements
  lg: 16, //   standard element gap
  xl: 20, //   card inner padding (default)
  '2xl': 28, // between cards
  '3xl': 36, // between sections
  '4xl': 48, // major section breaks
  '5xl': 64, // screen top padding / hero spacing
} as const;

// ---------------------------------------------------------------------------
// Border radius — heavily rounded
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  sm: 10, //   small chips, badges, inline tags
  md: 16, //   inputs, small tiles
  lg: 20, //   standard cards
  xl: 28, //   large cards, sheets, modals
  '2xl': 36, // hero / featured cards
  pill: 999, // all buttons, segmented controls, selection chips
  full: 9999, // avatars, circular icon buttons
} as const;

// ---------------------------------------------------------------------------
// Shadow / elevation — very soft, very sparing
// ---------------------------------------------------------------------------

export const shadow = {
  // none kept as an empty style (not the doc's 'none' string) so `...shadow.none`
  // stays spread-safe in component styles.
  none: {} as ViewStyle,

  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

// ---------------------------------------------------------------------------
// Native sheet tokens (UISheetPresentationController)
// ---------------------------------------------------------------------------

export const sheet = {
  cornerRadius: 28, // matches radius.xl, set on react-native-screens
  grabberVisible: true,
  detents: ['medium', 'large'] as const,
} as const;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const motion = {
  duration: {
    snap: 180, //   button press feedback
    fast: 260, //   standard transition
    medium: 380, // fade / slide
    slow: 700, //   hero animations (XP float, rank-up)
    epic: 1100, //  milestone moments
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: { damping: 18, stiffness: 180 }, // for Reanimated withSpring
  },
} as const;

// ---------------------------------------------------------------------------
// Z-index
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  card: 10,
  fab: 20,
  bottomSheet: 30,
  topBanner: 40,
  modal: 50,
  fullModal: 60,
  toast: 70,
  debug: 100,
} as const;

// ---------------------------------------------------------------------------
// Layout / interaction (non-colour helpers — kept for consistent tap targets)
// ---------------------------------------------------------------------------

export const layout = {
  tapTarget: 44, //     iOS HIG minimum tap target (pt)
  buttonHeight: 52, //  primary button height (presence)
  screenPadding: space.xl,
  hairline: 1,
  borderWidth: 1,
} as const;

export const opacity = {
  full: 1, //      high-confidence food item
  medium: 0.7,
  low: 0.45, //    low-confidence food item (uncertainty)
  disabled: 0.4,
  pressed: 0.85,
} as const;
