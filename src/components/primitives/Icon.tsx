// Icon — the single icon primitive. Wraps expo-symbols' SymbolView so every
// glyph is a native SF Symbol. Replaces all Ionicons usage.
//
// It accepts either a real SF Symbol name (e.g. "flame.fill") OR one of the
// legacy Ionicons names used across the app, which it maps to the SF Symbol
// equivalent — so call sites migrate by simply swapping <Ionicons/> → <Icon/>.
//
// COLOUR CONVENTION (Apple Health model):
//   1. Monochrome (default, the majority): navigation chrome, tab bar, back /
//      close, chevrons, settings and any STRUCTURAL icon → `color.black`
//      (active/primary) or `color.secondary` (inactive/secondary).
//   2. Coloured (functional only): health/category and data icons MAY use an
//      `accent.*` colour where the colour ENCODES a category or an AI/data
//      moment — e.g. macro categories, AI `sparkles`, calories/energy `flame`,
//      hydration, sleep. See `iconAccents` below for the intended mapping.
//      (Accents are NOT applied to existing screens in this prompt — a later
//      prompt wires them onto charts / AI / categories.)
// The streak flame MAY be `accent.orange` (energy/calorie family) — applied in a
// later prompt, not here. The primitive already supports any colour.
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { accent, color as colors } from '@/lib/design/tokens';

// Legacy (Ionicons) name → SF Symbol. Unknown names pass through unchanged,
// so passing a real SF Symbol name also works.
const SF: Record<string, string> = {
  // tabs / navigation
  home: 'house.fill',
  'home-outline': 'house',
  restaurant: 'fork.knife',
  'restaurant-outline': 'fork.knife',
  barbell: 'dumbbell.fill',
  'barbell-outline': 'dumbbell',
  person: 'person.fill',
  'person-outline': 'person',
  'chevron-back': 'chevron.left',
  'chevron-forward': 'chevron.right',
  // actions (canonical SF Symbols — HIG §10)
  add: 'plus',
  'add-circle': 'plus.circle.fill',
  'add-circle-outline': 'plus.circle',
  remove: 'minus',
  'remove-circle-outline': 'minus.circle',
  close: 'xmark',
  'close-circle': 'xmark.circle.fill',
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark.circle.fill',
  pencil: 'pencil',
  create: 'square.and.pencil', //           Edit
  'create-outline': 'square.and.pencil',
  eye: 'eye.fill',
  'eye-off': 'eye.slash.fill', //           muted variant (*.slash)
  refresh: 'arrow.clockwise', //            Sync
  search: 'magnifyingglass',
  filter: 'line.3.horizontal.decrease', //  Filter
  share: 'square.and.arrow.up', //          Share
  'share-outline': 'square.and.arrow.up',
  ellipsis: 'ellipsis', //                  More
  'ellipsis-horizontal': 'ellipsis',
  list: 'list.bullet', //                   List
  'stats-chart': 'chart.bar.fill', //       Charts
  'person-circle': 'person.crop.circle', // Account
  bookmark: 'bookmark',
  'bookmark-outline': 'bookmark',
  'bookmark-fill': 'bookmark.fill',
  'flag-outline': 'flag',
  flag: 'flag.fill',
  stop: 'stop.fill',
  // domain glyphs
  flame: 'flame.fill',
  'flame-outline': 'flame',
  snow: 'snowflake',
  'lock-closed': 'lock.fill',
  'lock-closed-outline': 'lock.fill',
  'lock-open': 'lock.open.fill',
  'lock-open-outline': 'lock.open',
  sparkles: 'sparkles',
  'sparkles-outline': 'sparkles',
  heart: 'heart.fill',
  'heart-outline': 'heart',
  camera: 'camera.fill',
  'camera-outline': 'camera',
  mic: 'mic.fill',
  barcode: 'barcode.viewfinder',
  'barcode-outline': 'barcode.viewfinder',
  trophy: 'trophy.fill',
  warning: 'exclamationmark.triangle.fill',
  'alert-circle': 'exclamationmark.circle.fill',
  'alert-circle-outline': 'exclamationmark.circle',
  image: 'photo',
  apps: 'square.grid.2x2.fill',
  'apps-outline': 'square.grid.2x2',
  'fast-food': 'takeoutbag.and.cup.and.straw.fill',
  time: 'clock.fill',
  'time-outline': 'clock',
  shield: 'shield.fill',
  'shield-checkmark-outline': 'checkmark.shield.fill',
  // settings list
  'settings-outline': 'gearshape.fill',
  'card-outline': 'creditcard.fill',
  'notifications-outline': 'bell.fill',
  'options-outline': 'slider.horizontal.3',
  'help-circle-outline': 'questionmark.circle',
  'information-circle': 'info.circle.fill',
  'information-circle-outline': 'info.circle',
  'mail-outline': 'envelope.fill',
  mail: 'envelope.fill',
  'document-text-outline': 'doc.text',
  'reader-outline': 'doc.plaintext',
  'document-outline': 'doc',
  'download-outline': 'arrow.down.circle',
  'trash-outline': 'trash',
  trash: 'trash.fill',
  'walk-outline': 'figure.walk',
  'bed-outline': 'bed.double.fill',
  calendar: 'calendar',
  'calendar-outline': 'calendar',
  'moon-outline': 'moon.fill',
  moon: 'moon.fill',
  'sunny-outline': 'sun.max.fill',
  sunny: 'sun.max.fill',
  'pricetag-outline': 'tag.fill',
  'construct-outline': 'wrench.and.screwdriver.fill',
  'people-outline': 'person.2.fill',
  'logo-apple': 'apple.logo',
  'logo-google': 'g.circle.fill',
};

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
  style?: SymbolViewProps['style'];
  accessibilityLabel?: string;
  /** Optional SF Symbol effect (e.g. { effect: 'bounce' }) — HIG §9B. Use
   *  sparingly and only where it adds meaning; callers should gate it behind
   *  Reduce Motion (useReduceMotion). */
  animationSpec?: SymbolViewProps['animationSpec'];
};

export function Icon({
  name,
  size = 20,
  color = colors.black,
  weight = 'regular',
  style,
  accessibilityLabel,
  animationSpec,
}: IconProps) {
  const symbol = (SF[name] ?? name) as SymbolViewProps['name'];
  return (
    <SymbolView
      name={symbol}
      size={size}
      tintColor={color}
      weight={weight}
      type="monochrome"
      resizeMode="scaleAspectFit"
      animationSpec={animationSpec}
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

// Reference map: which functional icons get which Apple Health accent colour.
// NOT applied automatically — a later prompt opts specific charts / AI / category
// icons into these by passing `color={iconAccents.flame}` etc. Default Icon usage
// stays monochrome (color.black / color.secondary).
export const iconAccents = {
  flame: accent.orange, //        energy / calories / streak
  sparkles: accent.purple, //     AI moments
  protein: accent.red, //         macro category
  carbs: accent.yellow, //        macro category
  fat: accent.blue, //            macro category
  fibre: accent.turquoise, //     macro category
  heart: accent.red, //           heart / health
  hydration: accent.ocean, //     water
  sleep: accent.purple, //        sleep
} as const;
