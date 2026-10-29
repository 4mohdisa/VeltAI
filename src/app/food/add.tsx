// C2 · Add menu
// The design's chooser: a 2-column grid of four tiles — Search foods, Scan food,
// Barcode, My dishes — over Quick add as a full-width row. The title names the
// meal the "+" was tapped on ("Add to lunch").
//
// The design has ONE scanner with Meal/Label/Barcode modes and ONE saved-item
// concept, so it has no Scan Label tile and no My Meals tile. Both routes still
// exist — they are simply not offered here.
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { replace } from '@/lib/nav';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';

/** The design's tile metrics: a 46pt white disc holding a 19pt glyph, a 148pt
 *  square tile, and the 88pt full-width Quick add row. No token covers any of
 *  them, and the 1pt label-to-caption gap is tighter than the spacing scale. */
const TILE_DISC = 46;
const TILE_GLYPH = 19;
const TILE_HEIGHT = 148;
const WIDE_TILE_HEIGHT = 88;
const TEXT_GAP = 1;

type Method = {
  icon: string;
  /** Functional accent for the tile's glyph — the tile itself stays monochrome. */
  tint: string;
  label: string;
  description: string;
  route: string;
  /** Quick add spans both columns as a short row (the design's `grid-column: span 2`). */
  wide?: boolean;
};

export default function AddMealScreen() {
  const { t } = useTranslation();
  // Slot targeting — the per-meal "+" on the food log passes ?slot=Breakfast etc.
  // Forwarded to the flows that can log into a chosen slot (Quick add, My
  // dishes). Scan flows resolve their slot internally (slotForNow in the scan
  // seam) and can't consume it.
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  // Routes may already carry a query of their own (Search foods asks the food
  // tab to open focused), so pick the separator rather than always '?'.
  const withSlot = (route: string) =>
    slot ? `${route}${route.includes('?') ? '&' : '?'}slot=${slot}` : route;
  // The design titles the sheet after the meal that was tapped; opened from the
  // global "+" there is no meal to name, so the generic title stands.
  const title = slot ? `Add to ${slot.toLowerCase()}` : t('addMenu.title');
  // Subtitles that have an en.json key use it; the rest stay literal until the
  // sibling that owns en.json adds keys for them.
  const methods: Method[] = [
    { icon: 'search', tint: accent.blue, label: 'Search foods', description: 'Apple, banana, Indomie…', route: '/(tabs)/food?focus=search' },
    { icon: 'camera', tint: categoryAccent.ai, label: t('addMenu.scanFood'), description: t('addMenu.mealPhotoOrLabel'), route: '/food/photo-capture' },
    { icon: 'barcode', tint: accent.green, label: t('addMenu.barcode'), description: t('addMenu.exactDatabaseMatch'), route: '/food/barcode-scan' },
    { icon: 'image', tint: accent.turquoise, label: 'My dishes', description: t('addMenu.savedGallery'), route: '/food/saved' },
    { icon: 'flame', tint: categoryAccent.calories, label: 'Quick add', description: 'Just calories, fast', route: '/food/quick-add', wide: true },
  ];
  return (
    <SheetContent variant="leading" title={title} onClose={() => router.canGoBack() && router.back()}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md }}>
        {methods.map((m) => (
          <Pressable
            key={m.route}
            // Replace the add-menu sheet with the chosen flow so it presents
            // cleanly instead of stacking on top of the still-open sheet.
            onPress={() => replace(withSlot(m.route))}
            accessibilityLabel={`${m.label}. ${m.description}`}
            minTapTarget={false}
            // The design's chooser tile: a grey tile, a WHITE disc holding the
            // one accent glyph, then the title and its caption pinned to the
            // bottom. Pressed darkens the tile rather than fading it.
            style={({ pressed }) => ({
              width: m.wide ? '100%' : '48%',
              minHeight: m.wide ? WIDE_TILE_HEIGHT : TILE_HEIGHT,
              backgroundColor: pressed ? surface.tilePressed : surface.tile,
              borderRadius: radius.lg,
              paddingVertical: m.wide ? space.md : space.lg,
              paddingHorizontal: space.lg,
              flexDirection: m.wide ? 'row' : 'column',
              alignItems: m.wide ? 'center' : 'stretch',
              gap: m.wide ? space.md : space.sm,
            })}
          >
            <View
              style={{
                width: TILE_DISC,
                height: TILE_DISC,
                borderRadius: radius.full,
                backgroundColor: color.white,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={m.icon} size={TILE_GLYPH} color={m.tint} />
            </View>
            <View style={[{ gap: TEXT_GAP }, m.wide ? { flex: 1 } : { marginTop: 'auto' }]}>
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
