// MuscleChart — the design file's muscle-focus card, as bars: one full-width row
// per muscle (name, then a track filled in the streak accent), ordered by volume
// so the strongest focus reads first. View-based bars, not SVG: the data is a
// simple per-muscle volume, so a filled bar on a light track needs no drawing
// primitives. Self-contained via useGymPatterns(); degrades to a muted prompt
// when there's not enough data. The header pushes the full muscle-focus screen.
//
// The design's 3D body is not built — it needs three.js and per-mesh data we do
// not have (DECISIONS.md, NEEDS ARCHITECTURE DECISION 7).
import type { JSX } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Card, CardHeaderRow, Skeleton } from '@/components/display';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';

/** Every group the map can carry, so an untrained muscle still shows as a gap.
 *  These are `exercise_library.muscle_group_primary` values — the keys the
 *  server's muscle_volume_map is built from. */
export const MUSCLE_GROUPS = [
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
const VALUE_WIDTH = 74;
const BAR_HEIGHT = 8;

/** 'full_body' → 'Full body'. */
export function muscleLabel(muscle: string): string {
  const words = muscle.replace(/_/g, ' ');
  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : words;
}

/** Volume is sets x reps x weight, so it runs into the thousands. Unit-free on
 *  purpose: an exercise logged without a weight contributes sets x reps. */
export function formatVolume(volume: number): string {
  if (volume <= 0) return '—';
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume));
}

/** One muscle row: name, a track filled to its share of the busiest group, and
 *  (on the full screen) the volume itself. Shared by the card and /gym/muscles
 *  so both read as one chart. */
export function MuscleVolumeRow({
  muscle,
  volume,
  max,
  showValue = false,
}: {
  muscle: string;
  volume: number;
  max: number;
  showValue?: boolean;
}): JSX.Element {
  const pct = max > 0 ? Math.round((volume / max) * 100) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: space['2xl'] }}>
      <Text
        variant="footnote"
        color={volume > 0 ? color.label : color.tertiaryLabel}
        numberOfLines={1}
        style={{ width: NAME_WIDTH }}
      >
        {muscleLabel(muscle)}
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
      {showValue ? (
        <Text
          variant="footnote"
          color={volume > 0 ? color.label : color.tertiaryLabel}
          numberOfLines={1}
          style={{ width: VALUE_WIDTH, textAlign: 'right' }}
        >
          {formatVolume(volume)}
        </Text>
      ) : null}
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
  const ordered = hasData ? [...MUSCLE_GROUPS].sort((a, b) => (map[b] ?? 0) - (map[a] ?? 0)) : MUSCLE_GROUPS;

  const header = (
    <CardHeaderRow
      title="Muscle focus"
      icon="barbell"
      tint={categoryAccent.streak}
      scope="Last 30 days"
      chevron={hasData}
    />
  );

  return (
    <Card variant="elevated">
      <View style={{ gap: space.md }}>
        {/* Only the header is the control (the design's §2.6 header button), so
            VoiceOver still reads each muscle row on the card itself. */}
        {hasData ? (
          <Pressable
            onPress={() => router.push('/gym/muscles')}
            haptic={false}
            accessibilityLabel="Muscle focus, last 30 days. Opens every muscle group"
          >
            {header}
          </Pressable>
        ) : (
          header
        )}

        {!hasData ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            Log workouts to see which muscles you hit
          </Text>
        ) : (
          <View style={{ gap: space.sm }}>
            {ordered.map((muscle) => (
              <MuscleVolumeRow key={muscle} muscle={muscle} volume={map[muscle] ?? 0} max={max} />
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}
