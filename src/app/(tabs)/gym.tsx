// D1 · Gym log (default)
// Streak counter + flame at top, the 30-day calendar grid, and today's status —
// a big "Log gym session" button if not logged, or a logged confirmation.
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Card } from '@/components/display/Card';
import { Stat } from '@/components/display/Stat';
import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { GymSessionButton } from '@/components/domain/GymSessionButton';
import { GymCalendar } from '@/components/domain/GymCalendar';
import { ChartCard } from '@/components/domain/ChartCard';
import { TodayCard, MuscleChart, GymPatternsCard } from '@/components/gym';
import { color, space } from '@/lib/design/tokens';
import { useGym } from '@/lib/data';

export default function GymLogScreen() {
  const {
    data: { streak, calendar },
    refetch,
  } = useGym();
  // Native pull-to-refresh: re-run the gym hydration; spinner clears on a short
  // trailing delay since refetch is fire-and-forget by design.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch]);
  // Computed takeaway for the calendar chart (insight, not just the grid).
  const sessions = calendar.filter((d) => d.status === 'session').length;
  const freezes = calendar.filter((d) => d.status === 'freeze').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        {/* Large title (HIG §4.2) — left-aligned, scrolls away on the list root */}
        <Text variant="title1" color={color.label}>
          Gym
        </Text>

        {/* Today's scheduled workout (renders null when nothing is scheduled). */}
        <TodayCard />

        <Pressable
          haptic={false}
          minTapTarget={false}
          onPress={() => router.push('/gym/streak')}
          accessibilityLabel="Streak detail"
        >
          <StreakCounter days={streak.current} />
        </Pressable>

        <ChartCard
          title="Last 30 days"
          takeaway={`${streak.current}-day streak · ${sessions} sessions, ${freezes} freeze${freezes === 1 ? '' : 's'}`}
          summary={`Last 30 days. ${streak.current} day streak, ${sessions} sessions and ${freezes} freezes. Each day is marked by shape: filled check for a session, snowflake for a freeze, outline for missed.`}
        >
          <GymCalendar days={calendar} />
        </ChartCard>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={streak.longest} label="Longest" size="small" align="center" />
            <Stat value={streak.totalGymDays} label="Total" size="small" align="center" />
            <Stat value={streak.freezesAvailable} label="Freezes" size="small" align="center" />
          </View>
        </Card>

        {/* Learned gym habits + muscle activity (both degrade to muted text with no data). */}
        <GymPatternsCard />
        <MuscleChart />

        <View style={{ gap: space.sm }}>
          <GymSessionButton logged={streak.gymLoggedToday} onPress={() => router.push('/gym/log-session')} />
          <Button
            title="My schedule"
            variant="tertiary"
            icon="calendar"
            onPress={() => router.push('/gym/schedule' as Href)}
          />
          <Button
            title="My workouts"
            variant="tertiary"
            icon="barbell"
            onPress={() => router.push('/gym/templates' as Href)}
          />
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
