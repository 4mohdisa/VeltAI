// Energy balance detail — one of the four Summary detail views, all four built
// to the same layout: a coloured kicker over a large title, a hero card (the
// headline stat + a 14-day chart), a secondary card (the same metric across
// this week) and a Breakdown list.
//
// Data: two GET /api/energy-balance/week calls seven days apart (useEnergyRange)
// give fourteen server-computed days. A day the server could not compute
// (net_balance / calories_out_total null) is drawn as a GAP and listed as an em
// dash — never as a zero. Steps and a daily burn target are NOT rendered: the
// app has no source for either (UI_PASS_GAPS.md).
//
// The layout chrome (kicker, stat line, plot, axis, Breakdown row) is shared
// with the other three detail routes: src/components/display/DetailChart.tsx.
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display';
import {
  Axis,
  BreakdownRow,
  ChartHeader,
  HERO_H,
  KickerTitle,
  Plot,
  SEC_H,
  StatLine,
  heroLabels,
  type Col,
} from '@/components/display/DetailChart';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, layout, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { burnOf, mean, netOf, useEnergyRange, weekdayShort } from '@/lib/data/energyRange';
import type { EnergyBalance } from '@/lib/types';

// ---------------------------------------------------------------------------
// Energy bindings
// ---------------------------------------------------------------------------

const signed = (n: number) => `${n < 0 ? '-' : '+'}${formatNumber(Math.abs(n))}`;

export default function EnergyScreen(): JSX.Element {
  const { t } = useTranslation();
  const { days, loading } = useEnergyRange();
  const latest = days.length > 0 ? days[days.length - 1] : null;

  return (
    <Screen variant="floating" showBack contentStyle={{ gap: space.lg }}>
      <KickerTitle kicker={t('dashboard.energy')} title={t('dashboard.energyBalance.title')} tint={categoryAccent.calories} />
      {loading ? (
        <>
          <Skeleton height={HERO_H} rounded={radius.xl} />
          <Skeleton height={SEC_H} rounded={radius.xl} />
        </>
      ) : latest == null ? (
        <EmptyState
          icon="flame"
          title={t('dashboard.energyNoDataTitle')}
          message={t('dashboard.energyNoDataMessage')}
        />
      ) : (
        <Body days={days} latest={latest} />
      )}
    </Screen>
  );
}

