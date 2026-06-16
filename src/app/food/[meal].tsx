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
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { writeNutritionToHealth } from '@/lib/healthkit';
import { color, space } from '@/lib/design/tokens';
import { formatCalories, formatGrams } from '@/lib/formatting';
import { mockMeals, type FoodItem } from '@/lib/mock/data';

export default function MealDetailScreen() {
  const { meal: mealId } = useLocalSearchParams<{ meal: string }>();
  const meal = mockMeals.find((m) => m.id === mealId) ?? mockMeals[0];
  const [confirming, setConfirming] = useState(false);
  const [synced, setSynced] = useState(false); // written to Apple Health (per meal)
  const [items, setItems] = useState<FoodItem[]>(meal.items);
  const [editing, setEditing] = useState<(EditableItem & { idx: number }) | null>(null);

  const applyEdit = (next: EditableItem) => {
    const idx = editing?.idx;
    if (idx === undefined) return;
    setItems((arr) =>
      arr.map((it, i) =>
        i === idx
          ? { ...it, name: next.name, quantityG: next.quantityG, calories: next.calories, protein: next.protein, carbs: next.carbs, fat: next.fat }
          : it,
      ),
    );
    setEditing(null);
  };
  const removeItem = () => {
    const idx = editing?.idx;
    if (idx === undefined) return;
    setItems((arr) => arr.filter((_, i) => i !== idx));
    setEditing(null);
    showToast({ message: 'Item deleted.', tone: 'info' });
  };

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
        {items.map((item, i) => (
          <View
            key={`${item.name}-${i}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: color.gray100,
            }}
          >
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() =>
                setEditing({
                  idx: i,
                  id: `${meal.id}-${i}`,
                  name: item.name,
                  quantityG: item.quantityG,
                  calories: item.calories,
                  protein: item.protein,
                  carbs: item.carbs,
                  fat: item.fat,
                })
              }
              accessibilityLabel={`Edit ${item.name}`}
              style={{ flex: 1, gap: space.xs, paddingVertical: space.lg, paddingLeft: space.lg }}
            >
              <Text variant="body" color={color.black}>
                {item.name}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {formatGrams(item.quantityG)} · {formatCalories(item.calories)} · P {item.protein}g
              </Text>
            </Pressable>

            {/* Star → save this item to Saved foods (mock). */}
            <Pressable
              haptic
              minTapTarget={false}
              onPress={() => showToast({ message: `Saved ${item.name} to your foods.`, tone: 'success' })}
              accessibilityLabel={`Save ${item.name} to saved foods`}
              style={{ padding: space.lg }}
            >
              <Icon name="bookmark-outline" size={20} color={color.gray500} />
            </Pressable>
          </View>
        ))}
      </Card>

      {/* User-initiated: send this meal's nutrition to Apple Health */}
      <Button
        title={synced ? 'Sent to Apple Health' : 'Send to Apple Health'}
        variant="secondary"
        icon={synced ? 'checkmark' : 'heart'}
        disabled={synced}
        onPress={async () => {
          await writeNutritionToHealth({
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          });
          setSynced(true);
          showToast({ message: 'Nutrition sent to Apple Health.', tone: 'success' });
        }}
      />

      <BottomSheet visible={confirming} onClose={() => setConfirming(false)} title="Delete this meal?">
        <Text variant="callout" color={color.gray500}>
          This removes the meal and recomputes today&apos;s totals.
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

      <FoodItemEditSheet item={editing} onClose={() => setEditing(null)} onSave={applyEdit} onDelete={removeItem} />
    </Screen>
  );
}
