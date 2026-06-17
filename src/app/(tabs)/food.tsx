// C1 · Food log (default)
// Today's meals as chronological cards with a running daily total, plus a manual
// search bar at the top (mock Open Food Facts + recents → serving picker → add).
// Floating + opens the 2×2 add-menu. Pull-to-refresh.
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { TextField } from '@/components/forms/TextField';
import { GlassFab } from '@/components/navigation/GlassButtons';
import { MealCard } from '@/components/domain/MealCard';
import { color, space, zIndex } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { foodCatalog, mockMeals, type FoodResult } from '@/lib/mock/data';

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const meals = mockMeals;
  const total = meals.reduce((sum, m) => sum + m.calories, 0);

  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as FoodResult[];
    return foodCatalog.filter((r) => r.name.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  // Picking a search result opens the serving-size picker before adding.
  const pick = (food: FoodResult) =>
    router.push({
      pathname: '/food/serving',
      params: { name: food.name, kcalPer100: String(food.kcalPer100) },
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="title1" color={color.black}>
            {t('foodLog.today')}
          </Text>
          <Text variant="callout" color={color.gray500}>
            {formatCalories(total)}
          </Text>
        </View>

        <TextField
          placeholder={t('foodLog.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          accessibilityLabel={t('foodLog.searchPlaceholder')}
        />

        {searching ? (
          <>
            {results.length > 0 ? (
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
                        {t('foodLog.per100', { value: formatCalories(food.kcalPer100) })}
                      </Text>
                    </View>
                    <Icon name="add-circle-outline" size={22} color={color.black} />
                  </Pressable>
                ))}
              </Card>
            ) : (
              <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
                {t('foodLog.noMatches', { query: query.trim() })}
              </Text>
            )}

            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() => router.push('/food/custom-food')}
              accessibilityLabel="Add custom food"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md }}
            >
              <Icon name="create-outline" size={18} color={color.black} />
              <Text variant="bodyBold" color={color.black}>
                {t('foodLog.addCustomFood')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {meals.length === 0 ? (
              <EmptyState
                icon="restaurant-outline"
                title={t('foodLog.noMealsTitle')}
                message={t('foodLog.noMealsMessage')}
                actionLabel={t('foodLog.addMeal')}
                onAction={() => router.push('/food/add')}
              />
            ) : (
              meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onPress={() => router.push(`/food/${meal.id}`)} />
              ))
            )}

            {meals.length > 0 ? (
              <Pressable
                haptic={false}
                minTapTarget={false}
                onPress={() => router.push('/food/history')}
                accessibilityLabel={t('foodLog.mealHistory')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: space.md }}
              >
                <Icon name="time-outline" size={16} color={color.black} />
                <Text variant="bodyBold" color={color.black}>
                  {t('foodLog.mealHistory')}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Glass FAB — opens the 2×2 add-menu, floats clear of the tab bar */}
      <GlassFab
        accessibilityLabel={t('foodLog.addMeal')}
        onPress={() => router.push('/food/add')}
        style={{
          position: 'absolute',
          right: space.xl,
          bottom: insets.bottom + space['5xl'] + space.lg,
          zIndex: zIndex.fab,
        }}
      />
    </SafeAreaView>
  );
}
