// C13 · My dishes
// Searchable list of saved / frequent / recent items (mock). Each row has a
// one-tap + Add that logs straight to today — no scan, AI or edit step. Tapping
// the row opens the shared item edit sheet, where "Delete item" un-saves it.
// Reached from the add-menu's "My dishes" card.
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { TextField } from '@/components/forms/TextField';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, layout, radius, space, surface } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { useSavedFoods, unsaveFood, logMeal, slotForNow } from '@/lib/data';
import { openFoodDetail, type DetailItem } from '@/lib/food/detailSubject';
import type { MealSlot, SavedFood } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const toEditable = (f: SavedFood): DetailItem => ({
  id: f.id,
  name: f.name,
  quantityG: f.servingG,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
});

export default function SavedFoodsScreen() {
  const { t } = useTranslation();
  // Slot targeting from the food log's per-meal "+" (via the add menu).
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const targetSlot: MealSlot | null = SLOTS.includes(slot as MealSlot) ? (slot as MealSlot) : null;
  const { data: foods, isLoading: loading, error: loadError, refetch } = useSavedFoods();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q));
  }, [foods, query]);

  // One-tap add: logs straight to today's slot through the data seam.
  const add = (f: SavedFood) => {
    logMeal(
      targetSlot ?? slotForNow(),
      { name: f.name, quantityG: f.servingG, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat },
      'manual',
    );
    showToast({ message: `Added ${f.name}.`, tone: 'success' });
  };

  // Editing / un-saving happens in the one shared detail sheet.
  const openDish = (f: SavedFood) => {
    openFoodDetail({ mode: 'saved', item: toEditable(f) });
    router.push('/food/detail');
  };

  const unsave = (id: string) => {
    unsaveFood(id);
    showToast({ message: 'Removed from saved.', tone: 'info' });
  };

  return (
    <SheetContent variant="leading" title={t('food.savedTitle')} onClose={() => router.canGoBack() && router.back()}>
      <TextField
        placeholder="Search saved…"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        accessibilityLabel="Search saved foods"
      />

      {loadError ? <LoadFailedNotice message={t('food.savedLoadFailed')} onRetry={refetch} /> : null}

      {loading ? (
        <SkeletonList rows={4} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={query.trim() ? 'magnifyingglass' : 'bookmark'}
          title={query.trim() ? `No matches for “${query.trim()}”.` : 'No saved foods yet'}
          message={
            query.trim()
              ? 'Try another name.'
              : 'Save a food from a meal or the edit sheet to re-add it here in one tap.'
          }
        />
      ) : (
        <Card padded={false}>
          {results.map((f, i) => (
            // Swipe-to-delete (Reanimated); tap → edit sheet Delete is the alternative.
            <SwipeableRow
              key={f.id}
              onDelete={() => unsave(f.id)}
              confirmTitle={`Remove ${f.name}?`}
              confirmMessage="This un-saves it."
              deleteLabel="Unsave"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  // Opaque so the swipe action stays hidden underneath; the fill
                  // matches the group's tile so the rows read as one surface.
                  backgroundColor: surface.tile,
                  borderTopWidth: i === 0 ? 0 : layout.hairline,
                  borderTopColor: surface.divider,
                }}
              >
                {/* Whole text area opens the edit / un-save sheet. */}
                <Pressable
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => openDish(f)}
                  accessibilityLabel={`Edit ${f.name}`}
                  style={{ flex: 1, gap: space.xs, paddingVertical: space.lg, paddingLeft: space.lg }}
                >
                  <Text variant="body" color={color.label}>
                    {f.name}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {f.brand ? `${f.brand} · ` : ''}
                    {f.servingG} g · {formatCalories(f.calories)} · P {f.protein}g
                  </Text>
                </Pressable>

                {/* One-tap add — logs straight to today, no edit step. */}
                <Pressable
                  haptic
                  minTapTarget={false}
                  onPress={() => add(f)}
                  accessibilityLabel={`Add ${f.name}`}
                  hitSlop={4}
                  style={{
                    width: space['2xl'],
                    height: space['2xl'],
                    borderRadius: radius.full,
                    backgroundColor: color.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: space.lg,
                  }}
                >
                  <Icon name="add" size={16} color={color.onPrimary} />
                </Pressable>
              </View>
            </SwipeableRow>
          ))}
        </Card>
      )}
    </SheetContent>
  );
}
