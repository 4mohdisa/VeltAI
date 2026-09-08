// Macros detail — one of the four Summary detail views, all four built to the
// same layout: a coloured kicker over a large title, a hero card (the headline
// stat + a chart), a secondary card and a Breakdown list.
//
// This one has no 14-day hero and no 7-day secondary, and that is deliberate:
// the food store holds TODAY only (hydrateFoodLog; DECISIONS.md architecture
// item 3 is not done), so there is no macro history to plot. Rather than draw a
// week of invented columns, the hero shows today's calorie ring and the
// secondary shows each macro against its own target — both of which are real.
// Fibre reads 0 g because food items carry no fibre yet (see useDailyMacros).
//
// ponytail: the layout chrome below is duplicated across the four detail routes
// (this change's scope was the routes, with no shared component file to hoist
// into). Extract to src/components/display/DetailChart.tsx when a fifth lands.
import type { JSX } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { categoryAccent, color, layout, opacity, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy, kcalToDisplay } from '@/lib/units';
import { useDailyMacros, useFoodLog } from '@/lib/data';

/** Plot height composed from the spacing scale (120 in the design). */
const SEC_H = space['5xl'] + space['4xl'] + space.sm;
/** Right gutter the scale ceiling label sits in, clear of the bars. */
const GUTTER = space['4xl'];

type Bar = { h: number; bottom?: number; tint: string };
type Col = { key: string; bars: Bar[]; dim?: boolean };

function Plot({
  cols,
  height,
  ceiling,
  summary,
}: {
  cols: Col[];
  height: number;
  ceiling: string;
  summary: string;
}): JSX.Element {
  return (
    <View accessible accessibilityLabel={summary} style={{ height }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <Text
        variant="caption"
        color={color.tertiaryLabel}
        style={{ position: 'absolute', right: 0, top: 0, width: GUTTER, textAlign: 'right' }}
      >
        {ceiling}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: space.xs,
          height: '100%',
          paddingRight: GUTTER,
        }}
      >
        {cols.map((c) => (
          <View
            key={c.key}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: space.xs,
              opacity: c.dim ? opacity.medium : opacity.full,
            }}
          >
            {c.bars.map((b, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: b.h,
                  marginBottom: b.bottom ?? 0,
                  borderRadius: radius.sm,
                  backgroundColor: b.tint,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Axis({ labels }: { labels: string[] }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: space.xs, paddingRight: GUTTER }}>
      {labels.map((l, i) => (
        <Text
          key={i}
          variant="caption"
          color={color.tertiaryLabel}
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'center' }}
        >
          {l}
        </Text>
      ))}
    </View>
  );
}

function ChartHeader({ title, note }: { title: string; note: string }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
      <Text variant="bodyMedium" color={color.label} style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      <Text variant="caption" color={color.tertiaryLabel}>
        {note}
      </Text>
    </View>
  );
}

function KickerTitle({ kicker, title, tint }: { kicker: string; title: string; tint: string }): JSX.Element {
  return (
    <View style={{ gap: space.xs, paddingBottom: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
        <Text variant="label" color={tint} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {kicker}
        </Text>
      </View>
      <Text variant="title1" color={color.label} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

function StatLine({ value, unit, sub }: { value: string; unit: string; sub?: string }): JSX.Element {
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' }}>
        <Text variant="statLarge" color={color.label}>
          {value}
        </Text>
        <Text variant="callout" color={color.secondaryLabel}>
          {unit}
        </Text>
      </View>
      {sub ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function BreakdownRow({
  tint,
  label,
  sub,
  value,
  unit,
  fraction,
}: {
  tint: string;
  label: string;
  sub?: string;
  value: string;
  unit?: string;
  fraction: number;
}): JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={`${label}${sub ? `, ${sub}` : ''}, ${value}${unit ? ` ${unit}` : ''}`}
      style={{ gap: space.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="callout" color={color.label} numberOfLines={1}>
            {label}
          </Text>
          {sub ? (
            <Text variant="caption" color={color.tertiaryLabel} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
        <Text variant="statSmall" color={color.label}>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" color={color.tertiaryLabel}>
            {unit}
          </Text>
        ) : null}
      </View>
      <ProgressBar value={fraction} tint={tint} track={color.light2} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Macro bindings
// ---------------------------------------------------------------------------

const pctOf = (consumed: number, target: number) => (target > 0 ? Math.round((consumed / target) * 100) : 0);

export default function NutritionDetailScreen(): JSX.Element {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const macros = useDailyMacros();
  const { data: meals, isLoading: loading } = useFoodLog();
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
      <KickerTitle kicker="Macros" title={t('nutrition.title')} tint={categoryAccent.protein} />

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
