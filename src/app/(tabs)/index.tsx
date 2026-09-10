// B1 · Dashboard (home) — the design file's "Summary" page.
// A grey page of white elevated cards under a floating blurred header:
//   1. Title block: today's date as an eyebrow, "Summary", then the streak line.
//   2. Gym status hero, then calorie ring + macro bars, then energy balance.
//   3. Today's AI plan summary.
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
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import { MacroBars } from '@/components/domain/MacroBars';
import { GymStatusCard } from '@/components/domain/GymStatusCard';
import { MorningBriefCard } from '@/components/ai';
import { EnergyBalanceCard } from '@/components/domain/EnergyBalanceCard';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { GlassSurface } from '@/components/navigation/GlassButtons';
import { TAB_BAR_CLEARANCE } from '@/components/navigation/LumeTabBar';
import { Avatar } from '@/components/display/Avatar';
import { Icon } from '@/components/primitives/Icon';
import { PendingSyncBanner } from '@/components/display/PendingSyncBanner';
import { showToast } from '@/components/display/toastStore';
import { accent, categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useDashboard, logGymSession } from '@/lib/data';
import { useGymStore } from '@/lib/data/gymStore';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const energyUnit = useUnitPreferences().energy;
  const {
    data: { profile, streak, macros, plan },
    refetch,
  } = useDashboard();
  const gymLogged = streak.gymLoggedToday;
  // Real logged duration for today (undefined until logged — card renders without it).
  const todayDurationMin = useGymStore((s) => s.sessions.find((x) => x.date === 'Today')?.durationMin);
  const [refreshing, setRefreshing] = useState(false);
  const nextMeal = plan.find((p) => p.kind === 'meal');
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch]);

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

        {/* AI morning brief — renders null when there's none. */}
        <MorningBriefCard />

        {/* The AI nudge banner was REMOVED here (audit 2026-08-06): it rendered
            a hardcoded "It's nearly your gym window" claim in every build —
            the app computes no gym window, so it was a fabricated first-person
            statement about the user's own routine (the same defect class as
            the five prior fabricated-data rounds). Bring it back only driven
            by real schedule data. */}
        <GymStatusCard
          logged={gymLogged}
          durationMin={todayDurationMin}
          onLog={() => {
            logGymSession();
            showToast({ message: 'Gym logged — streak extended.', tone: 'success' });
          }}
        />

        <Card
          variant="elevated"
          onPress={() => router.push('/dashboard/nutrition')}
          accessibilityLabel={`Today's nutrition. ${formatEnergy(macros.calories.consumed, energyUnit)} of ${formatEnergy(macros.calories.target, energyUnit)}. Double tap for detail.`}
        >
          <View style={{ gap: space.lg }}>
            <CardHeaderRow
              title={t('nutrition.title')}
              icon="chart.bar.fill"
              tint={categoryAccent.calories}
              chevron
            />
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
          </View>
        </Card>

        {/* Energy balance — intake vs BMR + exercise (renders null with no data).
            It pushes /energy itself. */}
        <EnergyBalanceCard />

        {/* The design's other two Summary tiles reach their detail views from
            here. Neither carries a figure: every number these details show is
            fetched by the detail itself, and putting a second copy on Home would
            mean either another round trip or a stale one. */}
        <Card
          variant="elevated"
          onPress={() => router.push('/dashboard/week')}
          accessibilityLabel="This week. Intake, burn and daily net across the last 14 days. Double tap for detail."
        >
          <View style={{ gap: space.sm }}>
            <CardHeaderRow title="This week" icon="chart.bar.fill" tint={accent.blue} chevron />
            <Text variant="footnote" color={color.secondaryLabel}>
              Intake, burn and daily net across the last 14 days.
            </Text>
          </View>
        </Card>

        <Card
          variant="elevated"
          onPress={() => router.push('/dashboard/training')}
          accessibilityLabel="Workouts. Sessions and minutes across the last 14 days. Double tap for detail."
        >
          <View style={{ gap: space.sm }}>
            <CardHeaderRow title="Workouts" icon="barbell" tint={categoryAccent.positive} chevron />
            <Text variant="footnote" color={color.secondaryLabel}>
              Sessions and minutes across the last 14 days.
            </Text>
          </View>
        </Card>

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

      {/* The design reaches Profile from here, not from a tab. It floats over
          the scroll at the same height as the title block's eyebrow. */}
      <Pressable
        onPress={() => router.push('/profile')}
        haptic={false}
        minTapTarget={false}
        accessibilityLabel="Profile and settings"
        style={{ position: 'absolute', top: insets.top + space.xs, right: space.lg }}
      >
        <GlassSurface
          style={{
            width: layout.tapTarget,
            height: layout.tapTarget,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {profile.name ? (
            <Avatar name={profile.name} size={layout.tapTarget} />
          ) : (
            <Icon name="person" size={space.xl} color={color.label} />
          )}
        </GlassSurface>
      </Pressable>
    </SafeAreaView>
  );
}
