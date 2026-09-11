// B1 · Dashboard (home) — the design file's "Summary" page.
// A grey page of white elevated cards under a floating blurred header:
//   1. Title block: today's date as an eyebrow, "Summary", then the streak line.
//   2. The design's cards (V16): Energy balance, This week, Workouts, Macros.
//   3. The one-tap gym card (a logged conflict), the AI brief and today's plan.
// The scroll deliberately runs under the status bar (no top safe-area edge) so
// the FloatingHeader has something to blur — same treatment as Screen's
// 'floating' variant, hand-rolled here because this screen owns its own scroll.
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { StreakFlame } from '@/components/display/StreakFlame';
import { MacroTargetRows } from '@/components/domain/MacroBars';
import { WeekEnergyCard } from '@/components/domain/WeekEnergyCard';
import { WorkoutsWeekCard } from '@/components/domain/WorkoutsWeekCard';
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { MorningBriefCard } from '@/components/ai';
import { EnergyBalanceCard } from '@/components/domain/EnergyBalanceCard';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { ProfileAvatarButton } from '@/components/navigation/ProfileAvatarButton';
import { TAB_BAR_CLEARANCE } from '@/components/navigation/LumeTabBar';
import { PendingSyncBanner } from '@/components/display/PendingSyncBanner';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, space, surface } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useDashboard, logGymSession } from '@/lib/data';
import { useGymStore } from '@/lib/data/gymStore';
import { useEnergyWeek } from '@/lib/data/energy';
import { useGymRange } from '@/lib/data/gymRange';
import { todayISO } from '@/lib/data/mappers';
import { todayRow, workoutsWeek } from '@/lib/data/summaryCards';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const energyUnit = useUnitPreferences().energy;
  const {
    data: { streak, macros, plan },
    refetch,
  } = useDashboard();
  const gymLogged = streak.gymLoggedToday;
  // Real logged duration for today (undefined until logged — card renders without it).
  const todayDurationMin = useGymStore((s) => s.sessions.find((x) => x.date === 'Today')?.durationMin);
  const [refreshing, setRefreshing] = useState(false);
  const nextMeal = plan.find((p) => p.kind === 'meal');
  // V16 data: one 7-day energy window feeds Energy balance (today = its last
  // day) and This week; the last 7 days of sessions feed Workouts. A failed read
  // is an error state on the card, never a zero.
  const today = todayISO();
  const { week, loading: weekLoading, refetch: refetchWeek } = useEnergyWeek();
  const weekError = !weekLoading && week == null;
  const gymWeek = useGymRange(7);
  const { refetch: refetchGymWeek } = gymWeek;
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    refetchWeek();
    refetchGymWeek();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch, refetchWeek, refetchGymWeek]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.backgroundAlt }} edges={[]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.lg,
          gap: space.md,
          paddingBottom: TAB_BAR_CLEARANCE(insets),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
      >
        {/* Title block — eyebrow (the real device date), large title, streak line. */}
        <View style={{ gap: space.xs, paddingBottom: space.xs }}>
          <Text
            variant="label"
            color={color.secondaryLabel}
            style={{ textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text variant="title1" color={color.label} accessibilityRole="header">
            Summary
          </Text>
          {/* The streak is the only progression mechanic; the flame is the one
              tinted thing in the header (energy family). */}
          <Pressable
            onPress={() => router.push('/gym/streak')}
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`Current streak ${streak.current} days`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingTop: space.xs }}
          >
            <StreakFlame size={14} active={streak.current > 0} />
            <Text variant="footnote" color={color.secondaryLabel}>
              {streak.current} {t('dashboard.dayStreak')}
            </Text>
          </Pressable>
        </View>

        {/* Offline queue indicator — renders null when nothing is pending. */}
        <PendingSyncBanner />

        {/* V16 — the design's cards in the design's order: Energy balance →
            This week → Workouts → Macros. The design's Steps card sits between
            This week and Workouts; there is no step data anywhere in the app, so
            it is not built rather than filled. Energy balance and This week share
            ONE 7-day energy read (today is its last day). */}
        <EnergyBalanceCard day={todayRow(week?.days, today)} loading={weekLoading} error={weekError} energyUnit={energyUnit} />
        <WeekEnergyCard days={week?.days ?? []} loading={weekLoading} error={weekError} energyUnit={energyUnit} />
        <WorkoutsWeekCard week={workoutsWeek(gymWeek.sessions, today)} loading={gymWeek.loading} error={gymWeek.error} />

        <Card
          variant="elevated"
          onPress={() => router.push('/dashboard/nutrition')}
          accessibilityLabel="Macros today. Double tap for detail."
        >
          <View style={{ gap: space.lg }}>
            <CardHeaderRow title="Macros" icon="circle.grid.2x2.fill" tint={categoryAccent.protein} scope="Today" chevron />
            <MacroTargetRows
              rows={[
                { label: t('nutrition.protein'), macroKey: 'Protein', consumed: macros.protein.consumed, target: macros.protein.target },
                { label: t('nutrition.carbs'), macroKey: 'Carbs', consumed: macros.carbs.consumed, target: macros.carbs.target },
                { label: t('nutrition.fat'), macroKey: 'Fat', consumed: macros.fat.consumed, target: macros.fat.target },
                // Fibre is NOT recorded: the app never sends it when it logs a food
                // and its stored items carry no fibre, so the row says "Not tracked"
                // beside the target instead of a zero the user never ate.
                { label: t('nutrition.fibre'), macroKey: 'Fibre', consumed: null, target: macros.fibre.target },
              ]}
            />
          </View>
        </Card>

        {/* CONFLICT (V16, DECISIONS.md): the design has no gym card on Summary,
            but this card's button is the app's ONLY one-tap session log — the Gym
            tab and the + menu both open the full log sheet. Removing it would
            silently degrade the feature, so it stays, below the design's cards. */}
        <GymStatusCard
          logged={gymLogged}
          durationMin={todayDurationMin}
          onLog={() => {
            logGymSession();
            showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
          }}
        />

        {/* AI morning brief — renders null when there's none. */}
        <MorningBriefCard />

        {/* AI plan. Only rendered once there IS a plan: the card used to show a
            hardcoded gym time and bedtime ('18:00' / '22:30') as if they were
            the user's own schedule, which nothing computes and Lume does not
            track. No plan → no card, rather than a confident fiction. */}
        {plan.length > 0 ? (
          <Card
            variant="elevated"
            onPress={() => router.push('/dashboard/plan')}
            accessibilityLabel="Today's plan detail"
          >
            <View style={{ gap: space.md }}>
              {/* "AI" stays in the scope slot: the sparkles glyph alone is not a
                  disclosure that this content is generated. */}
              <CardHeaderRow
                title={t('dashboard.todaysPlan')}
                icon="sparkles"
                tint={categoryAccent.ai}
                scope="AI"
                chevron
              />
              {nextMeal ? (
                <Text variant="callout" color={color.secondaryLabel}>
                  {t('dashboard.next', {
                    title: nextMeal.title,
                    time: nextMeal.time,
                    energy: formatEnergy(nextMeal.targetKcal ?? 0, energyUnit),
                  })}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}
      </ScrollView>

      {/* Blurred strip the title scrolls under. Absolute sibling, above the
          scroll, pointer-events none. */}
      <FloatingHeader height={insets.top + space.xl} />

      {/* The way into Profile — the same control Food and Gym float (V2). */}
      <ProfileAvatarButton />
    </SafeAreaView>
  );
}
