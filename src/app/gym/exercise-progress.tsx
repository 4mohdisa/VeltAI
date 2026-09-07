// Per-exercise progress screen. Reads the `name` route param, pulls its logged
// history (useExerciseProgress), and shows a personal best, a trend badge, a
// view-based weight bar chart, and the full history. Degrades to an empty state
// when there aren't enough logs (or the hook returns null offline).
import type { JSX } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Badge, Card, CardHeaderRow, EmptyState, Skeleton } from '@/components/display';
import { Screen } from '@/components/navigation/Screen';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useExerciseProgress } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// Plain words, no emoji — the design's badges are monochrome type.
const TREND_LABEL: Record<string, string> = {
  improving: 'Improving',
  maintaining: 'Maintaining',
  declining: 'Declining',
};

const CHART_HEIGHT = 132;

export default function ExerciseProgressScreen(): JSX.Element {
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? '';
  const title = name || 'Exercise';
  const { progress, loading } = useExerciseProgress(name);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const body = (() => {
    if (loading) {
      return (
        <View style={{ gap: space.lg }}>
          <Skeleton width="100%" height={96} rounded={radius.lg} />
          <Skeleton width="100%" height={180} rounded={radius.lg} />
        </View>
      );
    }

    if (!progress || progress.trend === 'insufficient_data' || progress.history.length < 3) {
      return (
        <EmptyState
          icon="stats-chart"
          title="Not enough data yet"
          message="Log this exercise 3+ times to see progress"
        />
      );
    }

    const chartData = progress.history.slice(-10); // history is date ASC; chart stays chronological
    const maxWeight = chartData.reduce((m, e) => Math.max(m, e.weight ?? 0), 0) || 1;
    const recent = [...progress.history].reverse(); // list shows most-recent first

    return (
      <View style={{ gap: space.md }}>
        <Card variant="elevated">
          <CardHeaderRow title="Personal best" icon="trophy" tint={categoryAccent.streak} />
          <Text variant="statMedium" color={color.label} style={{ marginTop: space.sm }}>
            {progress.personal_best
              ? `${progress.personal_best.weight}kg × ${progress.personal_best.reps ?? '?'} reps`
              : '—'}
          </Text>
        </Card>

        <Badge label={TREND_LABEL[progress.trend] ?? 'Not enough data'} />

        <Card variant="elevated">
          <CardHeaderRow title="Weight over time" scope="Last 10 sessions" />
          {/* Reserve a fixed row for the tap tooltip so the chart never jumps. */}
          <Text variant="caption" color={color.secondaryLabel} style={{ minHeight: 16, textAlign: 'center' }}>
            {selectedBar != null && chartData[selectedBar]
              ? `${chartData[selectedBar].weight ?? '-'} kg`
              : ' '}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: space.xs,
              height: CHART_HEIGHT,
            }}
          >
            {chartData.map((e, i) => {
              const isLast = i === chartData.length - 1;
              const barHeight = e.weight != null ? Math.max(6, (e.weight / maxWeight) * CHART_HEIGHT) : 3;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedBar((sb) => (sb === i ? null : i))}
                  haptic={false}
                  minTapTarget={false}
                  hitSlop={{ left: 2, right: 2, top: 8, bottom: 8 }}
                  accessibilityLabel={`${shortDate(e.date)}, ${e.weight ?? 'no'} kilograms`}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT }}
                >
                  <View
                    style={{
                      width: '100%',
                      maxWidth: 24,
                      height: barHeight,
                      borderRadius: radius.sm,
                      backgroundColor: isLast ? color.primary : color.light2,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.xs, marginTop: space.sm }}>
            {chartData.map((e, i) => (
              <Text
                key={i}
                variant="caption"
                color={color.secondaryLabel}
                numberOfLines={1}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {/* Ten labels truncate — label every other bar, anchored to the newest. */}
                {(chartData.length - 1 - i) % 2 === 0 ? shortDate(e.date) : ''}
              </Text>
            ))}
          </View>
        </Card>

        <Card variant="elevated">
          <CardHeaderRow title="History" />
          <View style={{ gap: space.sm, marginTop: space.md }}>
            {recent.map((e, i) => {
              const vol =
                e.sets != null && e.reps != null && e.weight != null ? e.sets * e.reps * e.weight : null;
              return (
                <View
                  key={i}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}
                >
                  <Text variant="callout" color={color.label}>
                    {shortDate(e.date)}
                  </Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyMedium" color={color.label}>
                      {`${e.sets ?? '?'} × ${e.reps ?? '?'} @ ${e.weight ?? '-'}kg`}
                    </Text>
                    {vol != null ? (
                      <Text variant="caption" color={color.secondaryLabel}>
                        {`Vol ${vol}`}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </View>
    );
  })();

  return (
    <Screen variant="floating" eyebrow="Exercise" title={title} showBack>
      {body}
    </Screen>
  );
}
