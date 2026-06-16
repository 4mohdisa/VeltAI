// B1 · Dashboard (home)
// Three-zone vertical layout:
//   1. Top: streak + flame, today's XP, rank badge.
//   2. Middle: gym status hero, then calorie ring + macro bars.
//   3. Bottom: today's AI plan summary + lockout status banner.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakFlame } from '@/components/animations/StreakFlame';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { LockoutBanner } from '@/components/domain/LockoutBanner';
import { AiNudgeBanner } from '@/components/domain/AiNudgeBanner';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { mockMacros, mockPlan, mockStreak, mockUser, mockLockout } from '@/lib/mock/data';

export default function DashboardScreen() {
  const [gymLogged, setGymLogged] = useState(mockStreak.gymLoggedToday);
  const [showNudge, setShowNudge] = useState(true);
  const nextMeal = mockPlan.find((p) => p.kind === 'meal');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}>
        {/* F4 · AI nudge banner (dismissable) */}
        {showNudge && !gymLogged ? (
          <AiNudgeBanner
            message="It's nearly your gym window. Log today's session before lockout starts at 18:00."
            onPress={() => router.push('/dashboard/plan')}
            onDismiss={() => setShowNudge(false)}
          />
        ) : null}

        {/* Zone 1 — streak (the only progression mechanic) */}
        <View style={{ gap: space.xs }}>
          <Text variant="footnote" color={color.gray500}>
            Welcome back, {mockUser.name.split(' ')[0]}
          </Text>
          <Pressable
            onPress={() => router.push('/gym/streak')}
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`Current streak ${mockStreak.current} days`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
          >
            <StreakFlame size={30} active={mockStreak.current > 0} />
            <Text variant="statLarge" color={color.black}>
              {mockStreak.current}
            </Text>
            <Text variant="callout" color={color.gray500}>
              day streak
            </Text>
          </Pressable>
        </View>

        {/* Zone 2 — gym status + nutrition */}
        <GymStatusCard
          logged={gymLogged}
          durationMin={62}
          onLog={() => {
            setGymLogged(true);
            showToast({ message: 'Gym logged. Lockout lifted.', tone: 'success' });
          }}
        />

        <Card onPress={() => router.push('/dashboard/nutrition')} accessibilityLabel="Today's nutrition detail">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <DailyMacroRing consumed={mockMacros.calories.consumed} target={mockMacros.calories.target} size={132} />
            <View style={{ flex: 1 }}>
              <MacroBars
                rows={[
                  { label: 'Protein', data: mockMacros.protein },
                  { label: 'Carbs', data: mockMacros.carbs },
                  { label: 'Fat', data: mockMacros.fat },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Zone 3 — AI plan + lockout */}
        <Card onPress={() => router.push('/dashboard/plan')} accessibilityLabel="Today's plan detail">
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="title3" color={color.black}>
                Today&apos;s plan
              </Text>
              <Badge label="AI" icon="sparkles" iconColor={categoryAccent.ai} />
            </View>
            {nextMeal ? (
              <Text variant="callout" color={color.gray700}>
                Next: {nextMeal.title} at {nextMeal.time} · {nextMeal.targetKcal} kcal
              </Text>
            ) : null}
            <Text variant="footnote" color={color.gray500}>
              Gym window 18:00 · Bedtime 22:30
            </Text>
          </View>
        </Card>

        <LockoutBanner
          enabled={mockLockout.enabled}
          gymLogged={gymLogged}
          appCount={mockLockout.apps.length}
          windowLabel={mockLockout.windowLabel}
          onPress={() => router.push('/dashboard/lockout')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
