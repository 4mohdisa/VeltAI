// B4 · Nutrition detail
// Calories consumed vs target, per-macro progress bars (incl. fibre), then a
// per-meal breakdown — the design file's elevated-card layout under a floating
// header. ChartCard is not used here: the design heads each card with a
// CardHeaderRow (accent glyph + name) rather than an uppercase kicker, so the
// two chart cards are composed from Card + CardHeaderRow directly. ChartCard's
// single-VoiceOver-summary rule is kept.
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { formatRelativeDate } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useDailyMacros, useFoodLog } from '@/lib/data';

export default function NutritionDetailScreen() {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const macros = useDailyMacros();
  const { data: meals, isLoading: loading } = useFoodLog();
  const cal = macros.calories;
  const remaining = formatEnergy(Math.max(0, cal.target - cal.consumed), energyUnit);

  return (
    <Screen variant="floating" eyebrow={formatRelativeDate(new Date())} title={t('nutrition.title')} showBack>
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          {/* One VoiceOver element summarises the chart (HIG §7). */}
          <View
            accessible
            accessibilityLabel={`Calories today. ${formatEnergy(cal.consumed, energyUnit)} of ${formatEnergy(cal.target, energyUnit)}, ${remaining} left.`}
            style={{ gap: space.xs }}
          >
            <CardHeaderRow title="Calories today" icon="flame" tint={categoryAccent.calories} />
            <Text variant="callout" color={color.secondaryLabel}>
              {t('nutrition.remainingToday', { value: remaining })}
            </Text>
          </View>
          {loading ? (
            <Skeleton height={132} rounded={radius.xl} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <DailyMacroRing consumed={cal.consumed} target={cal.target} energyUnit={energyUnit} />
            </View>
          )}
        </View>
      </Card>

      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <View
            accessible
            accessibilityLabel={`Macros today. Protein ${macros.protein.consumed} of ${macros.protein.target} grams, carbs ${macros.carbs.consumed} of ${macros.carbs.target} grams, fat ${macros.fat.consumed} of ${macros.fat.target} grams, fibre ${macros.fibre.consumed} of ${macros.fibre.target} grams.`}
            style={{ gap: space.xs }}
          >
            <CardHeaderRow title="Macros today" icon="circle.grid.2x2.fill" tint={categoryAccent.protein} />
            <Text variant="callout" color={color.secondaryLabel}>
              {`Protein ${macros.protein.consumed} of ${macros.protein.target} g`}
            </Text>
          </View>
          {loading ? (
            <View accessibilityLabel="Loading" style={{ gap: space.sm }}>
              <Skeleton width="100%" height={14} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="90%" height={14} />
            </View>
          ) : (
            <MacroBars
              rows={[
                { label: t('nutrition.protein'), macroKey: 'Protein', data: macros.protein },
                { label: t('nutrition.carbs'), macroKey: 'Carbs', data: macros.carbs },
                { label: t('nutrition.fat'), macroKey: 'Fat', data: macros.fat },
                { label: t('nutrition.fibre'), macroKey: 'Fibre', data: macros.fibre },
              ]}
            />
          )}
        </View>
      </Card>

      {/* Meal breakdown — the design keeps the list's title inside its card. */}
      <Card variant="elevated" padded={false}>
        <View style={{ paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.md }}>
          <CardHeaderRow title={t('nutrition.mealsToday')} icon="fork.knife" tint={categoryAccent.positive} />
        </View>
        {meals.length === 0 ? (
          <View style={{ paddingHorizontal: space.xl, paddingBottom: space.xl }}>
            <Text variant="callout" color={color.secondaryLabel}>
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
              paddingHorizontal: space.xl,
              paddingVertical: space.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: color.light1,
            }}
          >
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="bodyBold" color={color.label}>
                {meal.slot}
              </Text>
              <Text variant="footnote" color={color.secondaryLabel}>
                {meal.time} · {formatEnergy(meal.calories, energyUnit)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={color.tertiaryLabel} />
          </Pressable>
        ))}
      </Card>

      <HealthDisclaimer />
    </Screen>
  );
}
