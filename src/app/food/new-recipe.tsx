// New Recipe (Task 5) — full screen: name, servings, and an ingredient list built
// from the food search. [+ Add ingredient] opens a sheet: search → pick a food →
// enter grams; tapping an existing row re-opens the grams input; swipe-left deletes.
// Live totals recompute every render. Save posts to the backend, best-effort +
// offline-safe (a failed create surfaces an error toast and keeps the draft).
//
// ponytail: the mock search catalog (FoodResult) only carries kcal/100g — no
// protein/carbs/fat — so ingredient macros beyond calories are 0 until the real
// /api/food/search fills them in. Totals reflect what the source data has.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { Button, Stepper, TextField } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { replace } from '@/lib/nav';
import { color, space } from '@/lib/design/tokens';
import { formatCalories, formatGrams, formatNumber } from '@/lib/formatting';
import { useFoodSearch } from '@/lib/data';
import { api, type RecipeIngredient } from '@/lib/api';
import type { FoodResult } from '@/lib/mock/data';

/** Scale a per-100g search hit to a fixed gram quantity. Mock catalog has kcal
 *  only, so protein/carbs/fat stay 0 (see file header). */
function ingredientFrom(food: FoodResult, grams: number): RecipeIngredient {
  return {
    food_name: food.name,
    quantity_g: grams,
    calories: Math.round((food.kcalPer100 * grams) / 100),
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
  };
}

type Stage = { kind: 'search' } | { kind: 'qty'; food: FoodResult; grams: string; editIndex?: number };

export default function NewRecipeScreen() {
  const [name, setName] = useState('');
  const [servingCount, setServingCount] = useState(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage | null>(null);

  const { results, recents } = useFoodSearch(query);
  const searchRows = query.trim() ? results : recents;

  const totals = ingredients.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const openSearch = () => {
    setQuery('');
    setStage({ kind: 'search' });
  };
  const pickFood = (food: FoodResult) => setStage({ kind: 'qty', food, grams: '' });
  const editRow = (i: number) => {
    const ing = ingredients[i];
    const kcalPer100 = ing.quantity_g > 0 ? (ing.calories / ing.quantity_g) * 100 : 0;
    setStage({ kind: 'qty', food: { name: ing.food_name, kcalPer100 }, grams: String(ing.quantity_g), editIndex: i });
  };
  const setGrams = (text: string) => setStage((s) => (s && s.kind === 'qty' ? { ...s, grams: text } : s));
  const commitQty = () => {
    if (stage?.kind !== 'qty') return;
    const grams = Number(stage.grams);
    if (!grams || grams <= 0) return;
    const ing = ingredientFrom(stage.food, grams);
    const editIndex = stage.editIndex;
    setIngredients((prev) => (editIndex === undefined ? [...prev, ing] : prev.map((x, i) => (i === editIndex ? ing : x))));
    setStage(null);
  };
  const removeRow = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const canSave = name.trim().length > 0 && ingredients.length > 0;

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api.recipes.create({ name: name.trim(), serving_count: servingCount, ingredients });
      showToast({ message: 'Recipe saved.', tone: 'success' });
      if (router.canGoBack()) router.back();
      else replace('/food/meals');
    } catch (e) {
      if (__DEV__) console.warn('[recipe] create failed:', e instanceof Error ? e.message : e);
      showToast({ message: "Couldn't save recipe. Try again.", tone: 'error' });
      setSaving(false);
    }
  }, [canSave, name, servingCount, ingredients]);

  return (
    <Screen
      title="New Recipe"
      showBack
      footer={<Button title="Save Recipe" onPress={() => void save()} disabled={!canSave} loading={saving} />}
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Overnight oats" />

      <Stepper label="Servings this makes" value={servingCount} min={1} max={50} onChange={setServingCount} />

      <View style={{ gap: space.sm }}>
        <Text variant="label" color={color.gray600}>
          Ingredients
        </Text>
        {ingredients.length === 0 ? (
          <EmptyState icon="restaurant" title="No ingredients yet" message="Add foods to build this recipe." />
        ) : (
          <Card padded={false}>
            {ingredients.map((it, i) => (
              <SwipeableRow key={`${it.food_name}-${i}`} onDelete={() => removeRow(i)} confirmTitle={`Remove ${it.food_name}?`}>
                <Pressable
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => editRow(i)}
                  accessibilityLabel={`Edit ${it.food_name}`}
                  style={{
                    gap: space.xs,
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                    backgroundColor: color.white,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: color.gray100,
                  }}
                >
                  <Text variant="body" color={color.black}>
                    {it.food_name}
                  </Text>
                  <Text variant="footnote" color={color.gray500}>
                    {formatGrams(it.quantity_g)} · {formatCalories(it.calories)}
                  </Text>
                </Pressable>
              </SwipeableRow>
            ))}
          </Card>
        )}
        <Button title="Add ingredient" icon="add" variant="secondary" onPress={openSearch} />
      </View>

      {ingredients.length > 0 ? (
        <Card>
          <Text variant="footnote" color={color.gray600}>
            {/* Kcal-only catalog → all-zero macros are meaningless; show calories only. */}
            {totals.protein + totals.carbs + totals.fat === 0
              ? `Total: ${formatNumber(totals.calories)} kcal`
              : `Total: ${formatNumber(totals.calories)} kcal · ${Math.round(totals.protein)}g protein · ${Math.round(totals.carbs)}g carbs · ${Math.round(totals.fat)}g fat`}
          </Text>
        </Card>
      ) : null}

      <BottomSheet
        visible={stage !== null}
        onClose={() => setStage(null)}
        title={stage?.kind === 'qty' ? stage.food.name : 'Add ingredient'}
      >
        {stage?.kind === 'search' ? (
          <>
            <TextField
              placeholder="Search foods…"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              accessibilityLabel="Search foods"
            />
            <Card padded={false}>
              {searchRows.map((r, i) => (
                <Pressable
                  key={`${r.name}-${i}`}
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => pickFood(r)}
                  accessibilityLabel={`Add ${r.name}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: space.sm,
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: color.gray100,
                  }}
                >
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Text variant="body" color={color.black}>
                      {r.name}
                    </Text>
                    <Text variant="footnote" color={color.gray500}>
                      {r.brand ? `${r.brand} · ` : ''}
                      {r.kcalPer100} kcal / 100g
                    </Text>
                  </View>
                  <Icon name="add" size={20} color={color.black} />
                </Pressable>
              ))}
            </Card>
          </>
        ) : stage?.kind === 'qty' ? (
          <>
            <TextField
              label="Quantity"
              value={stage.grams}
              onChangeText={setGrams}
              keyboardType="number-pad"
              placeholder="grams"
              accessibilityLabel="Quantity in grams"
            />
            <Button title="Add to recipe" onPress={commitQty} disabled={!Number(stage.grams) || Number(stage.grams) <= 0} />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
