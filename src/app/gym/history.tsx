// D6 · Gym session history
// Reverse-chronological list of past sessions: date, duration, effort, notes.
// No XP, no verification, no photo — gym logging is a single tap.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { mockGymSessions } from '@/lib/mock/data';

export default function GymHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  return (
    <Screen grouped title="Session history" showBack backLabel="Gym" refreshing={refreshing} onRefresh={onRefresh}>
      {loading ? (
        <SkeletonList rows={4} />
      ) : mockGymSessions.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No sessions yet"
          message="Log a gym session to start building your history and streak."
        />
      ) : (
        <Card padded={false}>
          {mockGymSessions.map((session, i) => (
          <View
            key={session.id}
            style={{
              gap: space.xs,
              padding: space.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: color.gray100,
            }}
          >
            <Text variant="bodyBold" color={color.black}>
              {session.date}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="time-outline" size={14} color={color.gray500} />
              <Text variant="footnote" color={color.gray500}>
                {formatDuration(session.durationMin)} · effort {session.effort}/10
              </Text>
            </View>
            {session.notes ? (
              <Text variant="footnote" color={color.gray700}>
                {session.notes}
              </Text>
            ) : null}
          </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
