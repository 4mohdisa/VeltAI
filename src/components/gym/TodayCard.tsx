// TodayCard — today's scheduled workout at a glance. Self-contained via
// useToday(); renders nothing when there's no schedule data, and otherwise shows
// a rest day, a completed state, or the planned template with a Start action.
import type { JSX } from 'react';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card, Skeleton } from '@/components/display';
import { Button } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useToday } from '@/lib/data/gymSchedule';
import { color, space } from '@/lib/design/tokens';

export function TodayCard(): JSX.Element | null {
  const { today, loading } = useToday();

  if (loading) {
    return (
      <Card>
        <View style={{ gap: space.sm }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="80%" height={14} />
        </View>
      </Card>
    );
  }

  // No backend / not scheduled → render nothing (the gym tab shows other content).
  if (!today) return null;

  if (today.is_rest_day) {
    return (
      <Card>
        <Text variant="title3" color={color.label}>
          Rest Day 😴
        </Text>
      </Card>
    );
  }

  if (today.already_checked_in) {
    return (
      <Card>
        <Text variant="title3" color={color.label}>
          ✓ Completed today
        </Text>
      </Card>
    );
  }

  if (today.template) {
    const names: string[] = [];
    for (const ex of today.exercises) {
      const n = ex.exercise?.name;
      if (n) names.push(n);
    }
    const shown = names.slice(0, 3);
    const more = names.length - shown.length;
    const duration = today.template.estimated_duration_minutes;

    return (
      <Card>
        <View style={{ gap: space.md }}>
          <Text variant="title3" color={color.label}>
            {today.template.name}
          </Text>

          {shown.length > 0 ? (
            <View style={{ gap: space.xs }}>
              {shown.map((n, i) => (
                <Text key={i} variant="callout" color={color.secondaryLabel} numberOfLines={1}>
                  {n}
                </Text>
              ))}
              {more > 0 ? (
                <Text variant="footnote" color={color.tertiaryLabel}>
                  +{more} more
                </Text>
              ) : null}
            </View>
          ) : null}

          {duration != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              ~{duration} min
            </Text>
          ) : null}

          <Button title="Start Workout →" onPress={() => router.push('/gym/session' as Href)} />
        </View>
      </Card>
    );
  }

  // Today exists but has no template and isn't a rest day → nothing scheduled.
  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Text variant="title3" color={color.label}>
          No workout scheduled
        </Text>
        <Pressable
          onPress={() => router.push('/gym/schedule' as Href)}
          haptic={false}
          minTapTarget={false}
          hitSlop={8}
          accessibilityLabel="Set schedule"
          style={{ alignSelf: 'flex-start' }}
        >
          <Text variant="label" color={color.primary}>
            Set schedule →
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
