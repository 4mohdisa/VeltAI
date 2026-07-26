// Recipes list (Task 3) — one card per recipe (per-serving kcal + servings), with
// a [Log] that opens a "how many servings?" sheet before logging into today's
// current slot. Best-effort + offline-safe. Refetches on focus so a recipe created
// on /food/new-recipe shows up on return. `onNew` is wired by the parent screen.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonCard } from '@/components/display';
import { Button, Stepper } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, motion, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { slotForNow } from '@/lib/data';
import { todayISO } from '@/lib/data/mappers';
import { api, type Recipe } from '@/lib/api';

export function RecipesList({ onNew }: { onNew: () => void }) {
  const reduceMotion = useReduceMotion();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [sheetFor, setSheetFor] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecipes(await api.recipes.list());
    } catch (e) {
      if (__DEV__) console.warn('[meals] recipes.list failed:', e instanceof Error ? e.message : e);
      setRecipes([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openLog = (r: Recipe) => {
    setServings(1);
    setSheetFor(r);
  };

  const confirmLog = async () => {
    if (!sheetFor) return;
    setLogging(true);
    try {
      await api.recipes.log(sheetFor.id, servings, slotForNow(), todayISO());
      showToast({ message: `Logged ${servings.toFixed(1)} × ${sheetFor.name}.`, tone: 'success' });
      setSheetFor(null);
      void load();
    } catch (e) {
      if (__DEV__) console.warn('[meals] recipes.log failed:', e instanceof Error ? e.message : e);
      showToast({ message: `Couldn't log ${sheetFor.name}. Try again.`, tone: 'error' });
    } finally {
      setLogging(false);
    }
  };

  if (recipes === null) {
    return (
      <View style={{ gap: space.md }}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon="restaurant"
        title="No recipes yet"
        message="Build one from your foods."
        actionLabel="New Recipe"
        onAction={onNew}
      />
    );
  }

  return (
    <>
      <View style={{ gap: space.md }}>
        {recipes.map((r, i) => (
          <Animated.View
            key={r.id}
            entering={reduceMotion ? undefined : FadeInDown.delay(i * 40).duration(motion.duration.fast)}
          >
            <Card>
              <View style={{ gap: space.sm }}>
                <Text variant="bodyBold" color={color.black}>
                  {r.name}
                </Text>
                <Text variant="footnote" color={color.gray500}>
                  {Math.round(r.total_calories / Math.max(1, r.serving_count))} kcal / serving · Makes {r.serving_count}
                </Text>
                <View style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                  <Button title="Log" variant="secondary" fullWidth={false} onPress={() => openLog(r)} />
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>

      <BottomSheet
        visible={sheetFor !== null}
        onClose={() => setSheetFor(null)}
        title={sheetFor ? `Log ${sheetFor.name}` : undefined}
      >
        <Stepper
          label="How many servings?"
          value={servings}
          min={0.5}
          max={20}
          step={0.5}
          onChange={setServings}
          formatValue={(v) => v.toFixed(1)}
        />
        <Button title="Log" loading={logging} onPress={() => void confirmLog()} />
      </BottomSheet>
    </>
  );
}
