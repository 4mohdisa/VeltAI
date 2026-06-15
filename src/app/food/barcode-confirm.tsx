// C8 · Barcode product confirm
// Product name, brand and base nutrition from Open Food Facts; a serving-size
// picker recomputes the macros; Save logs the meal (+5 XP).
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { aiBarcodeProduct } from '@/lib/mock/ai';

export default function BarcodeConfirmScreen() {
  const p = aiBarcodeProduct;
  const [serving, setServing] = useState(String(p.servingOptions[0]));
  const grams = Number(serving);
  const factor = grams / 100;

  const macro = (per100: number) => Math.round(per100 * factor);

  return (
    <Screen
      title="Confirm product"
      showBack
      footer={
        <Button
          title="Save"
          icon="checkmark"
          onPress={() => {
            showToast({ message: `+5 XP · Added ${p.name}.`, tone: 'success' });
            router.replace('/(tabs)/food');
          }}
        />
      }
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
            <Ionicons name="fast-food" size={28} color={color.gray400} />
          </View>
          <View style={{ flex: 1, gap: space.xs }}>
            <Text variant="title3" color={color.black}>
              {p.name}
            </Text>
            <Text variant="footnote" color={color.gray500}>
              {p.brand} · {formatCalories(p.kcalPer100)} / 100g
            </Text>
          </View>
        </View>
      </Card>

      <SegmentedField
        label="Serving size"
        value={serving}
        onChange={setServing}
        options={p.servingOptions.map((g) => ({ label: `${g} g`, value: String(g) }))}
      />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="statSmall" color={color.black}>
            {formatCalories(macro(p.kcalPer100))}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            P {macro(p.proteinPer100)}g · C {macro(p.carbsPer100)}g · F {macro(p.fatPer100)}g
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
