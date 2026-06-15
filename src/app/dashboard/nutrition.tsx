// B4 · Nutrition detail
// Calories consumed vs target, per-macro progress bars (incl. fibre), then a
// per-meal breakdown. Edit any meal from here.
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { color, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { mockMacros, mockMeals } from '@/lib/mock/data';

export default function NutritionDetailScreen() {
  const cal = mockMacros.calories;
  return (
    <Screen title="Nutrition" showBack>
      <Card>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <DailyMacroRing consumed={cal.consumed} target={cal.target} />
          <Text variant="footnote" color={color.gray500}>
            {formatCalories(Math.max(0, cal.target - cal.consumed))} remaining today
          </Text>
        </View>
      </Card>

      <Card>
        <MacroBars
          rows={[
            { label: 'Protein', data: mockMacros.protein },
            { label: 'Carbs', data: mockMacros.carbs },
            { label: 'Fat', data: mockMacros.fat },
            { label: 'Fibre', data: mockMacros.fibre },
          ]}
        />
      </Card>

      <View>
        <Text
          variant="footnote"
          color={color.gray500}
          style={{ marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Meals today
        </Text>
        <Card padded={false}>
          {mockMeals.map((meal, i) => (
            <Pressable
              key={meal.id}
              haptic={false}
              minTapTarget={false}
              accessibilityLabel={`Edit ${meal.slot}, ${formatCalories(meal.calories)}`}
              onPress={() => router.push(`/food/${meal.id}`)}
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
                <Text variant="bodyBold" color={color.black}>
                  {meal.slot}
                </Text>
                <Text variant="footnote" color={color.gray500}>
                  {meal.time} · {formatCalories(meal.calories)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={color.gray400} />
            </Pressable>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
