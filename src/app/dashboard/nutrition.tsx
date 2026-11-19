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

/** The design's chart right gutter and scale value label box. */
const CHART_GUTTER_W = 44;
const SCALE_LABEL_W = 40;
/** The design's fixed scale, in percent of target (Summary bundle :694). A macro over it is drawn at the top. */
const MACRO_CEILING = 130;
/** The design's macro bar width (Summary bundle :690). */
const MACRO_BAR_W = 30;
/** The design's macro bar corners, column gap and axis label line height (Summary bundle :307, :313-315). */
const MACRO_BAR_RADIUS_TOP = 5;
const MACRO_BAR_RADIUS_BOTTOM = 2;
const MACRO_BAR_GAP = 3;
const MACRO_AXIS_LINE_HEIGHT = 15;

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

  const cols: Col[] = rows.map((r) => ({
    key: r.key,
    bars: [{ h: Math.max(space.xs, (Math.min(r.pct, MACRO_CEILING) / MACRO_CEILING) * SEC_H), tint: r.tint, w: MACRO_BAR_W }],
  }));

  return (
    <Screen variant="floating" detail showBack contentStyle={{ gap: space.lg }}>
      <KickerTitle kicker={t('nutrition.title')} title={t('nutrition.macrosTitle')} tint={categoryAccent.protein} />

      {loadError ? <LoadFailedNotice message={t('nutrition.loadFailed')} onRetry={refetch} /> : null}

      {/* Hero — the day's calories against the goal. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <StatLine
            value={formatNumber(kcalToDisplay(cal.consumed, energyUnit))}
            unit={`${energyUnit} ${t('nutrition.fromFood')}`}
            sub={t('nutrition.remainingToday')}
            tight
          />
          <View style={{ gap: space.sm }}>
            <ChartHeader title={t('nutrition.caloriesToday')} note={formatRelativeDate(new Date())} hero />
            {loading ? (
              <Skeleton height={SEC_H} rounded={radius.xl} />
            ) : (
              <View
                accessible
                accessibilityLabel={t('nutrition.caloriesTodayLabel', { consumed: formatEnergy(cal.consumed, energyUnit), target: formatEnergy(cal.target, energyUnit), remaining })}
                style={{ alignItems: 'center' }}
              >
                <DailyMacroRing consumed={cal.consumed} target={cal.target} energyUnit={energyUnit} />
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Secondary — each macro against its own target. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <ChartHeader title={t('nutrition.todayAgainstTargets')} note={t('nutrition.percentOfTarget')} />
          {loading ? (
            <Skeleton height={SEC_H} rounded={radius.xl} />
          ) : (
            <>
              <View style={{ gap: space.sm }}>
                <Plot
                  cols={cols}
                  height={SEC_H}
                  ceiling={`${MACRO_CEILING}%`}
                  mid={`${MACRO_CEILING / 2}%`}
                  floor="0"
                  gridInset
                  gutterWidth={CHART_GUTTER_W}
                  scaleLabelWidth={SCALE_LABEL_W}
                  barRadius={{ top: MACRO_BAR_RADIUS_TOP, bottom: MACRO_BAR_RADIUS_BOTTOM }}
                  gap={MACRO_BAR_GAP}
                  growIn
                  summary={rows.map((r) => t('nutrition.macroPercentLabel', { macro: r.label, percent: r.pct })).join(', ')}
                />
                <Axis
                  labels={rows.map((r) => r.label)}
                  gutterWidth={CHART_GUTTER_W}
                  gap={MACRO_BAR_GAP}
                  labelColor={color.secondaryLabel}
                  labelLineHeight={MACRO_AXIS_LINE_HEIGHT}
                  labelFillsColumn
                />
              </View>
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
            {t('nutrition.breakdown')}
          </Text>
          {rows.map((r) => (
            <BreakdownRow
              key={r.key}
              tint={r.tint}
              label={r.label}
              sub={t('nutrition.percentOfTargetShort', { percent: r.pct })}
              value={formatNumber(r.data.consumed)}
              unit={t('nutrition.ofTargetGrams', { target: formatNumber(r.data.target) })}
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
              {t('nutrition.noMealsToday')}
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
        {t('nutrition.targetsScale', { goal: formatEnergy(cal.target, energyUnit) })}
      </Text>

      <HealthDisclaimer />
    </Screen>
  );
}
