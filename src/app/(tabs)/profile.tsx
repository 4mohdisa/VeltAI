// E1 · Profile main
// Avatar, name, current rank badge with a progress bar to the next rank, total
// XP and streak, recent XP events, then the settings list entry point.
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';

import { Avatar } from '@/components/display/Avatar';
import { Badge } from '@/components/display/Badge';
import { Card } from '@/components/display/Card';
import { ProgressBar } from '@/components/display/ProgressBar';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';
import { mockRank, mockStreak, mockUser, mockXpEvents } from '@/lib/mock/data';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space['3xl'] }}>
        {/* Identity */}
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={mockUser.name} size={84} />
          <Text variant="title2" color={color.black}>
            {mockUser.name}
          </Text>
          <Badge label={mockRank.current.name} tone="accent" icon="shield" />
        </View>

        {/* Rank progress */}
        <Card>
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="footnote" color={color.gray700}>
                {formatNumber(mockUser.totalXp)} XP
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {mockRank.next ? `${formatNumber(mockRank.xpForNext ?? 0)} to ${mockRank.next.name}` : 'Max rank'}
              </Text>
            </View>
            <ProgressBar value={mockRank.progress} />
          </View>
        </Card>

        {/* Stats */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={mockStreak.current} label="Day streak" size="medium" align="center" valueColor={color.accent} />
            <Stat value={formatNumber(mockUser.totalXp)} label="Total XP" size="medium" align="center" />
            <Stat value={mockStreak.totalSessions} label="Sessions" size="medium" align="center" />
          </View>
        </Card>

        {/* Recent XP */}
        <View>
          <Text
            variant="footnote"
            color={color.gray500}
            style={{ marginBottom: space.sm, marginLeft: space.xs, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Recent XP
          </Text>
          <Card padded={false}>
            {mockXpEvents.map((event, i) => (
              <View
                key={event.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: space.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: color.gray100,
                }}
              >
                <View style={{ gap: space.xs }}>
                  <Text variant="body" color={color.black}>
                    {event.label}
                  </Text>
                  <Text variant="footnote" color={color.gray500}>
                    {event.when}
                  </Text>
                </View>
                <Text variant="bodyBold" color={color.accent}>
                  +{event.amount}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <SettingsList
          rows={[
            { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/profile/settings') },
            { icon: 'card-outline', label: 'Subscription', onPress: () => router.push('/profile/subscription') },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
