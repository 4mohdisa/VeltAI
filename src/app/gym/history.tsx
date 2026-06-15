// D6 · Gym session history
// Reverse-chronological list of past sessions: date, duration, verification
// badge (HealthKit-verified or manual), and notes when present.
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { mockGymSessions } from '@/lib/mock/data';

export default function GymHistoryScreen() {
  return (
    <Screen title="Session history" showBack>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodyBold" color={color.black}>
                {session.date}
              </Text>
              <Badge
                label={session.verified === 'healthkit' ? 'Health verified' : 'Manual'}
                tone={session.verified === 'healthkit' ? 'accent' : 'neutral'}
                icon={session.verified === 'healthkit' ? 'heart' : 'create'}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Ionicons name="time-outline" size={14} color={color.gray500} />
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
    </Screen>
  );
}
