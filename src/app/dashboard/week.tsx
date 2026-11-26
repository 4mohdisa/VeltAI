// This week detail — one of the four Summary detail views, all four built to the
// same layout: a coloured kicker over a large title, a hero card (the headline
// stat + a 14-day chart), a secondary card (this week) and a Breakdown list.
//
// Data: fourteen server-computed days from useEnergyRange (two calls to
// GET /api/energy-balance/week seven days apart). Averages are derived from the
// day rows themselves so the "per day" label is unambiguous, and a day the
// server could not compute is EXCLUDED from the average and drawn as a gap —
// counting it as zero would drag the user's own average down with a non-fact.
//
// The layout chrome (kicker, stat line, plot, axis, Breakdown row) is shared
// with the other three detail routes: src/components/display/DetailChart.tsx.
import type { JSX } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
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
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { burnOf, dayMonth, mean, netOf, useEnergyRange, weekdayLetter, weekdayShort } from '@/lib/data/energyRange';
import { useUnitPreferences } from '@/lib/settings/store';
import type { EnergyBalance } from '@/lib/types';
import { formatEnergy, kcalToDisplay } from '@/lib/units';

// ---------------------------------------------------------------------------
// Week bindings
// ---------------------------------------------------------------------------

/** The design's Daily net bar width and the fade of the days not picked. */
const NET_BAR_W = 22;
const NET_DIM_OPACITY = 0.3;
const DAILY_NET_COLUMN_GAP = 3;
/** The design's hero bar share of its column and the fade of the days before today. */
const HERO_BAR_RATIO = 0.58;
const HERO_DIM_OPACITY = 0.8;
/** The design's chart right gutter and scale value label box, on both charts. */
const CHART_GUTTER_W = 44;
const SCALE_LABEL_W = 40;

const signed = (n: number) => `${n < 0 ? '-' : '+'}${formatNumber(Math.abs(n))}`;

type Mode = 'balance' | 'net';

export default function WeekDetailScreen(): JSX.Element {
  const { t } = useTranslation();
  const { days, loading, isError, refetch } = useEnergyRange();

  return (
    <Screen variant="floating" detail showBack contentStyle={{ gap: space.lg }}>
      <KickerTitle kicker={t('nutrition.title')} title={t('dashboard.thisWeek')} tint={accent.blue} />
      {loading ? (
        <>
          <Skeleton height={HERO_H} rounded={radius.xl} />
          <Skeleton height={SEC_H} rounded={radius.xl} />
        </>
      ) : isError ? (
        <LoadFailedNotice message={t('dashboard.energyLoadFailed')} onRetry={refetch} />
      ) : days.length === 0 ? (
        <EmptyState
          icon="chart.bar.xaxis"
          title={t('dashboard.weekNoDaysTitle')}
          message={t('dashboard.weekNoDaysMessage')}
        />
      ) : (
        <Body days={days} />
      )}
    </Screen>
  );
}

