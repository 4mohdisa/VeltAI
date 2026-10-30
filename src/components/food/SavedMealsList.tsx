// Saved meals list (Task 2) — one card per saved meal with a one-tap [Log now]
// that logs every item into today's current slot. Best-effort + offline-safe:
// a failed list() degrades to an empty list; a failed log() shows an error toast.
// Refetches on focus so a meal logged elsewhere (or a new recipe) stays fresh.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonCard } from '@/components/display';
import { Button } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { accent, color, motion, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { formatCalories } from '@/lib/formatting';
import { slotForNow } from '@/lib/data';
import { selectedFoodDate } from '@/lib/data/foodStore';
import { api, type SavedMeal } from '@/lib/api';

/** "Never logged" / "Last logged today|yesterday|N days ago" from an ISO date. */
function lastLoggedLabel(iso: string | null): string {
  if (!iso) return 'Never logged';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Never logged';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'Last logged today';
  if (days === 1) return 'Last logged yesterday';
  return `Last logged ${days} days ago`;
}

export function SavedMealsList() {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const [meals, setMeals] = useState<SavedMeal[] | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMeals(await api.savedMeals.list());
    } catch (e) {
      if (__DEV__) console.warn('[meals] savedMeals.list failed:', e instanceof Error ? e.message : e);
      setMeals([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const logNow = async (meal: SavedMeal) => {
    setLoggingId(meal.id);
    try {
      await api.savedMeals.log(meal.id, slotForNow(), selectedFoodDate());
      showToast({ message: t('savedMeals.logged', { name: meal.name }), tone: 'success' });
      void load();
    } catch (e) {
      if (__DEV__) console.warn('[meals] savedMeals.log failed:', e instanceof Error ? e.message : e);
      showToast({ message: t('savedMeals.logFailed', { name: meal.name }), tone: 'error' });
    } finally {
      setLoggingId(null);
    }
  };

  if (meals === null) {
    return (
      <View style={{ gap: space.md }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (meals.length === 0) {
    return (
      <EmptyState
        icon="bookmark"
        title="No saved meals yet"
        message="After logging the same meal 3 times, it appears here automatically. Or create one from a recipe."
      />
    );
  }

  return (
    <View style={{ gap: space.md }}>
      {meals.map((m, i) => (
        <Animated.View
          key={m.id}
          entering={reduceMotion ? undefined : FadeInDown.delay(i * 40).duration(motion.duration.fast)}
        >
          <Card variant="elevated">
            <View style={{ gap: space.sm }}>
              <CardHeaderRow title={m.name} icon="bookmark" tint={accent.turquoise} />
              <Text variant="footnote" color={color.secondaryLabel}>
                {formatCalories(m.total_calories)} · {m.items.length} {m.items.length === 1 ? 'item' : 'items'}
              </Text>
              <Text variant="caption" color={color.secondaryLabel}>
                {lastLoggedLabel(m.last_logged)}
              </Text>
              <View style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                <Button
                  title="Log now"
                  variant="secondary"
                  fullWidth={false}
                  loading={loggingId === m.id}
                  onPress={() => void logNow(m)}
                />
              </View>
            </View>
          </Card>
        </Animated.View>
      ))}
    </View>
  );
}
