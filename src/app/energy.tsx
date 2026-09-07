// Energy balance detail — the last 7 days of intake vs expenditure with a
// weekly summary and a per-day View-based bar chart (in vs out). Reads
// GET /api/energy-balance/week via useEnergyWeek(); degrades to an empty state
// with no backend. No new deps — bars are plain Views, same as MuscleChart.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { EmptyState } from '@/components/display/EmptyState';
import { ProgressBar, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { useEnergyWeek } from '@/lib/data/energy';
import type { EnergyBalance } from '@/lib/types';

const round = (n: number) => Math.round(n);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// weekdayLabel reads the YYYY-MM-DD as a UTC date so the label never drifts by a
// timezone (the string is already the server's calendar day).
function weekdayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const i = d.getUTCDay();
  return Number.isNaN(i) ? date.slice(5) : WEEKDAYS[i];
}

function outValue(d: EnergyBalance): number {
  return d.calories_out_total ?? d.calories_out_exercise;
}

function Bar({ label, value, max, tint }: { label: string; value: number; max: number; tint: string }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      {/* Tiny per-bar label — the bars must not be colour-only (matches EnergyBalanceCard). */}
      <Text variant="caption" color={color.secondaryLabel} style={{ minWidth: 24 }}>
        {label}
      </Text>
      {/* Track light2, fill in the series accent — the design's progress rule. */}
      <ProgressBar value={max > 0 ? value / max : 0} tint={tint} track={color.light2} style={{ flex: 1 }} />
    </View>
  );
}

const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function DayRow({ d, max }: { d: EnergyBalance; max: number }): JSX.Element {
  const out = outValue(d);
  const net = d.net_balance;
  const day = new Date(d.date + 'T00:00:00Z').getUTCDay();
  const dayName = Number.isNaN(day) ? d.date : WEEKDAYS_FULL[day];
  const netSpoken = net == null ? 'net unknown' : `net ${net < 0 ? 'minus ' : ''}${round(Math.abs(net))}`;
  return (
    <View
      accessible
      accessibilityLabel={`${dayName}: in ${round(d.calories_in)}, out ${round(out)}, ${netSpoken}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}
    >
      <Text variant="caption" color={color.secondaryLabel} style={{ minWidth: 34 }}>
        {weekdayLabel(d.date)}
      </Text>
      <View style={{ flex: 1, gap: space.xs }}>
        <Bar label="In" value={d.calories_in} max={max} tint={categoryAccent.calories} />
        <Bar label="Out" value={out} max={max} tint={accent.blue} />
      </View>
      <Text variant="caption" color={color.label} style={{ minWidth: 54, textAlign: 'right' }}>
        {net != null ? `${net > 0 ? '+' : ''}${round(net)}` : '—'}
      </Text>
    </View>
  );
}

export default function EnergyScreen(): JSX.Element {
  const { week, loading } = useEnergyWeek();

  return (
    <Screen variant="floating" eyebrow="Last 7 days" title="Energy balance" showBack>
      {loading ? (
        <>
          <Skeleton height={110} rounded={radius.xl} />
          <Skeleton height={220} rounded={radius.xl} />
        </>
      ) : !week || week.days.length === 0 ? (
        <EmptyState
          icon="flame"
          title="No data yet"
          message="Log some food and workouts to see your daily energy balance."
        />
      ) : (
        <Body week={week} />
      )}
    </Screen>
  );
}

function Body({ week }: { week: NonNullable<ReturnType<typeof useEnergyWeek>['week']> }): JSX.Element {
  const max = Math.max(1, ...week.days.map((d) => Math.max(d.calories_in, outValue(d))));

  return (
    <>
      {/* Weekly summary */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <CardHeaderRow title="Weekly average" icon="flame" tint={categoryAccent.calories} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center', gap: space.xs }}>
              <Text variant="statSmall" color={color.label}>
                {round(week.weekly_average_in)}
              </Text>
              <Text variant="caption" color={color.secondaryLabel}>
                avg in
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: space.xs }}>
              <Text variant="statSmall" color={color.label}>
                {round(week.weekly_average_out)}
              </Text>
              <Text variant="caption" color={color.secondaryLabel}>
                avg out
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: space.xs }}>
              <Text variant="statSmall" color={color.label}>
                {week.weekly_net > 0 ? '+' : ''}
                {round(week.weekly_net)}
              </Text>
              <Text variant="caption" color={color.secondaryLabel}>
                net/day
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Per-day chart */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <CardHeaderRow title="Daily balance" icon="chart.bar.fill" tint={accent.blue} />
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: categoryAccent.calories }} />
              <Text variant="caption" color={color.secondaryLabel}>
                In
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: accent.blue }} />
              <Text variant="caption" color={color.secondaryLabel}>
                Out
              </Text>
            </View>
          </View>
          {week.days.map((d) => (
            <DayRow key={d.date} d={d} max={max} />
          ))}
        </View>
      </Card>
    </>
  );
}
