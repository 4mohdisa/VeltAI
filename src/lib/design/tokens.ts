// Veltai design tokens — the single source of truth for every visual value.
// FOUNDATION pass: Apple Health model — a monochrome base (black/white/greys
// aligned to Apple Health's exact values) plus a defined `accent` palette of
// Apple Health colours used FUNCTIONALLY ONLY (charts, AI accents, category /
// health icons, data viz, small status). Colour encodes meaning; it never
// decorates and never touches chrome or structure.
//
// RULE: No file outside this one may contain a hardcoded colour, spacing value,
// font size, border radius, shadow, opacity or animation duration.

import { PixelRatio } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Color — monochrome base. Structure, cards, chrome and body text use ONLY
// these. Greys match Apple Health's exact values.
// ---------------------------------------------------------------------------

export const color = {
  white: '#FFFFFF',
  light1: '#F2F2F7', //  primary card / tile fill (Apple Light_1)
  light2: '#E5E5EA', //  dividers, secondary fills (Apple Light_2)
  light3: '#D1D1D6', //  strong dividers, outline borders (Apple Light_3)
  black: '#000000',
  gray1: '#1C1C1E', //   near-black headings (Apple Gray_1)
  gray2: '#2C2C2E',
  gray3: '#3A3A3C',
  // WCAG AA (HIG §8.2): secondary text darkened so it clears 4.5:1 on white AND
  // on the grey card / grouped backgrounds (was #848484/#737373 → failed ~4.2 on
  // grey cards). #6B6B6B ≈ 4.8:1 on light1, 5.3:1 on white.
  secondary: '#6B6B6B', // secondary text, inactive icons
  gray800: '#171717', //  primary body text
  gray500: '#6B6B6B', //  secondary text (AA on all light surfaces)
  gray400: '#8A8A8A', //  placeholder / disabled / chevrons — ≥3:1 for UI glyphs
  gray50: '#FAFAFA', //   subtle zone background

  // Black alpha — modal/sheet scrims only (monochrome, allowed).
  overlay: 'rgba(0, 0, 0, 0.45)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',

  // ----------------------------------------------------------------------
  // Back-compat aliases — old grey names map to the closest new Apple Health
  // grey so existing component imports resolve. Removed as components migrate
  // to the new names in later prompts.
  // ----------------------------------------------------------------------
  gray900: '#1C1C1E', // → gray1
  gray700: '#171717', // → gray800
  gray600: '#6B6B6B', // → secondary (AA secondary text)
  gray300: '#D1D1D6', // → light3
  gray200: '#E5E5EA', // → light2
  gray150: '#E5E5EA', // → light2 (pressed)
  gray100: '#F2F2F7', // → light1

  // ----------------------------------------------------------------------
  // Semantic intent layer (HIG §3.0 — components reference intent, not raw
  // greys/hex). Fixed LIGHT values: the app is light-only by product decision,
  // so there are no light/dark variants. Monochrome only — NOT iOS system
  // colours. `primary` is the single action colour (black).
  // ----------------------------------------------------------------------
  label: '#171717', //          primary text (→ gray800)
  secondaryLabel: '#6B6B6B', //  secondary text — WCAG AA on all light surfaces
  tertiaryLabel: '#8A8A8A', //   placeholder / disabled / chevrons — ≥3:1 UI glyphs
  primary: '#000000', //         the one action colour (→ black)
  onPrimary: '#FFFFFF', //       content on a black surface (→ white)
} as const;

// ---------------------------------------------------------------------------
// Accent — Apple Health colours. FUNCTIONAL USE ONLY: charts, AI accents,
// category / health icons, data viz, small status moments. NEVER cards, chrome,
// buttons, structure or decoration.
// ---------------------------------------------------------------------------

export const accent = {
  orange: '#EC6330', //    energy / calories / streak flame (applied later)
  blue: '#3A82F7', //      activity / data
  turquoise: '#81CFFA', //
  red: '#EB4B62', //       heart / alerts (functional)
  green: '#67CE67', //     success / nutrition positive
  yellow: '#F1A33B', //    warnings / highlights (functional)
  purple: '#B25FEA', //    AI / sparkles
  ocean: '#87E3E1', //     hydration
} as const;

export type AccentKey = keyof typeof accent;

// Functional category → accent colour. Single source of truth so every macro /
// energy / AI surface uses the same colour everywhere (charts, bars, icons).
// Colour is applied ONLY to icons + chart elements — never tiles, text or chrome.
export const categoryAccent = {
  protein: accent.red, //     #EB4B62
  carbs: accent.yellow, //    #F1A33B
  fat: accent.blue, //        #3A82F7
  fibre: accent.turquoise, // #81CFFA
  calories: accent.orange, // energy family
  streak: accent.orange, //   streak flame (energy family)
  ai: accent.purple, //       AI / sparkles moments
  positive: accent.green, //  on-track / positive data series
} as const;

// ---------------------------------------------------------------------------
// Surface — fills over borders, remapped to the Apple Health greys.
// ---------------------------------------------------------------------------

