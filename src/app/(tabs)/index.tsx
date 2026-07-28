// B1 · Dashboard (home)
// Three-zone vertical layout:
//   1. Top: streak + flame (the only progression mechanic).
//   2. Middle: gym status hero, then calorie ring + macro bars.
//   3. Bottom: today's AI plan summary.
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakFlame } from '@/components/display/StreakFlame';
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { AiNudgeBanner } from '@/components/domain/AiNudgeBanner';
import { MorningBriefCard } from '@/components/ai';
import { EnergyBalanceCard } from '@/components/domain/EnergyBalanceCard';
import { PendingSyncBanner } from '@/components/display/PendingSyncBanner';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useDashboard, logGymSession } from '@/lib/data';
import { useGymStore } from '@/lib/data/gymStore';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const {
    data: { profile, streak, macros, plan },
    refetch,
  } = useDashboard();
  const gymLogged = streak.gymLoggedToday;
  // Real logged duration for today (undefined until logged — card renders without it).
  const todayDurationMin = useGymStore((s) => s.sessions.find((x) => x.date === 'Today')?.durationMin);
  const [showNudge, setShowNudge] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const nextMeal = plan.find((p) => p.kind === 'meal');
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        {/* Offline queue indicator — renders null when nothing is pending. */}
        <PendingSyncBanner />

        {/* AI morning brief — first content item; renders null when there's none. */}
        <MorningBriefCard />

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
            {t('dashboard.welcome', { name: profile.name.split(' ')[0] })}
          </Text>
          <Pressable
            onPress={() => router.push('/gym/streak')}
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`Current streak ${streak.current} days`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
          >
            <StreakFlame size={30} active={streak.current > 0} />
            <Text variant="statLarge" color={color.black}>
              {streak.current}
            </Text>
            <Text variant="callout" color={color.gray500}>
              {t('dashboard.dayStreak')}
            </Text>
          </Pressable>
        </View>

        {/* Zone 2 — gym status + nutrition */}
        <GymStatusCard
          logged={gymLogged}
          durationMin={todayDurationMin}
          onLog={() => {
            logGymSession();
            showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
          }}
        />

        <Card
          onPress={() => router.push('/dashboard/nutrition')}
          accessibilityLabel={`Today's nutrition. ${formatEnergy(macros.calories.consumed, energyUnit)} of ${formatEnergy(macros.calories.target, energyUnit)}. Double tap for detail.`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <DailyMacroRing
              consumed={macros.calories.consumed}
              target={macros.calories.target}
              size={132}
              energyUnit={energyUnit}
            />
            <View style={{ flex: 1 }}>
              <MacroBars
                rows={[
                  { label: t('nutrition.protein'), macroKey: 'Protein', data: macros.protein },
                  { label: t('nutrition.carbs'), macroKey: 'Carbs', data: macros.carbs },
                  { label: t('nutrition.fat'), macroKey: 'Fat', data: macros.fat },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Energy balance — intake vs BMR + exercise (renders null with no data). */}
        <EnergyBalanceCard />

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
