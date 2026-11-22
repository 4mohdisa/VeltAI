// New Recipe — full screen: name, servings, and an ingredient list built
// from the food search. [+ Add ingredient] opens a sheet: search → pick a food →
// enter grams; tapping an existing row re-opens the grams input; swipe-left deletes.
// Live totals recompute every render. Save posts to the backend, best-effort +
// offline-safe (a failed create surfaces an error toast and keeps the draft).
//
// Ingredient fibre/protein/carbs/fat are the food's per-100g values scaled by grams. A
// source without a macro (the dev catalog carries kcal only) adds nothing to that
// macro. Totals reflect what the source data has.
import { useCallback, useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { Button, Stepper, TextField } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { replace } from '@/lib/nav';
import { color, layout, space, surface } from '@/lib/design/tokens';
import { formatCalories, formatGrams, formatNumber } from '@/lib/formatting';
import { useFoodSearch } from '@/lib/data';
import { api, type RecipeIngredient } from '@/lib/api';
import type { FoodResult } from '@/lib/mock/data';
import { devWarn } from '@/lib/env';

/** Scale a per-100g search hit to a fixed gram quantity: calories, plus fibre,
 *  protein, carbs and fat, each per 100 g by grams (see file header). */
function ingredientFrom(food: FoodResult, grams: number): RecipeIngredient {
  const scale = (per100?: number | null) => ((per100 ?? 0) * grams) / 100;
  return {
    food_name: food.name,
    quantity_g: grams,
    calories: Math.round(scale(food.kcalPer100)),
    protein: scale(food.protein),
    carbs: scale(food.carbs),
    fat: scale(food.fat),
    fibre: scale(food.fibre),
  };
}

type Stage = { kind: 'search' } | { kind: 'qty'; food: FoodResult; grams: string; editIndex?: number };

export default function NewRecipeScreen() {
  const { t } = useTranslation();
  // Feature entered — one mount event per major surface, so "which features
  // does anyone actually open?" is answerable without a per-screen scheme.
  useEffect(() => track('feature_used', { name: 'recipes' }), []);

  const [name, setName] = useState('');
  const [servingCount, setServingCount] = useState(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage | null>(null);

  const { results, recents, isLoading: searchLoading, error: searchError, refetch: retrySearch } = useFoodSearch(query);
  const searching = query.trim().length > 0;
  const searchRows = searching ? results : recents;

  const totals = ingredients.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
      fibre: a.fibre + it.fibre,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  );

  const openSearch = () => {
    setQuery('');
    setStage({ kind: 'search' });
  };
  const pickFood = (food: FoodResult) => setStage({ kind: 'qty', food, grams: '' });
  const editRow = (i: number) => {
    const ing = ingredients[i];
    // Back to per-100g, so ingredientFrom rescales every macro to the new grams.
    const per100 = (total: number) => (ing.quantity_g > 0 ? (total / ing.quantity_g) * 100 : 0);
    const food: FoodResult = {
      name: ing.food_name,
      kcalPer100: per100(ing.calories),
      protein: per100(ing.protein),
      carbs: per100(ing.carbs),
      fat: per100(ing.fat),
      fibre: per100(ing.fibre),
    };
    setStage({ kind: 'qty', food, grams: String(ing.quantity_g), editIndex: i });
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
      showToast({ message: t('newRecipe.saved'), tone: 'success' });
      if (router.canGoBack()) router.back();
      else replace('/food/meals');
    } catch (e) {
      devWarn('[recipe] create failed:', e);
      showToast({ message: t('newRecipe.saveFailed'), tone: 'error' });
      setSaving(false);
    }
  }, [canSave, name, servingCount, ingredients, t]);

  return (
    <Screen
      title={t('recipesList.newRecipe')}
      variant="floating"
      eyebrow={t('food.title')}
      showBack
      footer={<Button title={t('newRecipe.save')} onPress={() => void save()} disabled={!canSave} loading={saving} />}
    >
      <TextField
        label={t('food.nameField')}
        value={name}
        onChangeText={setName}
        placeholder={t('newRecipe.namePlaceholder')}
      />

      <Stepper label={t('newRecipe.servings')} value={servingCount} min={1} max={50} onChange={setServingCount} />

      <View style={{ gap: space.sm }}>
        <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('newRecipe.ingredients')}
        </Text>
        {ingredients.length === 0 ? (
          <EmptyState
            icon="restaurant"
            title={t('newRecipe.emptyTitle')}
            message={t('newRecipe.emptyMessage')}
          />
        ) : (
          <Card padded={false} variant="elevated">
            {ingredients.map((it, i) => (
              <SwipeableRow
                key={`${it.food_name}-${i}`}
                onDelete={() => removeRow(i)}
                confirmTitle={t('food.removeTitle', { name: it.food_name })}
              >
                <Pressable
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => editRow(i)}
                  accessibilityLabel={t('food.savedEditLabel', { name: it.food_name })}
                  style={{
                    gap: space.xs,
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                    backgroundColor: surface.cardElevated,
                    borderTopWidth: i === 0 ? 0 : layout.hairline,
                    borderTopColor: surface.divider,
                  }}
                >
                  <Text variant="body" color={color.label}>
                    {it.food_name}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {formatGrams(it.quantity_g)} · {formatCalories(it.calories)}
                  </Text>
                </Pressable>
              </SwipeableRow>
            ))}
          </Card>
        )}
        <Button title={t('newRecipe.addIngredient')} icon="add" variant="secondary" onPress={openSearch} />
      </View>

      {ingredients.length > 0 ? (
        <Card variant="elevated">
          <Text variant="footnote" color={color.secondaryLabel}>
            {/* Kcal-only catalog → all-zero macros are meaningless; show calories only. */}
            {totals.protein + totals.carbs + totals.fat + totals.fibre === 0
              ? t('newRecipe.totalCalories', { kcal: formatNumber(totals.calories) })
              : t('newRecipe.totalMacros', {
                  kcal: formatNumber(totals.calories),
                  protein: Math.round(totals.protein),
                  carbs: Math.round(totals.carbs),
                  fat: Math.round(totals.fat),
                  fibre: Math.round(totals.fibre),
                })}
          </Text>
        </Card>
      ) : null}

      <BottomSheet
        visible={stage !== null}
        onClose={() => setStage(null)}
        title={stage?.kind === 'qty' ? stage.food.name : t('newRecipe.addIngredient')}
      >
        {stage?.kind === 'search' ? (
          <>
            <TextField
              placeholder={t('foodLog.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              accessibilityLabel={t('addMenu.searchFoods')}
            />
            {searching && searchLoading ? (
              <SkeletonList rows={3} />
            ) : searching && searchError ? (
              <ErrorState message={t('food.empty.searchFailed')} onRetry={retrySearch} />
            ) : searching && results.length === 0 ? (
              <EmptyState icon="magnifyingglass" title={t('foodLog.noMatches', { query: query.trim() })} />
            ) : !searching && recents.length === 0 ? (
              <EmptyState icon="magnifyingglass" title={t('newRecipe.searchHint')} />
            ) : (
              <Card padded={false}>
                {searchRows.map((r, i) => (
                  <Pressable
                    key={`${r.name}-${i}`}
                    haptic={false}
                    minTapTarget={false}
                    onPress={() => pickFood(r)}
                    accessibilityLabel={t('food.savedAddLabel', { name: r.name })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: space.sm,
                      paddingVertical: space.lg,
                      paddingHorizontal: space.lg,
                      borderTopWidth: i === 0 ? 0 : layout.hairline,
                      borderTopColor: surface.divider,
                    }}
                  >
                    <View style={{ flex: 1, gap: space.xs }}>
                      <Text variant="body" color={color.label}>
                        {r.name}
                      </Text>
                      <Text variant="footnote" color={color.secondaryLabel}>
                        {r.brand ? `${r.brand} · ` : ''}
                        {t('newRecipe.kcalPer100', { kcal: r.kcalPer100 })}
                      </Text>
                    </View>
                    <Icon name="add" size={20} color={color.label} />
                  </Pressable>
                ))}
              </Card>
            )}
          </>
        ) : stage?.kind === 'qty' ? (
          <>
            <TextField
              label={t('newRecipe.quantity')}
              value={stage.grams}
              onChangeText={setGrams}
              keyboardType="number-pad"
              placeholder={t('newRecipe.gramsPlaceholder')}
              accessibilityLabel={t('newRecipe.quantityLabel')}
            />
            <Button title={t('newRecipe.addToRecipe')} onPress={commitQty} disabled={!Number(stage.grams) || Number(stage.grams) <= 0} />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
