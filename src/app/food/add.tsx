// C2 · Add menu
// 2×3 grid of large tappable cards: Scan food, Barcode, Voice, Saved foods,
// My Meals, Quick Add. (Manual search lives in the food-log search bar, not here.
// No gym option.)
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { navigate, replace } from '@/lib/nav';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';

type Method = {
  icon: string;
  /** Functional accent for the tile's glyph — the tile itself stays monochrome. */
  tint: string;
  label: string;
  description: string;
  route: string;
  // 'replace' hands the sheet off to a full-screen flow; 'push' stacks a real
  // screen (My Meals) on top so back returns to the log.
  mode: 'replace' | 'push';
};

export default function AddMealScreen() {
  const { t } = useTranslation();
  // Slot targeting — the per-meal "+" on the food log passes ?slot=Breakfast etc.
  // Forwarded to the flows that can log into a chosen slot (Quick Add, Saved
  // foods). Scan/label/voice flows resolve their slot internally (slotForNow in
  // the scan seam) and can't consume it.
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const withSlot = (route: string) => (slot ? `${route}?slot=${slot}` : route);
  // Built in-component so the existing four cards keep their i18n keys while the
  // two new ones use literal strings (no en.json edit — a sibling owns it).
  const methods: Method[] = [
    { icon: 'camera', tint: categoryAccent.ai, label: t('addMenu.scanFood'), description: t('addMenu.snapMeal'), route: '/food/photo-capture', mode: 'replace' },
    { icon: 'barcode', tint: accent.green, label: t('addMenu.barcode'), description: t('addMenu.scanPackage'), route: '/food/barcode-scan', mode: 'replace' },
    { icon: 'reader-outline', tint: accent.blue, label: 'Scan Label', description: 'Read a nutrition facts panel', route: '/food/label-scan', mode: 'replace' },
    { icon: 'bookmark', tint: accent.turquoise, label: t('addMenu.savedFoods'), description: t('addMenu.oneTapReadd'), route: '/food/saved', mode: 'replace' },
    { icon: 'restaurant', tint: accent.yellow, label: 'My Meals', description: 'Log a saved meal or recipe', route: '/food/meals', mode: 'push' },
    { icon: 'flame', tint: categoryAccent.calories, label: 'Quick Add', description: 'Just calories, fast', route: '/food/quick-add', mode: 'replace' },
  ];
  return (
    <SheetContent variant="leading" title={t('addMenu.title')} onClose={() => router.canGoBack() && router.back()}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {methods.map((m) => (
          <Pressable
            key={m.route}
            // Replace the add-menu sheet with the chosen flow so it presents
            // cleanly full-screen (Scan/Barcode/Voice/Quick Add) instead of
            // stacking on top of the still-open sheet. My Meals pushes instead.
            onPress={() => (m.mode === 'push' ? navigate(withSlot(m.route)) : replace(withSlot(m.route)))}
            accessibilityLabel={`${m.label}. ${m.description}`}
            minTapTarget={false}
            // The design's chooser tile: a grey tile, a WHITE disc holding the
            // one accent glyph, then the title and its caption pinned to the
            // bottom. Pressed darkens the tile rather than fading it.
            style={({ pressed }) => ({
              width: '47.5%',
              minHeight: 148,
              backgroundColor: pressed ? surface.tilePressed : surface.tile,
              borderRadius: radius.lg,
              padding: space.lg,
              justifyContent: 'space-between',
              gap: space.sm,
            })}
          >
            <View
              style={{
                width: layout.tapTarget,
                height: layout.tapTarget,
                borderRadius: radius.full,
                backgroundColor: color.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.icon} size={20} color={m.tint} />
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="bodyMedium" color={color.label}>
                {m.label}
              </Text>
              <Text variant="caption" color={color.secondaryLabel}>
                {m.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SheetContent>
  );
}
