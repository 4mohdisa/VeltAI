// E1 · Profile main
// Streak-only (no XP, no ranks, no points). Avatar + name, the streak as the
// centrepiece (current streak with flame, longest, total gym days), then the
// settings list.
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { Text } from '@/components/primitives/Text';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { color, space, surface } from '@/lib/design/tokens';
import { useUserProfile, useGym } from '@/lib/data';

export default function ProfileScreen() {
  const profile = useUserProfile();
  const {
    data: { streak },
  } = useGym();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.backgroundAlt }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}>
        {/* Identity */}
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={profile.name} size={84} />
          <Text variant="title2" color={color.black}>
            {profile.name}
          </Text>
        </View>

        {/* Streak centrepiece */}
        <Card>
          <StreakCounter days={streak.current} />
        </Card>

        {/* Streak stats */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={streak.longest} label="Longest" size="medium" align="center" />
            <Stat value={streak.totalGymDays} label="Total days" size="medium" align="center" />
            <Stat value={streak.freezesAvailable} label="Freezes" size="medium" align="center" />
          </View>
        </Card>

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
