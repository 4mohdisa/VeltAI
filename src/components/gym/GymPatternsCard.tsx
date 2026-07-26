// GymPatternsCard — a plain-language summary of the user's gym habits (frequency,
// adherence, most/least-trained muscles, most-missed day). Self-contained via
// useGymPatterns(); shows a muted prompt until there's enough logged data.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Card, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { color, radius, space, surface } from '@/lib/design/tokens';

const cap = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function Pill({ label, filled }: { label: string; filled: boolean }): JSX.Element {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        backgroundColor: filled ? color.black : surface.card,
      }}
    >
      <Text variant="label" color={filled ? color.white : color.secondaryLabel}>
        {cap(label)}
      </Text>
    </View>
  );
}

function PillRow({ title, muscles, filled }: { title: string; muscles: string[]; filled: boolean }): JSX.Element | null {
  if (muscles.length === 0) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="footnote" color={color.secondaryLabel}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {muscles.map((m) => (
          <Pill key={m} label={m} filled={filled} />
        ))}
      </View>
    </View>
  );
}

export function GymPatternsCard(): JSX.Element {
  const { patterns, loading } = useGymPatterns();

  if (loading) {
    return (
      <Card>
        <View style={{ gap: space.md }}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="80%" height={14} />
          <Skeleton width="65%" height={14} />
        </View>
      </Card>
    );
  }

  const notEnough =
    !patterns || (patterns.avg_sessions_per_week === 0 && patterns.most_trained_muscles.length === 0);

  if (notEnough) {
    return (
      <Card>
        <Text variant="callout" color={color.secondaryLabel}>
          Keep logging to see patterns
        </Text>
      </Card>
    );
  }

  const perWeek = Math.round(patterns.avg_sessions_per_week * 10) / 10;
  const adherence = Math.round(patterns.adherence_rate * 100);

  return (
    <Card>
      <View style={{ gap: space.lg }}>
        <Text variant="title3" color={color.label}>
          Your Gym Habits
        </Text>

        <View style={{ gap: space.xs }}>
          <Text variant="body" color={color.label}>
            ~{perWeek} sessions/week
          </Text>
          <Text variant="body" color={color.label}>
            {adherence}% schedule adherence
          </Text>
        </View>

        <PillRow title="Most trained" muscles={patterns.most_trained_muscles.slice(0, 2)} filled />
        <PillRow title="Needs attention" muscles={patterns.least_trained_muscles.slice(0, 2)} filled={false} />

        {patterns.most_missed_day ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            You often skip {patterns.most_missed_day}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
