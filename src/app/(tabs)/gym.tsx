// D1 · Gym log (default)
// Design-file pass: a grey page with a floating blurred header — date eyebrow +
// large "Gym" title inside the scroll, then the streak strip, the month
// heatmap, today's session, muscle focus, gym habits, the log CTA and the
// training list. Same data, same routes; only the surfaces changed.
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { StreakFlame } from '@/components/display/StreakFlame';
import { Text } from '@/components/primitives/Text';
import { GymSessionButton } from '@/components/domain/GymSessionButton';
import { GymCalendar } from '@/components/domain/GymCalendar';
import { ChartCard } from '@/components/domain/ChartCard';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { TodayCard, MuscleChart, GymPatternsCard } from '@/components/gym';
import { color, space, surface } from '@/lib/design/tokens';
import { useGym } from '@/lib/data';

export default function GymLogScreen() {
  const {
    data: { streak, calendar },
    refetch,
  } = useGym();
  const insets = useSafeAreaInsets();
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
  // The date eyebrow — today, the day this screen is about. Real clock, no state.
  // Device locale, like food/history — the design's order is en-GB's, but the
  // user's own formatting wins over copying the prototype's string.
  const dateLine = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    // No SafeAreaView top edge: the scroll runs under the status bar so the
    // blurred header strip has something to blur (same recipe as Screen's
    // 'floating' variant, which a tab screen cannot use — it owns no back bar).
    <View style={{ flex: 1, backgroundColor: surface.backgroundAlt }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.lg,
          paddingBottom: space['4xl'],
          gap: space.md,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        {/* Date eyebrow + large title (HIG §4.2) — inside the scroll, so it
            passes under the blur rather than sitting in a bar. */}
        <View style={{ gap: space.xs, paddingBottom: space.xs }}>
          <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {dateLine}
          </Text>
          <Text variant="title1" color={color.label} accessibilityRole="header">
            Gym
          </Text>
        </View>

        {/* Streak strip: flame + count on one line, the streak's own numbers under it. */}
        <Card
          variant="elevated"
          onPress={() => router.push('/gym/streak')}
          accessibilityLabel={`Streak detail. ${streak.current} day streak`}
        >
          <View style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <StreakFlame size={space.xl} active={streak.current > 0} />
              <Text variant="statSmall" color={color.label}>
                {streak.current}
              </Text>
              <Text variant="bodyMedium" color={color.label}>
                day streak
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat value={streak.longest} label="Longest" size="small" align="center" valueColor={color.label} />
              <Stat value={streak.totalGymDays} label="Total" size="small" align="center" valueColor={color.label} />
              <Stat
                value={streak.freezesAvailable}
                label="Freezes"
                size="small"
                align="center"
                valueColor={color.label}
              />
            </View>
          </View>
        </Card>

        {/* Month heatmap — the design's training grid, on our 30-day window. */}
        <ChartCard
          title="Last 30 days"
          takeaway={`${streak.current}-day streak · ${sessions} sessions, ${freezes} freeze${freezes === 1 ? '' : 's'}`}
          summary={`Last 30 days. ${streak.current} day streak, ${sessions} sessions and ${freezes} freezes. Each day is marked by shape: filled check for a session, snowflake for a freeze, outline for missed.`}
        >
          <GymCalendar days={calendar} />
        </ChartCard>

        {/* Today's scheduled workout (renders null when nothing is scheduled). */}
        <TodayCard />

        {/* Learned gym habits + muscle focus (both degrade to muted text with no data). */}
        <MuscleChart />
        <GymPatternsCard />

        <GymSessionButton logged={streak.gymLoggedToday} onPress={() => router.push('/gym/log-session')} />

        <SettingsList
          title="Training"
          rows={[
            { icon: 'calendar', label: 'My schedule', onPress: () => router.push('/gym/schedule' as Href) },
            { icon: 'barbell', label: 'My workouts', onPress: () => router.push('/gym/templates' as Href) },
            { icon: 'snow', label: 'Apply a streak freeze', onPress: () => router.push('/gym/freeze') },
            { icon: 'time', label: 'Session history', onPress: () => router.push('/gym/history') },
          ]}
        />
      </ScrollView>

      <FloatingHeader height={insets.top + space.xl} />
    </View>
  );
}
