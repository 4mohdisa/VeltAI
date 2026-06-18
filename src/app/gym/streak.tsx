// D4 · Streak detail
// Streak counter up top, the next 7 days with their action (log / freeze /
// scheduled), then longest streak, total sessions and freezes available.
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Stat } from '@/components/display/Stat';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { color, space } from '@/lib/design/tokens';
import { useGym } from '@/lib/data';
import type { UpcomingDay } from '@/lib/mock/data';

const actionMeta: Record<UpcomingDay['action'], { label: string; icon: string }> = {
  log: { label: 'Log session', icon: 'barbell' },
  freeze: { label: 'Freeze', icon: 'snow' },
  scheduled: { label: 'Scheduled', icon: 'calendar' },
};

export default function StreakDetailScreen() {
  const {
    data: { streak, upcoming },
  } = useGym();
  return (
    <Screen title="Streak" showBack>
      <Card>
        <StreakCounter days={streak.current} />
      </Card>

      <View>
        <Text
          variant="footnote"
          color={color.gray500}
          style={{ marginBottom: space.sm, marginLeft: space.xs, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Next 7 days
        </Text>
        <Card padded={false}>
          {upcoming.map((day, i) => {
            const meta = actionMeta[day.action];
            const row = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: space.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: color.gray100,
                }}
              >
                <Text variant="body" color={color.black}>
                  {day.label}
                </Text>
                <Badge label={meta.label} icon={meta.icon} />
              </View>
            );
            return day.action === 'freeze' ? (
              <Pressable key={day.label} haptic={false} minTapTarget={false} onPress={() => router.push('/gym/freeze')} accessibilityLabel={`Apply freeze for ${day.label}`}>
                {row}
              </Pressable>
            ) : (
              <View key={day.label}>{row}</View>
            );
          })}
        </Card>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stat value={streak.longest} label="Longest" size="small" align="center" />
          <Stat value={streak.totalGymDays} label="Sessions" size="small" align="center" />
          <Stat value={streak.freezesAvailable} label="Freezes" size="small" align="center" />
        </View>
      </Card>
    </Screen>
  );
}
