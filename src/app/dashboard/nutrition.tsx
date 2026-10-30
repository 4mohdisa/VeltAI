// Macros detail — one of the four Summary detail views, all four built to the
// same layout: a coloured kicker over a large title, a hero card (the headline
// stat + a chart), a secondary card and a Breakdown list.
//
// This one has no 14-day hero and no 7-day secondary, and that is deliberate:
// the food store holds TODAY only (hydrateFoodLog; DECISIONS.md architecture
// item 3 is not done), so there is no macro history to plot. Rather than draw a
// week of invented columns, the hero shows today's calorie ring and the
// secondary shows each macro against its own target — both of which are real.
// Fibre is real where the source provided it (Open Food Facts / USDA / a typed
// label); items from a source without a fibre figure add nothing to the total.
//
// The layout chrome (kicker, stat line, plot, axis, Breakdown row) is shared
// with the other three detail routes: src/components/display/DetailChart.tsx.
import type { JSX } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import {
  Axis,
  BreakdownRow,
  ChartHeader,
  KickerTitle,
  Plot,
  SEC_H,
  StatLine,
  type Col,
} from '@/components/display/DetailChart';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy, kcalToDisplay } from '@/lib/units';
import { useDailyMacros, useFoodLog } from '@/lib/data';

// ---------------------------------------------------------------------------
// Macro bindings
// ---------------------------------------------------------------------------

const pctOf = (consumed: number, target: number) => (target > 0 ? Math.round((consumed / target) * 100) : 0);

export default function NutritionDetailScreen(): JSX.Element {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const macros = useDailyMacros();
  const { data: meals, isLoading: loading, error: loadError, refetch } = useFoodLog();
  const cal = macros.calories;
  const remaining = formatEnergy(Math.max(0, cal.target - cal.consumed), energyUnit);

  const rows = [
    { key: 'protein', label: t('nutrition.protein'), tint: categoryAccent.protein, data: macros.protein },
    { key: 'carbs', label: t('nutrition.carbs'), tint: categoryAccent.carbs, data: macros.carbs },
    { key: 'fat', label: t('nutrition.fat'), tint: categoryAccent.fat, data: macros.fat },
    { key: 'fibre', label: t('nutrition.fibre'), tint: categoryAccent.fibre, data: macros.fibre },
  ].map((r) => ({ ...r, pct: pctOf(r.data.consumed, r.data.target) }));

  // Ceiling is 100% unless something is over target, so the target line is the
  // top of the plot and going over is visibly over.
  const ceiling = Math.max(100, ...rows.map((r) => r.pct));
  const cols: Col[] = rows.map((r) => ({
    key: r.key,
    bars: [{ h: (r.pct / ceiling) * SEC_H, tint: r.tint }],
  }));

  return (
    <Screen variant="floating" showBack>
      <KickerTitle kicker={t('nutrition.title')} title={t('nutrition.macrosTitle')} tint={categoryAccent.protein} />

      {loadError ? <LoadFailedNotice message="Couldn't load today's food." onRetry={refetch} /> : null}

      {/* Hero — the day's calories against the goal. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <StatLine
            value={formatNumber(kcalToDisplay(cal.consumed, energyUnit))}
            unit={`${energyUnit} from food`}
            sub={t('nutrition.remainingToday', { value: remaining })}
          />
          <ChartHeader title="Calories today" note={formatRelativeDate(new Date())} />
          {loading ? (
            <Skeleton height={SEC_H} rounded={radius.xl} />
          ) : (
            <View
              accessible
              accessibilityLabel={`Calories today. ${formatEnergy(cal.consumed, energyUnit)} of ${formatEnergy(cal.target, energyUnit)}, ${remaining} left.`}
              style={{ alignItems: 'center' }}
            >
              <DailyMacroRing consumed={cal.consumed} target={cal.target} energyUnit={energyUnit} />
            </View>
          )}
        </View>
      </Card>

      {/* Secondary — each macro against its own target. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <ChartHeader title="Against targets" note="Percent of target" />
          {loading ? (
            <Skeleton height={SEC_H} rounded={radius.xl} />
          ) : (
            <>
              <Plot
                cols={cols}
                height={SEC_H}
                ceiling={`${ceiling}%`}
                summary={rows.map((r) => `${r.label} ${r.pct} percent of target`).join(', ')}
              />
              <Axis labels={rows.map((r) => r.label)} />
              <Text variant="footnote" color={color.secondaryLabel}>
                {rows.map((r) => `${r.label} ${r.pct}%`).join(' · ')}
              </Text>
            </>
          )}
        </View>
      </Card>

      {/* Breakdown — grams eaten against each daily target. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="bodyMedium" color={color.label} accessibilityRole="header">
            Breakdown
          </Text>
          {rows.map((r) => (
            <BreakdownRow
              key={r.key}
              tint={r.tint}
              label={r.label}
              sub={`${r.pct}% of target`}
              value={formatNumber(r.data.consumed)}
              unit={`of ${formatNumber(r.data.target)} g`}
              fraction={r.data.target > 0 ? r.data.consumed / r.data.target : 0}
            />
          ))}
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
            // The per-meal detail route is gone (architecture item 4): a meal's
            // rows live on the food tab, and each one opens the shared detail sheet.
            onPress={() => router.push('/(tabs)/food')}
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

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        Targets scale with your calorie goal. Lume tracks today only, so there is no macro history to chart yet.
      </Text>

      <HealthDisclaimer />
    </Screen>
  );
}
