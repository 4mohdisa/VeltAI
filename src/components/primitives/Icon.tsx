// Icon — the single icon primitive. Wraps expo-symbols' SymbolView so every
// glyph is a native SF Symbol, monochrome (black active / gray500 inactive).
// Replaces all Ionicons usage.
//
// It accepts either a real SF Symbol name (e.g. "flame.fill") OR one of the
// legacy Ionicons names used across the app, which it maps to the SF Symbol
// equivalent — so call sites migrate by simply swapping <Ionicons/> → <Icon/>.
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { color as colors } from '@/lib/design/tokens';

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
  // actions
  add: 'plus',
  'add-circle-outline': 'plus.circle',
  remove: 'minus',
  'remove-circle-outline': 'minus.circle',
  close: 'xmark',
  'close-circle': 'xmark.circle.fill',
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark.circle.fill',
  pencil: 'pencil',
  create: 'square.and.pencil',
  'create-outline': 'square.and.pencil',
  eye: 'eye.fill',
  refresh: 'arrow.clockwise',
  search: 'magnifyingglass',
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
};

export function Icon({ name, size = 20, color = colors.black, weight = 'regular', style, accessibilityLabel }: IconProps) {
  const symbol = (SF[name] ?? name) as SymbolViewProps['name'];
  return (
    <SymbolView
      name={symbol}
      size={size}
      tintColor={color}
      weight={weight}
      type="monochrome"
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