function Body({ days }: { days: EnergyBalance[] }): JSX.Element {
  const { t } = useTranslation();
  const unit = useUnitPreferences().energy;
  const amount = (kcal: number) => formatNumber(kcalToDisplay(kcal, unit));
  const signedAmount = (kcal: number) => signed(kcalToDisplay(kcal, unit));
  const [mode, setMode] = useState<Mode>('balance');
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const week = days.slice(-7);
  // The design opens on today; a tapped bar becomes the picked day.
  const picked = week.some((d) => d.date === pickedDate) ? pickedDate : week[week.length - 1].date;

  // Averages over the days that actually carry the value. Nulls are dropped,
  // never counted as zero.
  const avgIn14 = mean(days.map((d) => d.calories_in));
  const avgInWeek = mean(week.map((d) => d.calories_in));
  const weekNets = week.map(netOf).filter((n): n is number => n != null);
  const avgNetWeek = mean(weekNets);
  const deficits = weekNets.filter((n) => n < 0).length;

  // Hero: fourteen days of intake, from zero.
  const heroScale = Math.max(1, ...days.map((d) => d.calories_in)) * 1.16;
  const heroCols: Col[] = days.map((d, i) => ({
    key: d.date,
    dim: i !== days.length - 1,
    bars: [{ h: (d.calories_in / heroScale) * HERO_H, tint: i === days.length - 1 ? accent.blue : color.light3 }],
  }));
  const avgY = ((avgIn14 ?? 0) / heroScale) * HERO_H;
  const netTint = (net: number) => (net < 0 ? accent.blue : categoryAccent.calories);

  // Hero in Net mode: fourteen days of net, magnitude from zero with direction in the colour.
  const nets14 = days.map(netOf).filter((n): n is number => n != null);
  const netScale = Math.max(1, ...nets14.map((n) => Math.abs(n))) * 1.16;
  const heroNetCols: Col[] = days.map((d, i) => {
    const net = netOf(d);
    return {
      key: d.date,
      dim: i !== days.length - 1,
      bars: net == null ? [] : [{ h: (Math.abs(net) / netScale) * HERO_H, tint: netTint(net) }],
    };
  });

  // Secondary: this week's net, drawn as magnitude with direction in the colour
  // (and named in the readout, so colour is never the only encoding).
  const secScale = Math.max(1, ...weekNets.map((n) => Math.abs(n)));
  const secCols: Col[] = week.map((d) => {
    const net = netOf(d);
    return {
      key: d.date,
      dim: d.date !== picked,
      // No net → no bar. This is the gap the server asked for, not a zero.
      bars: net == null ? [] : [{ h: (Math.abs(net) / secScale) * SEC_H, w: NET_BAR_W, tint: netTint(net) }],
    };
  });

  const rowMax = Math.max(1, ...weekNets.map((n) => Math.abs(n)));
  const target = week.length > 0 ? week[week.length - 1].target : null;
  // Only a tapped bar names its day: the opening state stays the design's.
  const tapped = week.find((d) => d.date === pickedDate);
  const tappedNet = tapped ? netOf(tapped) : null;
  const tappedDay = tapped ? formatRelativeDate(new Date(`${tapped.date}T00:00:00`)) : '';

  return (
    <>
      {/* Hero — the headline average, then fourteen days of intake, or of net in Net mode. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <SegmentedField
            variant="inset"
            options={[
              { label: t('dashboard.inAndOut'), value: 'balance' },
              { label: t('dashboard.net'), value: 'net' },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === 'balance' ? (
            <StatLine
              value={avgInWeek != null ? amount(avgInWeek) : '—'}
              unit={t('dashboard.kcalEatenPerDay', { unit })}
              sub={
                week.length > 0
                  ? `${dayMonth(week[0].date)}${t('dashboard.rangeSeparator')}${dayMonth(week[week.length - 1].date)}`
                  : undefined
              }
              tight
            />
          ) : (
            <StatLine
              value={avgNetWeek != null ? signedAmount(avgNetWeek) : '—'}
              unit={t('dashboard.kcalNetPerDay', { unit })}
              sub={t('dashboard.weekNetAveragedOver', { value: weekNets.length, total: week.length })}
              tight
            />
          )}
          {mode === 'net' ? (
            nets14.length === 0 ? (
              <EmptyState icon="chart.bar.xaxis" title={t('dashboard.weekNoNetTitle')} message={t('dashboard.weekNoNetMessage')} />
            ) : (
              <View style={{ gap: space.sm }}>
                <ChartHeader title={t('dashboard.dailyNet')} note={t('dashboard.lastDays', { count: days.length })} hero />
                <Plot
                  cols={heroNetCols}
                  height={HERO_H}
                  ceiling={amount(netScale)}
                  barWidthRatio={HERO_BAR_RATIO}
                  dimOpacity={HERO_DIM_OPACITY}
                  gutterWidth={CHART_GUTTER_W}
                  scaleLabelWidth={SCALE_LABEL_W}
                  summary={t('dashboard.weekNetSummary', { value: nets14.length, total: days.length, largest: formatEnergy(netScale, unit) })}
                />
                <Axis labels={heroLabels(days.map((d) => d.date))} gutterWidth={CHART_GUTTER_W} />
              </View>
            )
          ) : (
            <View style={{ gap: space.sm }}>
              <ChartHeader title={t('dashboard.caloriesEaten')} note={t('dashboard.lastDays', { count: days.length })} hero />
              <View>
                <Plot
                  cols={heroCols}
                  height={HERO_H}
                  ceiling={amount(heroScale)}
                  barWidthRatio={HERO_BAR_RATIO}
                  dimOpacity={HERO_DIM_OPACITY}
                  gutterWidth={CHART_GUTTER_W}
                  scaleLabelWidth={SCALE_LABEL_W}
                  summary={t('dashboard.weekEatenSummary', { count: days.length, value: formatEnergy(heroScale, unit) })}
                />
                {avgIn14 != null ? (
                  <>
                    {/* Stops where Plot's columns stop: its gutter is CHART_GUTTER_W. */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: CHART_GUTTER_W,
                        top: HERO_H - avgY,
                        borderTopWidth: 2,
                        borderTopColor: accent.blue,
                        borderRadius: 2,
                      }}
                    />
                    <Text
                      variant="label"
                      color={accent.blue}
                      numberOfLines={1}
                      style={{ position: 'absolute', left: 0, bottom: avgY, paddingBottom: 2, fontSize: 12 }}
                    >
                      {t('dashboard.weekAverageLine', { value: formatEnergy(avgIn14, unit) })}
                    </Text>
                  </>
                ) : null}
              </View>
              <Axis labels={heroLabels(days.map((d) => d.date))} gutterWidth={CHART_GUTTER_W} />
            </View>
          )}
          {mode === 'balance' && avgIn14 != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {`${t('dashboard.weekEatenAverage', { count: days.length, value: formatEnergy(avgIn14, unit) })}${
                target != null ? ` ${t('dashboard.energyTarget', { value: formatEnergy(target, unit) })}` : ''
              }`}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Secondary — surplus against deficit, day by day. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <ChartHeader title={t('dashboard.dailyNet')} note={t('dashboard.surplusVsDeficit')} />
          {weekNets.length === 0 ? (
            <EmptyState
              icon="chart.bar.xaxis"
              title={t('dashboard.weekNoNetTitle')}
              message={t('dashboard.weekNoNetMessage')}
            />
          ) : (
            <>
              <View style={{ gap: space.sm }}>
                <View>
                  <Plot
                    cols={secCols}
                    height={SEC_H}
                    ceiling={amount(secScale)}
                    mid={amount(secScale / 2)}
                    floor="0"
                    gridInset
                    dimOpacity={NET_DIM_OPACITY}
                    gap={DAILY_NET_COLUMN_GAP}
                    gutterWidth={CHART_GUTTER_W}
                    scaleLabelWidth={SCALE_LABEL_W}
                    summary={t('dashboard.weekNetSummary', { value: weekNets.length, total: week.length, largest: formatEnergy(secScale, unit) })}
                  />
                  {/* One tap target per column, laid out like Plot's: the same gap, gutter CHART_GUTTER_W. */}
                  <View style={{ position: 'absolute', left: 0, right: CHART_GUTTER_W, top: 0, bottom: 0, flexDirection: 'row', gap: DAILY_NET_COLUMN_GAP }}>
                    {week.map((d) => (
                      <Pressable
                        key={d.date}
                        onPress={() => setPickedDate(d.date)}
                        haptic={false}
                        minTapTarget={false}
                        accessibilityLabel={weekdayShort(d.date)}
                        accessibilityState={{ selected: d.date === picked }}
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>
                </View>
                {/* Axis, with the picked day's letter bold as in the design. */}
                <View style={{ flexDirection: 'row', gap: DAILY_NET_COLUMN_GAP, paddingRight: CHART_GUTTER_W }}>
                  {week.map((d) => (
                    <Text
                      key={d.date}
                      variant="caption"
                      color={d.date === picked ? color.label : color.tertiaryLabel}
                      numberOfLines={1}
                      style={{ flex: 1, textAlign: 'center', fontWeight: d.date === picked ? '700' : '400' }}
                    >
                      {weekdayLetter(d.date)}
                    </Text>
                  ))}
                </View>
              </View>
              {tapped ? (
                <Text variant="footnote" color={color.label}>
                  {tappedNet == null
                    ? t('dashboard.weekPickedNoNet', { day: tappedDay })
                    : t('dashboard.weekPickedNet', { day: tappedDay, value: signedAmount(tappedNet), unit })}
                </Text>
              ) : null}
              {avgNetWeek != null ? (
                <Text variant="footnote" color={color.secondaryLabel}>
                  {t('dashboard.weekNetAverage', { value: signedAmount(avgNetWeek), unit, deficits, total: weekNets.length })}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </Card>

      {/* Breakdown — every day of this week, in and out. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="bodyMedium" color={color.label} accessibilityRole="header">
            {t('dashboard.breakdown')}
          </Text>
          {week.map((d) => {
            const net = netOf(d);
            const burn = burnOf(d);
            return (
              <BreakdownRow
                key={d.date}
                tint={net == null ? color.light3 : netTint(net)}
                label={formatRelativeDate(new Date(`${d.date}T00:00:00`))}
                sub={
                  burn != null
                    ? t('dashboard.weekRowBurned', { eaten: amount(d.calories_in), burned: amount(burn) })
                    : t('dashboard.weekRowNoBurn', { eaten: amount(d.calories_in) })
                }
                value={net == null ? '—' : signedAmount(net)}
                unit={net == null ? undefined : unit}
                fraction={net == null ? 0 : Math.abs(net) / rowMax}
              />
            );
          })}
        </View>
      </Card>

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        {t('dashboard.weekAveragesNote')}
      </Text>
    </>
  );
}
