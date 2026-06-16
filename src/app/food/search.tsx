// C9 · Manual food search
// Search bar at top, results from Open Food Facts + cached recent foods, and an
// "Add custom food" link at the bottom. Tap a result → (serving picker) → save.
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/forms/TextField';
import { color, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';

type FoodResult = { name: string; brand?: string; kcalPer100: number };

// Mock OFF + recent foods (AU / Pakistani / Mediterranean weighting).
const RECENT: FoodResult[] = [
  { name: 'Chicken biryani', kcalPer100: 160 },
  { name: 'Greek yoghurt', brand: 'Chobani', kcalPer100: 59 },
  { name: 'Wholemeal roti', kcalPer100: 297 },
];
const CATALOG: FoodResult[] = [
  ...RECENT,
  { name: 'Lentil dal', kcalPer100: 116 },
  { name: 'Grilled salmon', kcalPer100: 208 },
  { name: 'Hummus', brand: 'Obela', kcalPer100: 177 },
  { name: 'Lamb karahi', kcalPer100: 190 },
  { name: 'Vegemite on toast', kcalPer100: 265 },
];

export default function ManualSearchScreen() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECENT;
    return CATALOG.filter((r) => r.name.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));
  }, [query]);

  // Picking a result opens the serving-size picker sheet before saving.
  const pick = (food: FoodResult) => {
    router.push({
      pathname: '/food/serving',
      params: { name: food.name, kcalPer100: String(food.kcalPer100) },
    });
  };

  return (
    <Screen title="Search food" showBack>
      <TextField
        placeholder="Search foods…"
        value={query}
        onChangeText={setQuery}
        autoFocus
        autoCorrect={false}
        accessibilityLabel="Search foods"
      />

      <Text variant="footnote" color={color.gray500} style={{ marginLeft: space.xs }}>
        {query.trim() ? 'Results' : 'Recent'}
      </Text>

      <Card padded={false}>
        {results.map((food, i) => (
          <Pressable
            key={`${food.name}-${i}`}
            haptic={false}
            minTapTarget={false}
            onPress={() => pick(food)}
            accessibilityLabel={`Add ${food.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: color.gray100,
            }}
          >
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="body" color={color.black}>
                {food.name}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {food.brand ? `${food.brand} · ` : ''}
                {formatCalories(food.kcalPer100)} / 100g
              </Text>
            </View>
            <Icon name="add-circle-outline" size={22} color={color.black} />
          </Pressable>
        ))}
      </Card>

      <Pressable
        haptic={false}
        minTapTarget={false}
        onPress={() => router.push('/food/custom-food')}
        accessibilityLabel="Add custom food"
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md }}
      >
        <Icon name="create-outline" size={18} color={color.black} />
        <Text variant="bodyBold" color={color.black}>
          Add custom food
        </Text>
      </Pressable>
    </Screen>
  );
}
