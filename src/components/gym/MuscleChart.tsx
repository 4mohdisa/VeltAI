// MuscleChart — a two-column (front / back) muscle-volume bar chart. View-based
// bars (not SVG): the data is a simple per-muscle volume so a filled black bar on
// a grey track reads clearest and needs no drawing primitives. Self-contained via
// useGymPatterns(); degrades to a muted prompt when there's not enough data.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Card, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { color, radius, space } from '@/lib/design/tokens';

const FRONT = ['chest', 'shoulders', 'biceps', 'core', 'quadriceps', 'calves'];
const BACK = ['back', 'triceps', 'glutes', 'hamstrings'];

const cap = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function MuscleRow({ muscle, volume, max }: { muscle: string; volume: number; max: number }): JSX.Element {
  const pct = max > 0 ? Math.round((volume / max) * 100) : 0;
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="caption" color={color.secondaryLabel} numberOfLines={1}>
        {cap(muscle)}
      </Text>
      {volume > 0 ? (
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: color.gray200, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: radius.pill, backgroundColor: color.black }} />
        </View>
      ) : (
        <Text variant="caption" color={color.secondaryLabel}>
          —
        </Text>
      )}
    </View>
  );
}

export function MuscleChart(): JSX.Element {
  const { patterns, loading } = useGymPatterns();

  if (loading) {
    return (
      <Card>
        <View style={{ gap: space.md }}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="70%" height={12} />
        </View>
      </Card>
    );
  }

  const map = patterns?.muscle_volume_map;
  const hasData = map != null && Object.keys(map).length > 0;

  return (
    <Card>
      <View style={{ gap: space.sm }}>
        <Text variant="title3" color={color.label}>
          Muscle Activity
        </Text>
        <Text variant="caption" color={color.secondaryLabel}>
          Last 30 days
        </Text>
      </View>

      {!hasData ? (
        <Text variant="callout" color={color.secondaryLabel} style={{ marginTop: space.md }}>
          Log workouts to see muscle activity
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.lg }}>
          {[FRONT, BACK].map((column, ci) => {
            const max = Math.max(0, ...Object.values(map));
            return (
              <View key={ci} style={{ flex: 1, gap: space.md }}>
                {column.map((muscle) => (
                  <MuscleRow key={muscle} muscle={muscle} volume={map[muscle] ?? 0} max={max} />
                ))}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
