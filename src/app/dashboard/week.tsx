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
// ponytail: the layout chrome below is duplicated across the four detail routes
// (this change's scope was the routes, with no shared component file to hoist
// into). Extract to src/components/display/DetailChart.tsx when a fifth lands.
import type { JSX } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ProgressBar, Skeleton } from '@/components/display';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, layout, opacity, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { burnOf, dayMonth, mean, netOf, useEnergyRange, weekdayShort } from '@/lib/data/energyRange';
import type { EnergyBalance } from '@/lib/types';

/** Plot heights composed from the spacing scale (176 / 120 in the design). */
const HERO_H = space['5xl'] * 2 + space['4xl'];
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
// Week bindings
// ---------------------------------------------------------------------------

const signed = (n: number) => `${n < 0 ? '-' : '+'}${formatNumber(Math.abs(n))}`;

function heroLabels(dates: string[]): string[] {
  const marks = new Set([0, Math.floor(dates.length / 3), Math.floor((dates.length * 2) / 3), dates.length - 1]);
  return dates.map((d, i) => (marks.has(i) ? dayMonth(d) : ''));
}

type Mode = 'balance' | 'net';

export default function WeekDetailScreen(): JSX.Element {
  const { days, loading } = useEnergyRange();

  return (
    <Screen variant="floating" showBack>
      <KickerTitle kicker="Nutrition" title="This week" tint={accent.blue} />
      {loading ? (
        <>
          <Skeleton height={HERO_H} rounded={radius.xl} />
          <Skeleton height={SEC_H} rounded={radius.xl} />
        </>
      ) : days.length === 0 ? (
        <EmptyState
          icon="chart.bar.xaxis"
          title="No days yet"
          message="Log some food and workouts to see your week."
        />
      ) : (
        <Body days={days} />
      )}
    </Screen>
  );
}

function Body({ days }: { days: EnergyBalance[] }): JSX.Element {
  const [mode, setMode] = useState<Mode>('balance');
  const week = days.slice(-7);

  // Averages over the days that actually carry the value. Nulls are dropped,
  // never counted as zero.
  const avgIn14 = mean(days.map((d) => d.calories_in));
  const avgInWeek = mean(week.map((d) => d.calories_in));
  const weekNets = week.map(netOf).filter((n): n is number => n != null);
  const avgNetWeek = mean(weekNets);
  const deficits = weekNets.filter((n) => n < 0).length;

  // Hero: fourteen days of intake, from zero.
  const heroScale = Math.max(1, ...days.map((d) => d.calories_in));
  const heroCols: Col[] = days.map((d, i) => ({
    key: d.date,
    dim: i !== days.length - 1,
    bars: [{ h: (d.calories_in / heroScale) * HERO_H, tint: accent.blue }],
  }));

  // Secondary: this week's net, drawn as magnitude with direction in the colour
  // (and named in the readout, so colour is never the only encoding).
  const secScale = Math.max(1, ...weekNets.map((n) => Math.abs(n)));
  const secCols: Col[] = week.map((d) => {
    const net = netOf(d);
    return {
      key: d.date,
      // No net → no bar. This is the gap the server asked for, not a zero.
      bars: net == null ? [] : [{ h: (Math.abs(net) / secScale) * SEC_H, tint: net < 0 ? accent.blue : categoryAccent.calories }],
    };
  });

  const rowMax = Math.max(1, ...weekNets.map((n) => Math.abs(n)));
  const target = week.length > 0 ? week[week.length - 1].target : null;

  return (
    <>
      {/* Hero — the headline average, then fourteen days of intake. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <SegmentedField
            variant="inset"
            options={[
              { label: 'In & out', value: 'balance' },
              { label: 'Net', value: 'net' },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === 'balance' ? (
            <StatLine
              value={avgInWeek != null ? formatNumber(avgInWeek) : '—'}
              unit="kcal eaten per day"
              sub={
                week.length > 0
                  ? `${dayMonth(week[0].date)} – ${dayMonth(week[week.length - 1].date)}`
                  : undefined
              }
            />
          ) : (
            <StatLine
              value={avgNetWeek != null ? signed(avgNetWeek) : '—'}
              unit="kcal net per day"
              sub={`Averaged over the ${weekNets.length} of ${week.length} days Lume could compute`}
            />
          )}
          <View style={{ gap: space.sm }}>
            <ChartHeader title="Calories eaten" note={`Last ${days.length} days`} />
            <Plot
              cols={heroCols}
              height={HERO_H}
              ceiling={formatNumber(heroScale)}
              summary={`Calories eaten on each of the last ${days.length} days, scale up to ${formatNumber(heroScale)} kcal.`}
            />
            <Axis labels={heroLabels(days.map((d) => d.date))} />
          </View>
          {avgIn14 != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {`Over the last ${days.length} days you ate ${formatNumber(avgIn14)} kcal a day on average.${
                target != null ? ` Target ${formatNumber(target)} kcal.` : ''
              }`}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Secondary — surplus against deficit, day by day. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <ChartHeader title="Daily net" note="Surplus vs deficit" />
          {weekNets.length === 0 ? (
            <EmptyState
              icon="chart.bar.xaxis"
              title="No net yet"
              message="Add your body stats in onboarding so Lume can work out what you burn."
            />
          ) : (
            <>
              <Plot
                cols={secCols}
                height={SEC_H}
                ceiling={formatNumber(secScale)}
                summary={`Daily net for ${weekNets.length} of the last ${week.length} days, largest ${formatNumber(secScale)} kcal.`}
              />
              <Axis labels={week.map((d) => weekdayShort(d.date).charAt(0))} />
              {avgNetWeek != null ? (
                <Text variant="footnote" color={color.secondaryLabel}>
                  {`Average ${signed(avgNetWeek)} kcal per day · ${deficits} of ${weekNets.length} days in deficit.`}
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
            Breakdown
          </Text>
          {week.map((d) => {
            const net = netOf(d);
            const burn = burnOf(d);
            return (
              <BreakdownRow
                key={d.date}
                tint={net == null ? color.light3 : net < 0 ? accent.blue : categoryAccent.calories}
                label={formatRelativeDate(new Date(`${d.date}T00:00:00`))}
                sub={
                  burn != null
                    ? `In ${formatNumber(d.calories_in)} · burned ${formatNumber(burn)}`
                    : `In ${formatNumber(d.calories_in)} · burn not computed`
                }
                value={net == null ? '—' : signed(net)}
                unit={net == null ? undefined : 'kcal'}
                fraction={net == null ? 0 : Math.abs(net) / rowMax}
              />
            );
          })}
        </View>
      </Card>

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        Averages cover the days Lume could compute. A day without a net is left out rather than counted as zero.
      </Text>
    </>
  );
}
