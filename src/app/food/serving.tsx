// Serving-size picker — short sheet to choose a serving before saving a food
// picked from manual search (C9). X discards, Done logs to today's slot.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';
import { logMeal, slotForNow } from '@/lib/data';

const SERVINGS = [50, 100, 150, 200];

export default function ServingPickerScreen() {
  const p = useLocalSearchParams<{ name?: string; kcalPer100?: string }>();
  const name = p.name ?? 'Food';
  const kcalPer100 = Number(p.kcalPer100 ?? '0');
  const [serving, setServing] = useState('100');
  const kcal = Math.round((kcalPer100 * Number(serving)) / 100);

  return (
    <SheetContent
      title={name}
      onClose={() => router.canGoBack() && router.back()}
      onDone={() => {
        // ponytail: search catalog is kcal-only, so macros log as 0.
        // 'search' isn't an EntryMethod — 'manual' matches the saved-foods path.
        logMeal(
          slotForNow(),
          { name, quantityG: Number(serving), calories: kcal, protein: 0, carbs: 0, fat: 0 },
          'manual',
        );
        showToast({ message: `Added ${name}.`, tone: 'success' });
        router.replace('/(tabs)/food');
      }}
    >
      <SegmentedField
        label="Serving size"
        value={serving}
        onChange={setServing}
        options={SERVINGS.map((g) => ({ label: `${g} g`, value: String(g) }))}
        variant="inset"
      />
      {/* The design's serving readout: the energy as the hero rounded number
          with its unit beside it, over the grams it belongs to. */}
      <Card>
        <View style={{ alignItems: 'center', gap: space.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text variant="statLarge" color={color.label}>
              {formatNumber(kcal)}
            </Text>
            <Text variant="callout" color={color.secondaryLabel}>
              kcal
            </Text>
          </View>
          <Text variant="footnote" color={color.secondaryLabel}>
            for {serving} g
          </Text>
        </View>
      </Card>
    </SheetContent>
  );
}
