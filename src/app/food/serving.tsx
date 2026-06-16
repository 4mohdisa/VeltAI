// Serving-size picker — short sheet to choose a serving before saving a food
// picked from manual search (C9). X discards, Done saves. Mocked save (toast).
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';

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
        showToast({ message: `+5 XP · Added ${name}.`, tone: 'success' });
        router.replace('/(tabs)/food');
      }}
    >
      <SegmentedField
        label="Serving size"
        value={serving}
        onChange={setServing}
        options={SERVINGS.map((g) => ({ label: `${g} g`, value: String(g) }))}
      />
      <Card>
        <View style={{ alignItems: 'center', gap: space.xs }}>
          <Text variant="statMedium" color={color.black}>
            {formatCalories(kcal)}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            for {serving} g
          </Text>
        </View>
      </Card>
    </SheetContent>
  );
}
