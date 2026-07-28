// D6 · Gym session history
// Reverse-chronological list of past sessions: date, duration, effort, notes.
// No XP, no verification, no photo — gym logging is a single tap.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { useGym } from '@/lib/data';

export default function GymHistoryScreen() {
  const {
    data: { sessions },
    isLoading: loading,
  } = useGym();

  return (
    <Screen grouped title="Session history" showBack backLabel="Gym">
      {loading ? (
        <SkeletonList rows={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No sessions yet"
          message="Log a gym session to start building your history and streak."
        />
      ) : (
        <Card padded={false}>
          {sessions.map((session, i) => (
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
