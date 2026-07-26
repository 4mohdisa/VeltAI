// B4 · Nutrition detail
// Calories consumed vs target, the Apple Health calorie cross-check (intake vs
// active burn), per-macro progress bars (incl. fibre), then a per-meal breakdown.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { CalorieCrossCheck } from '@/components/domain/CalorieCrossCheck';
import { MacroBars } from '@/components/domain/MacroBars';
import { ChartCard } from '@/components/domain/ChartCard';
import { readActiveEnergyAndSteps, type HealthToday } from '@/lib/healthkit';
import { color, space } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useDailyMacros, useFoodLog } from '@/lib/data';

export default function NutritionDetailScreen() {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const macros = useDailyMacros();
  const { data: meals, isLoading: loading } = useFoodLog();
  const cal = macros.calories;
  // Read active energy + steps from Apple Health (mock); falls back to
  // intake-only if Health is denied/unavailable.
  const [health, setHealth] = useState<HealthToday | null>(null);
  useEffect(() => {
    readActiveEnergyAndSteps().then(setHealth);
  }, []);

  return (
    <Screen title={t('nutrition.title')} showBack>
      <ChartCard
        title="Calories today"
        loading={loading}
        takeaway={t('nutrition.remainingToday', {
          value: formatEnergy(Math.max(0, cal.target - cal.consumed), energyUnit),
        })}
        summary={`Calories today. ${formatEnergy(cal.consumed, energyUnit)} of ${formatEnergy(cal.target, energyUnit)}, ${formatEnergy(Math.max(0, cal.target - cal.consumed), energyUnit)} left.`}
      >
        <View style={{ alignItems: 'center' }}>
          <DailyMacroRing consumed={cal.consumed} target={cal.target} energyUnit={energyUnit} />
        </View>
      </ChartCard>

      <CalorieCrossCheck
        intake={cal.consumed}
        goal={cal.target}
        activeEnergy={health?.connected ? health.activeEnergy : undefined}
        energyUnit={energyUnit}
      />

      <ChartCard
        title="Macros today"
        loading={loading}
        takeaway={`Protein ${macros.protein.consumed} of ${macros.protein.target} g`}
        summary={`Macros today. Protein ${macros.protein.consumed} of ${macros.protein.target} grams, carbs ${macros.carbs.consumed} of ${macros.carbs.target} grams, fat ${macros.fat.consumed} of ${macros.fat.target} grams, fibre ${macros.fibre.consumed} of ${macros.fibre.target} grams.`}
      >
        <MacroBars
          rows={[
            { label: t('nutrition.protein'), macroKey: 'Protein', data: macros.protein },
            { label: t('nutrition.carbs'), macroKey: 'Carbs', data: macros.carbs },
            { label: t('nutrition.fat'), macroKey: 'Fat', data: macros.fat },
            { label: t('nutrition.fibre'), macroKey: 'Fibre', data: macros.fibre },
          ]}
        />
      </ChartCard>

      <View>
        <Text
          variant="footnote"
          color={color.gray500}
          style={{ marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {t('nutrition.mealsToday')}
        </Text>
        <Card padded={false}>
          {meals.length === 0 ? (
            <View style={{ padding: space.lg }}>
              <Text variant="callout" color={color.gray500}>
                No meals logged yet today.
              </Text>
            </View>
          ) : null}
          {meals.map((meal, i) => (
            <Pressable
              key={meal.id}
              haptic={false}
              minTapTarget={false}
              accessibilityLabel={`${meal.slot}, ${formatEnergy(meal.calories, energyUnit)}`}
              onPress={() => router.push(`/food/${meal.id}`)}
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
                <Text variant="bodyBold" color={color.black}>
                  {meal.slot}
                </Text>
                <Text variant="footnote" color={color.gray500}>
                  {meal.time} · {formatEnergy(meal.calories, energyUnit)}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={color.gray400} />
            </Pressable>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