export const surface = {
  background: color.white,
  backgroundAlt: color.gray50, //  section zones

  card: color.light1, //           primary card fill (NO border)
  cardElevated: color.white, //    white card on a grey zone (use shadow.sm)
  tile: color.light1, //           macro tiles, stat tiles
  tilePressed: color.light2, //    pressed state

  input: color.light1, //          filled input, no border
  inputFocused: color.white, //    white + 1px border on focus only

  divider: color.light2, //        use rarely — prefer spacing/fills
} as const;

// ---------------------------------------------------------------------------
// Typography — SF Pro Display (body/headings/labels/buttons) + SF Pro Rounded
// (stat numbers + display headings). Each token carries a `family` field; the
// `textStyle()` helper resolves it to the right iOS font.
// ---------------------------------------------------------------------------

export type FontFamily = 'display' | 'rounded';

export type TypeToken = {
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  lineHeight: number;
  family: FontFamily;
};

export const type = {
  // Display & headings
  display: { fontSize: 36, fontWeight: '800', lineHeight: 42, family: 'rounded' }, // big display moments
  title1: { fontSize: 30, fontWeight: '800', lineHeight: 36, family: 'display' }, //  screen titles
  title2: { fontSize: 22, fontWeight: '700', lineHeight: 28, family: 'display' }, //  section headers
  title3: { fontSize: 19, fontWeight: '600', lineHeight: 25, family: 'display' }, //  card titles

  // Body
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24, family: 'display' },
  bodyMedium: { fontSize: 17, fontWeight: '500', lineHeight: 24, family: 'display' },
  bodyBold: { fontSize: 17, fontWeight: '600', lineHeight: 24, family: 'display' },
  callout: { fontSize: 15, fontWeight: '400', lineHeight: 21, family: 'display' },

  // Small — labels & meta
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18, family: 'display' },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 16, family: 'display' },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14, family: 'display' },

  // Stat numbers — SF Pro Rounded, the heaviest type in the app
  statHero: { fontSize: 56, fontWeight: '800', lineHeight: 60, family: 'rounded' },
  statLarge: { fontSize: 40, fontWeight: '800', lineHeight: 44, family: 'rounded' },
  statMedium: { fontSize: 28, fontWeight: '700', lineHeight: 32, family: 'rounded' },
  statSmall: { fontSize: 20, fontWeight: '700', lineHeight: 24, family: 'rounded' },
} as const satisfies Record<string, TypeToken>;

export type TypeVariant = keyof typeof type;

// SF Pro Rounded faces by weight (loaded via expo-font in the root layout under
// these exact family names). The 'display' family uses San Francisco (system
// default — no explicit fontFamily). When a specific weighted face is used we
// do NOT also set fontWeight: the .otf already encodes the weight.
export const ROUNDED_FACE_BY_WEIGHT: Record<string, string> = {
  '600': 'SFProRounded-Semibold',
  '700': 'SFProRounded-Bold',
  '800': 'SFProRounded-Heavy',
};

/**
 * Resolve a type token into a valid React Native TextStyle (family → fontFamily).
 *
 * Dynamic Type (HIG §2.2): RN already scales `fontSize` at render when
 * allowFontScaling is on (the default — we never disable it). But an explicit
 * `lineHeight` does NOT scale and would clip ascenders/descenders at large
 * sizes, so we scale lineHeight by the current font scale to keep pace. We pass
 * the base fontSize (RN applies the scale) to avoid double-scaling.
 */
export function textStyle(variant: TypeVariant): TextStyle {
  const t = type[variant];
  const scaledLineHeight = t.lineHeight * PixelRatio.getFontScale();
  if (t.family === 'rounded') {
    const face = ROUNDED_FACE_BY_WEIGHT[String(t.fontWeight)] ?? 'SFProRounded-Bold';
    return { fontSize: t.fontSize, lineHeight: scaledLineHeight, fontFamily: face };
  }
  return { fontSize: t.fontSize, fontWeight: t.fontWeight, lineHeight: scaledLineHeight };
}

/**
 * Large-size row handling (HIG §2.2b): crowded one-line rows (label + value)
 * should stack vertically instead of truncating once the user's text size is
 * large. Read at render; true at ~AX1 and above.
 */
export const LARGE_TEXT_THRESHOLD = 1.5;
export function isLargeTextScale(): boolean {
  return PixelRatio.getFontScale() >= LARGE_TEXT_THRESHOLD;
}

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
  cornerRadius: 28,
  grabberVisible: true,
  detents: ['medium', 'large'] as const,
} as const;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const motion = {
  duration: {
    snap: 180,
    fast: 260,
    medium: 380,
    slow: 700,
    epic: 1100,
  },
  // Timing curves only — no spring physics anywhere (no bounce/overshoot).
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
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
// Layout / interaction
// ---------------------------------------------------------------------------

export const layout = {
  tapTarget: 44,
  buttonHeight: 52,
  screenPadding: space.xl,
  hairline: 1,
  borderWidth: 1,
} as const;

export const opacity = {
  full: 1,
  medium: 0.7,
  low: 0.45,
  disabled: 0.4,
  pressed: 0.85,
} as const;
