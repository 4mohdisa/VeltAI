// B1 · Dashboard (home)
// Three-zone vertical layout:
//   1. Top: streak + flame (the only progression mechanic).
//   2. Middle: gym status hero, then calorie ring + macro bars.
//   3. Bottom: today's AI plan summary.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakFlame } from '@/components/animations/StreakFlame';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { AiNudgeBanner } from '@/components/domain/AiNudgeBanner';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { mockMacros, mockPlan, mockStreak, mockUser } from '@/lib/mock/data';
import { useEffectiveGoals, useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const goals = useEffectiveGoals();
  const energyUnit = useUnitPreferences().energy;
  const [gymLogged, setGymLogged] = useState(mockStreak.gymLoggedToday);
  const [showNudge, setShowNudge] = useState(true);
  const nextMeal = mockPlan.find((p) => p.kind === 'meal');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}>
        {/* F4 · AI nudge banner (dismissable) */}
        {showNudge && !gymLogged ? (
          <AiNudgeBanner
            message="It's nearly your gym window — log today's session to keep your streak alive."
            onPress={() => router.push('/dashboard/plan')}
            onDismiss={() => setShowNudge(false)}
          />
        ) : null}

        {/* Zone 1 — streak (the only progression mechanic) */}
        <View style={{ gap: space.xs }}>
          <Text variant="footnote" color={color.gray500}>
            {t('dashboard.welcome', { name: mockUser.name.split(' ')[0] })}
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
              {t('dashboard.dayStreak')}
            </Text>
          </Pressable>
        </View>

        {/* Zone 2 — gym status + nutrition */}
        <GymStatusCard
          logged={gymLogged}
          durationMin={62}
          onLog={() => {
            setGymLogged(true);
            showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
          }}
        />

        <Card onPress={() => router.push('/dashboard/nutrition')} accessibilityLabel="Today's nutrition detail">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <DailyMacroRing
              consumed={mockMacros.calories.consumed}
              target={goals.calories}
              size={132}
              energyUnit={energyUnit}
            />
            <View style={{ flex: 1 }}>
              <MacroBars
                rows={[
                  { label: t('nutrition.protein'), macroKey: 'Protein', data: { consumed: mockMacros.protein.consumed, target: goals.protein } },
                  { label: t('nutrition.carbs'), macroKey: 'Carbs', data: { consumed: mockMacros.carbs.consumed, target: goals.carbs } },
                  { label: t('nutrition.fat'), macroKey: 'Fat', data: { consumed: mockMacros.fat.consumed, target: goals.fat } },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Zone 3 — AI plan */}
        <Card onPress={() => router.push('/dashboard/plan')} accessibilityLabel="Today's plan detail">
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="title3" color={color.black}>
                {t('dashboard.todaysPlan')}
              </Text>
              <Badge label="AI" icon="sparkles" iconColor={categoryAccent.ai} />
            </View>
            {nextMeal ? (
              <Text variant="callout" color={color.gray700}>
                {t('dashboard.next', {
                  title: nextMeal.title,
                  time: nextMeal.time,
                  energy: formatEnergy(nextMeal.targetKcal ?? 0, energyUnit),
                })}
              </Text>
            ) : null}
            <Text variant="footnote" color={color.gray500}>
              {t('dashboard.gymBedtime', { gym: '18:00', bed: '22:30' })}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
