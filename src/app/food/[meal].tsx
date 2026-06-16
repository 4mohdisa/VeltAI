// C11 · Meal detail (edit)
// Existing meal with all food items listed; edit any item inline. Delete meal at
// the bottom (destructive, requires confirmation via a bottom sheet).
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatCalories, formatGrams } from '@/lib/formatting';
import { mockMeals } from '@/lib/mock/data';

export default function MealDetailScreen() {
  const { meal: mealId } = useLocalSearchParams<{ meal: string }>();
  const meal = mockMeals.find((m) => m.id === mealId) ?? mockMeals[0];
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen
      title={meal.slot}
      showBack
      footer={
        <Button title="Delete meal" variant="destructive" icon="trash" onPress={() => setConfirming(true)} />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="callout" color={color.gray500}>
          {meal.time}
        </Text>
        <Badge label={`${formatCalories(meal.calories)}`} />
      </View>

      <Card padded={false}>
        {meal.items.map((item, i) => (
          <Pressable
            key={`${item.name}-${i}`}
            haptic={false}
            minTapTarget={false}
            onPress={() => showToast({ message: `Editing ${item.name}…`, tone: 'info' })}
            accessibilityLabel={`Edit ${item.name}`}
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
                {item.name}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {formatGrams(item.quantityG)} · {formatCalories(item.calories)} · P {item.protein}g
              </Text>
            </View>
            <Icon name="pencil" size={16} color={color.gray400} />
          </Pressable>
        ))}
      </Card>

      <BottomSheet visible={confirming} onClose={() => setConfirming(false)} title="Delete this meal?">
        <Text variant="callout" color={color.gray500}>
          This removes the meal and recomputes today&apos;s totals. XP already earned is kept.
        </Text>
        <Button
          title="Delete meal"
          variant="destructive"
          onPress={() => {
            setConfirming(false);
            showToast({ message: 'Meal deleted.', tone: 'info' });
            if (router.canGoBack()) router.back();
          }}
        />
        <Button title="Cancel" variant="tertiary" onPress={() => setConfirming(false)} />
      </BottomSheet>
    </Screen>
  );
}
