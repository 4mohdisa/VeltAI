// Muscle focus (full screen) — the design's §3.9 view, pushed from the Gym
// tab's muscle-focus card. One sorted list of every muscle group with the
// training volume behind it, plus the total.
//
// What the design has and this does not, for cause:
//  - The 3D body stage and its front/back segmented control. That needs
//    three.js and per-mesh data (DECISIONS.md, NEEDS ARCHITECTURE DECISION 7),
//    so there is no front/back split here — all groups sit in one list.
//  - Per-muscle exercise lists and set counts, and the tap-to-select popover
//    that shows them. `muscle_volume_map` carries volume per group only; the
//    exercises behind it are not in any response this app can call, so the
//    rows are volume-only rather than invented.
//  - The design labels its window "Last 7 days". Ours is the server's own
//    30-day patterns window (backend rebuild: `gs.date >= current_date -
//    interval '30 days'`), and it is labelled as that.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Card, CardHeaderRow, EmptyState, Skeleton } from '@/components/display';
import { MUSCLE_GROUPS, MuscleVolumeRow, formatVolume, muscleLabel } from '@/components/gym/MuscleChart';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';

export default function MuscleFocusScreen(): JSX.Element {
  const { patterns, loading } = useGymPatterns();
  const map = patterns?.muscle_volume_map ?? null;

  // The known groups plus anything else the server actually sent (the library
  // also carries `cardio` and `full_body`), so nothing real is hidden.
  const groups = map ? Array.from(new Set([...MUSCLE_GROUPS, ...Object.keys(map)])) : MUSCLE_GROUPS;
  const volumeOf = (g: string) => map?.[g] ?? 0;
  const total = groups.reduce((sum, g) => sum + volumeOf(g), 0);
  const max = Math.max(0, ...groups.map(volumeOf));
  const hasData = max > 0;
  // Strongest focus first; name order breaks ties so the list never reshuffles.
  const ordered = [...groups].sort((a, b) => volumeOf(b) - volumeOf(a) || a.localeCompare(b));
  const strongest = ordered[0];

  const body = (() => {
    if (loading) {
      return (
        <View style={{ gap: space.md }}>
          <Skeleton width="100%" height={96} rounded={radius.xl} />
          <Skeleton width="100%" height={240} rounded={radius.xl} />
        </View>
      );
    }

    if (!hasData) {
      return (
        <EmptyState
          icon="barbell"
          title="No muscle data yet"
          message="Log a session with its exercises and this fills in with the groups you trained."
        />
      );
    }

    return (
      <View style={{ gap: space.md }}>
        <Card variant="elevated">
          <CardHeaderRow title="Total volume" icon="barbell" tint={categoryAccent.streak} scope="Last 30 days" />
          <Text variant="statMedium" color={color.label} style={{ marginTop: space.sm }}>
            {formatVolume(total)}
          </Text>
          <Text variant="footnote" color={color.secondaryLabel} style={{ marginTop: space.xs }}>
            {`Strongest focus: ${muscleLabel(strongest)}`}
          </Text>
        </Card>

        <Card variant="elevated">
          <View style={{ gap: space.sm }}>
            <CardHeaderRow title="All muscle groups" scope="Volume" />
            {ordered.map((muscle) => (
              <MuscleVolumeRow key={muscle} muscle={muscle} volume={volumeOf(muscle)} max={max} showValue />
            ))}
          </View>
        </Card>

        {/* The design's hint promises drag-to-spin and tap-to-zoom on a 3D body.
            There is no body and nothing here spins, so this says what the
            numbers actually are instead. */}
        <Text variant="caption" color={color.tertiaryLabel}>
          Volume is sets × reps × weight, summed across every session you logged in the last 30 days. An exercise
          logged without a weight counts its sets × reps.
        </Text>
      </View>
    );
  })();

  return (
    <Screen variant="floating" showBack eyebrow="Last 30 days" title="Muscle focus">
      {body}
    </Screen>
  );
}
