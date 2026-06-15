// C9 · Manual food search
// Search bar at top, results from Open Food Facts + cached recent foods, and an
// "Add custom food" link at the bottom. Tap a result → (serving picker) → save.
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
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

  const save = (food: FoodResult) => {
    showToast({ message: `+5 XP · Added ${food.name}.`, tone: 'success' });
    if (router.canGoBack()) router.back();
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
            onPress={() => save(food)}
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
            <Ionicons name="add-circle-outline" size={22} color={color.accent} />
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
        <Ionicons name="create-outline" size={18} color={color.accentText} />
        <Text variant="bodyBold" color={color.accentText}>
          Add custom food
        </Text>
      </Pressable>
    </Screen>
  );
}
