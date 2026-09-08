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
// No new dependency: bars are plain Views, same as the previous version of this
// screen and as MuscleChart.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ProgressBar, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, layout, opacity, radius, space } from '@/lib/design/tokens';
import { formatNumber, formatRelativeDate } from '@/lib/formatting';
import { burnOf, dayMonth, mean, netOf, useEnergyRange, weekdayShort } from '@/lib/data/energyRange';
import type { EnergyBalance } from '@/lib/types';

// ---------------------------------------------------------------------------
// The shared detail chrome. Repeated verbatim in dashboard/week.tsx,
// dashboard/training.tsx and dashboard/nutrition.tsx so the four read as one
// view with four bindings; hoist it into a component when a fifth detail lands.
// ---------------------------------------------------------------------------

/** Plot heights composed from the spacing scale (176 / 120 in the design). */
const HERO_H = space['5xl'] * 2 + space['4xl'];
const SEC_H = space['5xl'] + space['4xl'] + space.sm;
/** Right gutter the scale ceiling label sits in, clear of the bars. */
const GUTTER = space['4xl'];

type Bar = { h: number; bottom?: number; tint: string };
type Col = { key: string; bars: Bar[]; dim?: boolean };

/** A column chart with two gridlines: the scale ceiling and the baseline. A
 *  column with no bars is a genuine gap — the day has no computable value. */
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

/** The x-axis under a Plot. Labels align with the columns, gutter included. */
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

/** The header line inside a chart card: what the chart shows, and its range. */
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

/** Coloured dot + uppercase category over the screen title (the design's kicker). */
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

/** The headline number + its unit, with an optional sub-line. */
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

/** One Breakdown line: dot · label + sub · value · unit, over a progress track. */
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
// Energy bindings
// ---------------------------------------------------------------------------

const signed = (n: number) => `${n < 0 ? '-' : '+'}${formatNumber(Math.abs(n))}`;

/** Only the first, a middle pair and the last date are labelled — 14 dates do
 *  not fit, and the design labels four of them. */
function heroLabels(dates: string[]): string[] {
  const marks = new Set([0, Math.floor(dates.length / 3), Math.floor((dates.length * 2) / 3), dates.length - 1]);
  return dates.map((d, i) => (marks.has(i) ? dayMonth(d) : ''));
}

export default function EnergyScreen(): JSX.Element {
  const { days, loading } = useEnergyRange();
  const latest = days.length > 0 ? days[days.length - 1] : null;

  return (
    <Screen variant="floating" showBack>
      <KickerTitle kicker="Energy" title="Energy balance" tint={categoryAccent.calories} />
      {loading ? (
        <>
          <Skeleton height={HERO_H} rounded={radius.xl} />
          <Skeleton height={SEC_H} rounded={radius.xl} />
        </>
      ) : latest == null ? (
        <EmptyState
          icon="flame"
          title="No data yet"
          message="Log some food and workouts to see your daily energy balance."
        />
      ) : (
        <Body days={days} latest={latest} />
      )}
    </Screen>
  );
}

function Body({ days, latest }: { days: EnergyBalance[]; latest: EnergyBalance }): JSX.Element {
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
    { tint: categoryAccent.calories, label: 'Intake', sub: 'Food you logged', value: latest.calories_in },
    ...(latest.calories_out_bmr != null
      ? [{ tint: color.light3, label: 'Resting energy', sub: 'Baseline metabolism', value: latest.calories_out_bmr }]
      : []),
    {
      tint: categoryAccent.positive,
      label: 'Workout',
      sub: latest.calories_out_exercise > 0 ? 'Logged gym sessions' : 'No session logged',
      value: latest.calories_out_exercise,
    },
    ...(latestBurn != null
      ? [{ tint: accent.blue, label: 'Total burned', sub: 'Resting energy plus training', value: latestBurn }]
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
              unit={`kcal ${net < 0 ? 'deficit' : 'surplus'}`}
              sub={`${dayLabel} · intake measured against total burn`}
            />
          ) : (
            <StatLine
              value={formatNumber(latest.calories_in)}
              unit="kcal eaten"
              sub="Add your body stats in onboarding to see your net balance."
            />
          )}
          <View style={{ gap: space.sm }}>
            <ChartHeader title="Eaten against burned" note={`Last ${days.length} days`} />
            {spanned < 2 ? (
              <EmptyState
                icon="chart.bar.xaxis"
                title="Not enough days yet"
                message="Two days with a computed burn are needed to draw a trend."
              />
            ) : (
              <>
                <Plot
                  cols={heroCols}
                  height={HERO_H}
                  ceiling={formatNumber(heroScale)}
                  summary={`Eaten against burned, ${spanned} of the last ${days.length} days, scale up to ${formatNumber(heroScale)} kcal.`}
                />
                <Axis labels={heroLabels(days.map((d) => d.date))} />
              </>
            )}
          </View>
          <Text variant="footnote" color={color.secondaryLabel}>
            {`Each bar spans the day between what you ate and what you burned. Blue days ended in a deficit, orange days in a surplus — ${deficits} of the ${nets.length} days with a computed net. Days Lume could not compute are left blank.`}
          </Text>
        </View>
      </Card>

      {/* Secondary — the same two series, this week, side by side. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <ChartHeader title="In and out" note="This week" />
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <Legend tint={categoryAccent.calories} label="Eaten" />
            <Legend tint={accent.blue} label="Burned" />
          </View>
          <Plot
            cols={secCols}
            height={SEC_H}
            ceiling={formatNumber(secScale)}
            summary={`Eaten and burned for each of the last ${week.length} days, scale up to ${formatNumber(secScale)} kcal.`}
          />
          <Axis labels={week.map((d) => weekdayShort(d.date).charAt(0))} />
          {weekAvgIn != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {`Averaging ${formatNumber(weekAvgIn)} kcal eaten a day this week.`}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Breakdown — where the latest day's calories came from and went. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="bodyMedium" color={color.label} accessibilityRole="header">
            Breakdown
          </Text>
          {rows.map((r) => (
            <BreakdownRow
              key={r.label}
              tint={r.tint}
              label={r.label}
              sub={r.sub}
              value={formatNumber(r.value)}
              unit="kcal"
              fraction={r.value / rowMax}
            />
          ))}
        </View>
      </Card>

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        {latest.target != null
          ? `Net is intake minus total burn. Target ${formatNumber(latest.target)} kcal.`
          : 'Net is intake minus total burn.'}
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
