// D1 · Gym log (default)
// Streak counter + flame at top, a HealthKit auto-detect banner when a workout
// was seen, the 30-day calendar grid, and today's status — a big "Log gym
// session" button if not logged, or a logged confirmation.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Card } from '@/components/display/Card';
import { Stat } from '@/components/display/Stat';
import { Button } from '@/components/forms/Button';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { GymSessionButton } from '@/components/domain/GymSessionButton';
import { GymCalendar } from '@/components/domain/GymCalendar';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { mockDetectedWorkout, mockGymCalendar, mockStreak } from '@/lib/mock/data';
import { formatDuration } from '@/lib/formatting';

export default function GymLogScreen() {
  const [logged, setLogged] = useState(mockStreak.gymLoggedToday);
  const [showDetect, setShowDetect] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}>
        <Pressable
          haptic={false}
          minTapTarget={false}
          onPress={() => router.push('/gym/streak')}
          accessibilityLabel="Streak detail"
        >
          <StreakCounter days={mockStreak.current} />
        </Pressable>

        {/* D3 · HealthKit auto-detect banner */}
        {showDetect && !logged ? (
          <Card style={{ backgroundColor: color.gray100, borderColor: color.gray300 }}>
            <View style={{ gap: space.md }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Icon name="heart" size={18} color={color.black} />
                <Text variant="callout" color={color.black} style={{ flex: 1 }}>
                  We saw a {mockDetectedWorkout.type} for {formatDuration(mockDetectedWorkout.durationMin)} (
                  {mockDetectedWorkout.start}–{mockDetectedWorkout.end}). Log it as today&apos;s session?
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button
                  title="Yes, log it"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => {
                    setLogged(true);
                    setShowDetect(false);
                    showToast({ message: 'Logged from Health.', tone: 'success' });
                  }}
                />
                <Button title="No" variant="secondary" fullWidth={false} onPress={() => setShowDetect(false)} />
              </View>
            </View>
          </Card>
        ) : null}

        <Card>
          <View style={{ gap: space.lg }}>
            <Text variant="title3" color={color.black}>
              Last 30 days
            </Text>
            <GymCalendar days={mockGymCalendar} />
          </View>
        </Card>

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
