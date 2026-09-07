// MuscleChart — the design file's muscle-focus card, as bars: one full-width row
// per muscle (name, then a track filled in the streak accent), ordered by volume
// so the strongest focus reads first. View-based bars, not SVG: the data is a
// simple per-muscle volume, so a filled bar on a light track needs no drawing
// primitives. Self-contained via useGymPatterns(); degrades to a muted prompt
// when there's not enough data.
//
// The design's 3D body is not built — it needs three.js and per-mesh data we do
// not have (DECISIONS.md, NEEDS ARCHITECTURE DECISION 7).
import type { JSX } from 'react';
import { View } from 'react-native';

import { Card, CardHeaderRow, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';

// Every group the map can carry, so an untrained muscle still shows as a gap.
const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'glutes',
  'quadriceps',
  'hamstrings',
  'calves',
];

/** Name column width — the design aligns every bar on one left edge. */
const NAME_WIDTH = 84;
const BAR_HEIGHT = 8;

const cap = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function MuscleRow({ muscle, volume, max }: { muscle: string; volume: number; max: number }): JSX.Element {
  const pct = max > 0 ? Math.round((volume / max) * 100) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: space['2xl'] }}>
      <Text
        variant="footnote"
        color={volume > 0 ? color.label : color.tertiaryLabel}
        numberOfLines={1}
        style={{ width: NAME_WIDTH }}
      >
        {cap(muscle)}
      </Text>
      {volume > 0 ? (
        <View style={{ flex: 1, height: BAR_HEIGHT, borderRadius: radius.pill, backgroundColor: color.light2 }}>
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: radius.pill,
              backgroundColor: categoryAccent.streak,
            }}
          />
        </View>
      ) : (
        <Text variant="caption" color={color.tertiaryLabel} style={{ flex: 1 }}>
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
      <Card variant="elevated">
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
  const max = hasData ? Math.max(0, ...Object.values(map)) : 0;
  // Strongest focus first, as the design orders its muscle list.
  const ordered = hasData ? [...MUSCLES].sort((a, b) => (map[b] ?? 0) - (map[a] ?? 0)) : MUSCLES;

  return (
    <Card variant="elevated">
      <View style={{ gap: space.md }}>
        <CardHeaderRow title="Muscle focus" icon="barbell" tint={categoryAccent.streak} scope="Last 30 days" />

        {!hasData ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            Log workouts to see which muscles you hit
          </Text>
        ) : (
          <View style={{ gap: space.sm }}>
            {ordered.map((muscle) => (
              <MuscleRow key={muscle} muscle={muscle} volume={map[muscle] ?? 0} max={max} />
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}
