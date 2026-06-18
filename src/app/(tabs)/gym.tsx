// D1 · Gym log (default)
// Streak counter + flame at top, the 30-day calendar grid, and today's status —
// a big "Log gym session" button if not logged, or a logged confirmation.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Card } from '@/components/display/Card';
import { Stat } from '@/components/display/Stat';
import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { GymSessionButton } from '@/components/domain/GymSessionButton';
import { GymCalendar } from '@/components/domain/GymCalendar';
import { ChartCard } from '@/components/domain/ChartCard';
import { color, space } from '@/lib/design/tokens';
import { mockGymCalendar, mockStreak } from '@/lib/mock/data';

export default function GymLogScreen() {
  const [logged, setLogged] = useState(mockStreak.gymLoggedToday);
  // Computed takeaway for the calendar chart (insight, not just the grid).
  const sessions = mockGymCalendar.filter((d) => d.status === 'session').length;
  const freezes = mockGymCalendar.filter((d) => d.status === 'freeze').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}>
        {/* Large title (HIG §4.2) — left-aligned, scrolls away on the list root */}
        <Text variant="title1" color={color.label}>
          Gym
        </Text>
        <Pressable
          haptic={false}
          minTapTarget={false}
          onPress={() => router.push('/gym/streak')}
          accessibilityLabel="Streak detail"
        >
          <StreakCounter days={mockStreak.current} />
        </Pressable>

        <ChartCard
          title="Last 30 days"
          takeaway={`${mockStreak.current}-day streak · ${sessions} sessions, ${freezes} freeze${freezes === 1 ? '' : 's'}`}
          summary={`Last 30 days. ${mockStreak.current} day streak, ${sessions} sessions and ${freezes} freezes. Each day is marked by shape: filled check for a session, snowflake for a freeze, outline for missed.`}
        >
          <GymCalendar days={mockGymCalendar} />
        </ChartCard>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={mockStreak.longest} label="Longest" size="small" align="center" />
            <Stat value={mockStreak.totalGymDays} label="Total" size="small" align="center" />
            <Stat value={mockStreak.freezesAvailable} label="Freezes" size="small" align="center" />
          </View>
        </Card>

        <View style={{ gap: space.sm }}>
          <GymSessionButton logged={logged} onPress={() => router.push('/gym/log-session')} />
          <Button
            title="Apply a streak freeze"
            variant="tertiary"
            icon="snow"
            onPress={() => router.push('/gym/freeze')}
          />
          <Button
            title="Session history"
            variant="tertiary"
            icon="time"
            onPress={() => router.push('/gym/history')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
