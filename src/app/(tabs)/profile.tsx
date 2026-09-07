// E1 · Profile main
// Streak-only (no XP, no ranks, no points). Avatar + name, the streak as the
// centrepiece (current streak with flame, longest, total gym days), then the
// settings list.
//
// Design-file pass: a tab screen cannot use the `Screen` scaffold (it rolls its
// own SafeAreaView so the native tab bar keeps its clearance), so it composes
// the same floating treatment by hand — grey page, blurred header strip, and the
// eyebrow + large title inside the scroll. The user's name IS the eyebrow, which
// is why the identity block below carries the avatar alone.
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { Text } from '@/components/primitives/Text';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { categoryAccent, color, space, surface } from '@/lib/design/tokens';
import { useUserProfile, useGym } from '@/lib/data';

export default function ProfileScreen() {
  const profile = useUserProfile();
  const insets = useSafeAreaInsets();
  const {
    data: { streak },
  } = useGym();
  return (
    <View style={{ flex: 1, backgroundColor: surface.backgroundAlt }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.lg,
          gap: space.md,
          paddingBottom: space['4xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block — the name only appears here; the avatar below carries no
            second copy of it. */}
        <View style={{ gap: space.xs, paddingBottom: space.xs }}>
          {profile.name ? (
            <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {profile.name}
            </Text>
          ) : null}
          <Text variant="title1" color={color.label} accessibilityRole="header">
            Profile
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingBottom: space.sm }}>
          <Avatar name={profile.name} size={84} />
        </View>

        {/* Streak centrepiece */}
        <Card variant="elevated">
          <View style={{ gap: space.lg }}>
            <CardHeaderRow title="Streak" icon="flame" tint={categoryAccent.streak} />
            <StreakCounter days={streak.current} />
          </View>
        </Card>

        {/* Streak stats */}
        <Card variant="elevated">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={streak.longest} label="Longest" size="medium" align="center" />
            <Stat value={streak.totalGymDays} label="Total days" size="medium" align="center" />
            <Stat value={streak.freezesAvailable} label="Freezes" size="medium" align="center" />
          </View>
        </Card>

        <SettingsList
          rows={[
            { icon: 'sparkles-outline', label: 'AI insights', onPress: () => router.push('/insights' as Href) },
            { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/profile/settings') },
            { icon: 'card-outline', label: 'Subscription', onPress: () => router.push('/profile/subscription') },
          ]}
        />
      </ScrollView>
      <FloatingHeader height={insets.top + space.xl} />
    </View>
  );
}
