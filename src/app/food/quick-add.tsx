// Quick Add (Task 6) — a native formSheet: just calories (+ optional label + meal
// slot), no macro breakdown. Posts to /api/food/quick-add, then reflects the row
// in the local food log so it shows immediately.
//
// Offline (audit 2026-08-06): a transient failure QUEUES the equivalent
// /api/food/logs create (idempotency-keyed replay) — pre-audit the failure was
// swallowed, the row lived only in this session's store, and the success toast
// lied: the entry vanished at next launch. A permanent 4xx keeps the sheet
// open with an error instead of pretending.
//
// ponytail: the local reflection uses the store's logMeal (local-only) rather than
// the mutations wrapper — quickAdd already creates the server food_logs row, so
// the mutations wrapper's extra POST would double-write. Store insert avoids that
// and is replaced by the real row on the next hydration.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Button, SegmentedField, TextField } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { slotForNow } from '@/lib/data';
import { todayISO } from '@/lib/data/mappers';
import { useFoodStore } from '@/lib/data/foodStore';
import { api, isTransient } from '@/lib/api';
import { runOrQueue } from '@/lib/offline/queue';
import type { MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function QuickAddScreen() {
  // Slot targeting from the food log's per-meal "+" (via the add menu).
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const initialSlot = SLOTS.includes(slot as MealSlot) ? (slot as MealSlot) : slotForNow();
  const [calories, setCalories] = useState('');
  const [label, setLabel] = useState('');
  const [mealType, setMealType] = useState<MealSlot>(initialSlot);
  const [submitting, setSubmitting] = useState(false);

  const kcal = Number(calories);
  const invalid = !calories || Number.isNaN(kcal) || kcal <= 0;

  const add = async () => {
    if (invalid) return;
    setSubmitting(true);
    const name = label.trim() || 'Quick add';
    const item = { name, quantityG: 0, calories: kcal, protein: 0, carbs: 0, fat: 0 };
    let toast = `Added ${kcal} kcal.`;
    try {
      await api.foodLogs.quickAdd({ calories: kcal, label: label.trim() || undefined, meal_type: mealType, date: todayISO() });
    } catch (e) {
      if (!isTransient(e)) {
        showToast({ message: "Couldn't add that — try again.", tone: 'error' });
        setSubmitting(false);
        return;
      }
      // Offline / server down: queue the equivalent create so the entry
      // survives a restart and replays exactly once.
      await runOrQueue('/api/food/logs', {
        date: todayISO(),
        meal_type: mealType,
        food_name: name,
        calories: kcal,
        source: 'quick_add',
      });
      toast = `Added ${kcal} kcal — will sync when you're back online.`;
    }
    // Reflect locally so the food log updates immediately.
    useFoodStore.getState().logMeal(mealType, item, 'manual');
    showToast({ message: toast, tone: 'success' });
    // Clear the busy state when we can't navigate away (deep-linked as the entry
    // route), otherwise the button spins forever (AUDIT_REPORT.md M4).
    if (router.canGoBack()) router.back();
    else setSubmitting(false);
  };

  return (
    <SheetContent title="Quick Add" onClose={() => router.canGoBack() && router.back()}>
      <View style={{ gap: space.xs }}>
        <Text variant="label" color={color.gray600}>
          Calories
        </Text>
        <TextField
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          placeholder="0"
          accessibilityLabel="Calories"
        />
      </View>

      <TextField
        label="Label"
        value={label}
        onChangeText={setLabel}
        placeholder="What was it? (optional)"
        accessibilityLabel="Label (optional)"
      />

      <SegmentedField<MealSlot>
        label="Meal"
        value={mealType}
        onChange={setMealType}
        options={SLOTS.map((s) => ({ label: s, value: s }))}
      />

      <Button title={invalid ? 'Add calories' : `Add ${kcal} kcal`} onPress={() => void add()} disabled={invalid} loading={submitting} />
    </SheetContent>
  );
}