function Body({ days, latest }: { days: EnergyBalance[]; latest: EnergyBalance }): JSX.Element {
  const { t } = useTranslation();
  const net = netOf(latest);
  const latestBurn = burnOf(latest);

  // Hero: one floating bar per day, spanning what was eaten to what was burned.
  const heroScale = Math.max(1, ...days.map((d) => Math.max(d.calories_in, burnOf(d) ?? 0)));
  const heroCols: Col[] = days.map((d) => {
    const burn = burnOf(d);
    if (burn == null) return { key: d.date, bars: [] }; // uncomputable day → gap
    const lo = Math.min(d.calories_in, burn);
    const hi = Math.max(d.calories_in, burn);
    return {
      key: d.date,
      bars: [
        {
          h: Math.max(layout.hairline, ((hi - lo) / heroScale) * HERO_H),
          bottom: (lo / heroScale) * HERO_H,
          tint: d.calories_in > burn ? categoryAccent.calories : accent.blue,
        },
      ],
    };
  });
  const spanned = heroCols.filter((c) => c.bars.length > 0).length;
  // Deficits are counted only over the days that HAVE a net. A null net is not
  // a zero and must not quietly land on the surplus side of the count.
  const nets = days.map(netOf).filter((n): n is number => n != null);
  const deficits = nets.filter((n) => n < 0).length;

  // Secondary: intake and burn side by side across the last seven days.
  const week = days.slice(-7);
  const weekAvgIn = mean(week.map((d) => d.calories_in));
  const secScale = Math.max(1, ...week.map((d) => Math.max(d.calories_in, burnOf(d) ?? 0)));
  const secCols: Col[] = week.map((d) => {
    const burn = burnOf(d);
    return {
      key: d.date,
      bars: [
        { h: (d.calories_in / secScale) * SEC_H, tint: categoryAccent.calories },
        // A day with no computed burn contributes an empty slot, not a zero bar.
        { h: burn == null ? 0 : (burn / secScale) * SEC_H, tint: accent.blue },
      ],
    };
  });

  // Breakdown: the parts of the latest day the server actually reported.
  const rows = [
    { id: 'intake', tint: categoryAccent.calories, label: t('dashboard.energyBalance.intake'), sub: t('dashboard.foodYouLogged'), value: latest.calories_in },
    ...(latest.calories_out_bmr != null
      ? [{ id: 'resting', tint: color.light3, label: t('dashboard.restingEnergy'), sub: t('dashboard.baselineMetabolism'), value: latest.calories_out_bmr }]
      : []),
    {
      id: 'workout',
      tint: categoryAccent.positive,
      label: t('dashboard.workout'),
      sub: latest.calories_out_exercise > 0 ? t('dashboard.loggedGymSessions') : t('dashboard.noSessionLogged'),
      value: latest.calories_out_exercise,
    },
    ...(latestBurn != null
      ? [{ id: 'totalBurned', tint: accent.blue, label: t('dashboard.totalBurned'), sub: t('dashboard.restingPlusTraining'), value: latestBurn }]
      : []),
  ];
  const rowMax = Math.max(1, ...rows.map((r) => r.value));

  const dayLabel = formatRelativeDate(new Date(`${latest.date}T00:00:00`));

  return (
    <>
      {/* Hero — the headline number, then fourteen days of it. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          {net != null ? (
            <StatLine
              value={signed(net)}
              unit={net < 0 ? t('dashboard.kcalDeficit') : t('dashboard.kcalSurplus')}
              sub={t('dashboard.energyNetSub', { day: dayLabel })}
            />
          ) : (
            <StatLine
              value={formatNumber(latest.calories_in)}
              unit={t('dashboard.kcalEaten')}
              sub={t('dashboard.energyAddBodyStats')}
            />
          )}
          <View style={{ gap: space.sm }}>
            <ChartHeader title={t('dashboard.eatenAgainstBurned')} note={t('dashboard.lastDays', { count: days.length })} />
            {spanned < 2 ? (
              <EmptyState
                icon="chart.bar.xaxis"
                title={t('dashboard.energyNotEnoughDaysTitle')}
                message={t('dashboard.energyNotEnoughDaysMessage')}
              />
            ) : (
              <>
                <Plot
                  cols={heroCols}
                  height={HERO_H}
                  ceiling={formatNumber(heroScale)}
                  summary={t('dashboard.energyHeroSummary', { value: spanned, total: days.length, scale: formatNumber(heroScale) })}
                />
                <Axis labels={heroLabels(days.map((d) => d.date))} />
              </>
            )}
          </View>
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('dashboard.energyHeroCaption', { count: nets.length, deficits })}
          </Text>
        </View>
      </Card>

      {/* Secondary — the same two series, this week, side by side. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <ChartHeader title={t('dashboard.inAndOutTitle')} note={t('dashboard.thisWeek')} />
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <Legend tint={categoryAccent.calories} label={t('dashboard.eaten')} />
            <Legend tint={accent.blue} label={t('dashboard.energyBalance.burned')} />
          </View>
          <Plot
            cols={secCols}
            height={SEC_H}
            ceiling={formatNumber(secScale)}
            summary={t('dashboard.energyWeekSummary', { count: week.length, value: formatNumber(secScale) })}
          />
          <Axis labels={week.map((d) => weekdayShort(d.date).charAt(0))} />
          {weekAvgIn != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {t('dashboard.energyAverageEaten', { value: formatNumber(weekAvgIn) })}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Breakdown — where the latest day's calories came from and went. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="bodyMedium" color={color.label} accessibilityRole="header">
            {t('dashboard.breakdown')}
          </Text>
          {rows.map((r) => (
            <BreakdownRow
              key={r.id}
              tint={r.tint}
              label={r.label}
              sub={r.sub}
              value={formatNumber(r.value)}
              unit={t('dashboard.kcal')}
              fraction={r.value / rowMax}
            />
          ))}
        </View>
      </Card>

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        {latest.target != null
          ? `${t('dashboard.energyNetNote')} ${t('dashboard.weekTarget', { value: formatNumber(latest.target) })}`
          : t('dashboard.energyNetNote')}
      </Text>
    </>
  );
}

function Legend({ tint, label }: { tint: string; label: string }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
      <Text variant="caption" color={color.secondaryLabel}>
        {label}
      </Text>
    </View>
  );
}
