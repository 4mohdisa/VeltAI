// C8 · Barcode product confirm
// After a scan: product + base nutrition from Open Food Facts (mock, NO AI), a
// serving-size picker that recomputes macros, then Save. Bottom sheet (X discard
// / ✓ save). The product can be tweaked via the shared item edit sheet.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { lookupBarcodeAsync } from '@/lib/data';
import type { BarcodeProduct } from '@/lib/food/barcode';

export default function BarcodeConfirmScreen() {
  // Brief lookup/loading window before the product fills in (Task 3) — routed
  // through the data seam so swapping in the real Open Food Facts call is local.
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [serving, setServing] = useState('100');
  // Manual edits (via the shared sheet) override the serving-scaled values.
  const [override, setOverride] = useState<EditableItem | null>(null);
  const [editing, setEditing] = useState<EditableItem | null>(null);

  useEffect(() => {
    let active = true;
    lookupBarcodeAsync().then((found) => {
      if (!active) return;
      setProduct(found);
      if (found) setServing(String(found.servingOptions[0]));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !product) {
    return (
      <SheetContent title="Looking up product…" onClose={() => router.canGoBack() && router.back()}>
        <SkeletonList rows={3} />
      </SheetContent>
    );
  }

  const p = product;
  const grams = Number(serving);
  const factor = grams / 100;
  const macro = (per100: number) => Math.round(per100 * factor);

  // The item as currently shown — either the scaled product or a manual override.
  const current: EditableItem = override ?? {
    id: 'barcode-product',
    name: p.name,
    quantityG: grams,
    calories: macro(p.kcalPer100),
    protein: macro(p.proteinPer100),
    carbs: macro(p.carbsPer100),
    fat: macro(p.fatPer100),
  };

  return (
    <SheetContent
      title="Confirm product"
      onClose={() => router.canGoBack() && router.back()}
      onDone={() => {
        showToast({ message: `Added ${current.name}.`, tone: 'success' });
        router.replace('/(tabs)/food');
      }}
    >
      <Pressable
        haptic={false}
        minTapTarget={false}
        onPress={() => setEditing(current)}
        accessibilityLabel="Edit product details"
      >
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: color.gray100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="fast-food" size={28} color={color.gray400} />
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="title3" color={color.black}>
                {current.name}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {p.brand} · {formatCalories(p.kcalPer100)} / 100g
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={color.gray400} />
          </View>
        </Card>
      </Pressable>

      <SegmentedField
        label="Serving size"
        value={serving}
        onChange={(v) => {
          setServing(v);
          setOverride(null); // re-scale from the product when the serving changes
        }}
        options={p.servingOptions.map((g) => ({ label: `${g} g`, value: String(g) }))}
      />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="statSmall" color={color.black}>
            {formatCalories(current.calories)}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            P {current.protein}g · C {current.carbs}g · F {current.fat}g
          </Text>
        </View>
      </Card>

      <FoodItemEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(next) => {
          setOverride(next);
          setEditing(null);
        }}
      />
    </SheetContent>
  );
}
