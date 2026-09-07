// C11 · Meal detail (edit)
// Existing meal with all food items listed; edit any item inline. Delete meal at
// the bottom (destructive, requires confirmation via a bottom sheet). Reads/writes
// through the data seam so edits persist across navigation.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, layout, space, surface } from '@/lib/design/tokens';
import { formatCalories, formatGrams, formatNumber } from '@/lib/formatting';
import { useMeal, editFoodItem, deleteFoodItem, saveFood } from '@/lib/data';

export default function MealDetailScreen() {
  const { meal: mealId } = useLocalSearchParams<{ meal: string }>();
  const meal = useMeal(mealId);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState<EditableItem | null>(null);

  // Meal was deleted (e.g. last item removed) → nothing to show.
  if (!meal) {
    return (
      <Screen title="Meal" variant="floating" eyebrow="Food" showBack>
        <Text variant="callout" color={color.secondaryLabel} style={{ textAlign: 'center', paddingVertical: space['2xl'] }}>
          This meal is no longer in your log.
        </Text>
      </Screen>
    );
  }

  const applyEdit = (next: EditableItem) => {
    editFoodItem(next.id, next);
    setEditing(null);
  };
  const removeItem = (id: string) => {
    deleteFoodItem(id);
    setEditing(null);
    showToast({ message: 'Item deleted.', tone: 'info' });
  };

  return (
    <Screen
      title={meal.slot}
      variant="floating"
      // The eyebrow carries the meal's logged time — the design's small line
      // above the large title.
      eyebrow={meal.time}
      showBack
      footer={
        <Button title="Delete meal" variant="destructive" icon="trash" onPress={() => setConfirming(true)} />
      }
    >
      {/* The meal's energy as the design's hero rounded number. */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <Text variant="statLarge" color={color.label}>
          {formatNumber(meal.calories)}
        </Text>
        <Text variant="callout" color={color.secondaryLabel}>
          kcal
        </Text>
      </View>

      <Card padded={false} variant="elevated">
        {meal.items.map((item, i) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              borderTopWidth: i === 0 ? 0 : layout.hairline,
              borderTopColor: surface.divider,
            }}
          >
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() =>
                setEditing({
                  id: item.id,
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
              <Text variant="body" color={color.label}>
                {item.name}
              </Text>
              <Text variant="footnote" color={color.secondaryLabel}>
                {formatGrams(item.quantityG)} · {formatCalories(item.calories)} · P {item.protein}g
              </Text>
            </Pressable>

            {/* Star → save this item to Saved foods (through the data seam). */}
            <Pressable
              haptic
              minTapTarget={false}
              onPress={() => {
                saveFood({
                  name: item.name,
                  servingG: item.quantityG,
                  calories: item.calories,
                  protein: item.protein,
                  carbs: item.carbs,
                  fat: item.fat,
                });
                showToast({ message: `Saved ${item.name} to your foods.`, tone: 'success' });
              }}
              accessibilityLabel={`Save ${item.name} to saved foods`}
              style={{ padding: space.lg }}
            >
              <Icon name="bookmark-outline" size={20} color={color.tertiaryLabel} />
            </Pressable>
          </View>
        ))}
      </Card>

      <BottomSheet visible={confirming} onClose={() => setConfirming(false)} title="Delete this meal?">
        <Text variant="callout" color={color.secondaryLabel}>
          This removes the meal and recomputes today&apos;s totals.
        </Text>
        <Button
          title="Delete meal"
          variant="destructive"
          onPress={() => {
            setConfirming(false);
            meal.items.forEach((it) => deleteFoodItem(it.id));
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
