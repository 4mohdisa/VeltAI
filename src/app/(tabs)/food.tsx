// C1 · Food log (default)
// Today's meals as chronological cards with a running daily total. Empty state
// when nothing logged. Floating + opens the entry-method picker. Pull-to-refresh.
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { EmptyState } from '@/components/display/EmptyState';
import { MealCard } from '@/components/domain/MealCard';
import { color, radius, shadow, space, zIndex } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { mockMeals } from '@/lib/mock/data';

export default function FoodLogScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const meals = mockMeals;
  const total = meals.reduce((sum, m) => sum + m.calories, 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="title1" color={color.black}>
            Today
          </Text>
          <Text variant="callout" color={color.gray500}>
            {formatCalories(total)}
          </Text>
        </View>

        {meals.length === 0 ? (
          <EmptyState
            icon="restaurant-outline"
            title="No meals yet"
            message="Tap + to add your first meal."
            actionLabel="Add meal"
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
            accessibilityLabel="Meal history"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: space.md }}
          >
            <Icon name="time-outline" size={16} color={color.black} />
            <Text variant="bodyBold" color={color.black}>
              Meal history
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Floating add button */}
      <Pressable
        onPress={() => router.push('/food/add')}
        accessibilityLabel="Add meal"
        style={[
          {
            position: 'absolute',
            right: space.lg,
            bottom: space.xl,
            width: 56,
            height: 56,
            borderRadius: radius.full,
            backgroundColor: color.black,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: zIndex.fab,
          },
          shadow.md,
        ]}
      >
        <Icon name="add" size={30} color={color.white} />
      </Pressable>
    </SafeAreaView>
  );
}
