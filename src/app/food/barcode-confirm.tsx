// C8 · Barcode product confirm
// After a scan: product + base nutrition from Open Food Facts (mock, NO AI), a
// serving-size picker that recomputes macros, then Save. Bottom sheet (X discard
// / ✓ save). The product can be tweaked via the shared item edit sheet.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';
import { formatCalories, formatNumber } from '@/lib/formatting';
import { lookupBarcodeAsync, logMeal, slotForNow } from '@/lib/data';
import type { BarcodeProduct } from '@/lib/food/barcode';

export default function BarcodeConfirmScreen() {
  // The scanned barcode arrives as a route param from barcode-scan; the demo
  // code only stands in when the screen is opened without a scan (dev nav).
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === 'string' && params.code ? params.code : '9300605000000';
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
    lookupBarcodeAsync(code).then((found) => {
      if (!active) return;
      setProduct(found);
      if (found) setServing(String(found.servingOptions[0]));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [code]);

  if (loading) {
    return (
      <SheetContent title="Looking up product…" onClose={() => router.canGoBack() && router.back()}>
        <SkeletonList rows={3} />
      </SheetContent>
    );
  }

  // Not-found: the lookup resolved with no product (unknown barcode, or the
  // backend was unreachable). Give the user a real way out instead of an infinite
  // loader (AUDIT_REPORT.md M1).
  if (!product) {
    return (
      <SheetContent title="Product not found" onClose={() => router.canGoBack() && router.back()}>
        <View style={{ gap: space.lg, alignItems: 'center', paddingVertical: space.lg }}>
          <Icon name="barcode-outline" size={40} color={color.tertiaryLabel} />
          <Text variant="body" color={color.label} style={{ textAlign: 'center' }}>
            We couldn&apos;t find that barcode. Try scanning again, or photograph the nutrition label instead.
          </Text>
          <Button title="Scan again" variant="secondary" onPress={() => router.replace('/food/barcode-scan')} />
        </View>
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
        logMeal(
          slotForNow(),
          {
            name: current.name,
            quantityG: current.quantityG,
            calories: current.calories,
            protein: current.protein,
            carbs: current.carbs,
            fat: current.fat,
          },
          'barcode',
        );
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
                backgroundColor: color.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="fast-food" size={28} color={color.tertiaryLabel} />
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="title3" color={color.label}>
                {current.name}
              </Text>
              <Text variant="footnote" color={color.secondaryLabel}>
                {p.brand} · {formatCalories(p.kcalPer100)} / 100g
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={color.tertiaryLabel} />
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
        variant="inset"
      />

      {/* The design's nutrition block: the energy as the hero rounded number,
          then one tile per macro with its category dot. */}
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
          <Text variant="statLarge" color={color.label}>
            {formatNumber(current.calories)}
          </Text>
          <Text variant="callout" color={color.secondaryLabel}>
            kcal
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {[
            { name: 'Protein', tint: categoryAccent.protein, value: current.protein },
            { name: 'Carbs', tint: categoryAccent.carbs, value: current.carbs },
            { name: 'Fat', tint: categoryAccent.fat, value: current.fat },
          ].map((m) => (
            <View
              key={m.name}
              style={{
                flex: 1,
                minWidth: 0,
                gap: space.xs,
                padding: space.md,
                borderRadius: radius.md,
                backgroundColor: surface.tile,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: m.tint }} />
                <Text variant="caption" color={color.secondaryLabel}>
                  {m.name}
                </Text>
              </View>
              <Text variant="statSmall" color={color.label}>
                {`${m.value}g`}
              </Text>
            </View>
          ))}
        </View>
      </View>

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
