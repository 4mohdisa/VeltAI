// Energy balance detail — the last 7 days of intake vs expenditure with a
// weekly summary and a per-day View-based bar chart (in vs out). Reads
// GET /api/energy-balance/week via useEnergyWeek(); degrades to an empty state
// with no backend. No new deps — bars are plain Views, same as MuscleChart.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { accent, color, radius, space } from '@/lib/design/tokens';
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

function Bar({ value, max, tint }: { value: number; max: number; tint: string }): JSX.Element {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={{ height: 7, borderRadius: radius.pill, backgroundColor: color.gray200, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: radius.pill, backgroundColor: tint }} />
    </View>
  );
}

function DayRow({ d, max }: { d: EnergyBalance; max: number }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Text variant="caption" color={color.secondaryLabel} style={{ width: 34 }}>
        {weekdayLabel(d.date)}
      </Text>
      <View style={{ flex: 1, gap: space.xs }}>
        <Bar value={d.calories_in} max={max} tint={accent.orange} />
        <Bar value={outValue(d)} max={max} tint={accent.green} />
      </View>
      <Text variant="caption" color={color.label} style={{ width: 54, textAlign: 'right' }}>
        {d.net_balance != null ? `${d.net_balance > 0 ? '+' : ''}${round(d.net_balance)}` : '—'}
      </Text>
    </View>
  );
}

export default function EnergyScreen(): JSX.Element {
  const { week, loading } = useEnergyWeek();

  return (
    <Screen grouped title="Energy balance" showBack>
      <Text variant="title2" color={color.label}>
        Last 7 days
      </Text>

      {loading ? (
        <>
          <Skeleton height={110} rounded={20} />
          <Skeleton height={220} rounded={20} />
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
      <Card>
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
      </Card>

      {/* Per-day chart */}
      <Card>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent.orange }} />
              <Text variant="caption" color={color.secondaryLabel}>
                In
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent.green }} />
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
