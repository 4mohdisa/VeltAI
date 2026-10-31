// D1 · Gym log (default)
// Design-file pass: a grey page with a floating blurred header — date eyebrow +
// large "Gym" title inside the scroll, then the streak strip, the month
// month calendar, today's session, muscle focus, gym habits, the log CTA and the
// training list. Same data, same routes; only the surfaces changed.
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { StreakFlame } from '@/components/display/StreakFlame';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Text } from '@/components/primitives/Text';
import { GymSessionButton } from '@/components/domain/GymSessionButton';
import { GymCalendar } from '@/components/domain/GymCalendar';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { ProfileAvatarButton } from '@/components/navigation/ProfileAvatarButton';
import { TAB_BAR_CLEARANCE } from '@/components/navigation/LumeTabBar';
import { TodayCard, MuscleChart, GymPatternsCard } from '@/components/gym';
import { color, space, surface } from '@/lib/design/tokens';
import { useGym } from '@/lib/data';
import { addMonths } from '@/lib/data/foodDays';
import { monthSummary, monthTitle, monthView, useGymMonth } from '@/lib/data/gymRange';
import { todayISO } from '@/lib/data/mappers';

export default function GymLogScreen() {
  const { t } = useTranslation();
  const {
    data: { streak, loggedDays, frozenDates },
    error: gymError,
    refetch,
  } = useGym();
  const insets = useSafeAreaInsets();
  // Native pull-to-refresh: re-run the gym hydration; spinner clears on a short
  // trailing delay since refetch is fire-and-forget by design.
  const [refreshing, setRefreshing] = useState(false);
  // V7: the month on screen, as any ISO day inside it (0 = this month). Paging
  // stops at this month — there is nothing to show for one that hasn't happened.
  const today = todayISO();
  const [monthOffset, setMonthOffset] = useState(0);
  const month = addMonths(today, monthOffset);
  const { sessions: monthSessions, loading: monthLoading, error: monthError, refetch: refetchMonth } = useGymMonth(month);
  const view = useMemo(
    () => monthView(month, today, monthSessions, loggedDays, [streak.freezeDate ?? '', ...frozenDates]),
    [month, today, monthSessions, loggedDays, streak.freezeDate, frozenDates],
  );
  // Never a number while the month is still loading or failed to load: that is
  // how a real streak ended up beside a false "0 sessions".
  const summary = monthLoading
    ? 'Loading sessions…'
    : monthError
      ? t('gym.monthLoadFailed')
      : monthSummary(view);
  // Back from logging a session: re-read the month so the server's row, with its
  // real duration, replaces the local echo.
  useFocusEffect(
    useCallback(() => {
      refetchMonth();
    }, [refetchMonth]),
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    refetchMonth();
    setTimeout(() => setRefreshing(false), 800);
  }, [refetch, refetchMonth]);
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
          paddingBottom: TAB_BAR_CLEARANCE(insets),
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
            {t('gym.title')}
          </Text>
        </View>

        {/* The streak read failed: the card below still shows what the device
            had, so label it rather than let it read as current. */}
        {gymError ? <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} /> : null}

        {/* Streak strip: flame + count on one line, the streak's own numbers under it. */}
        <Card
          variant="elevated"
          onPress={() => router.push('/gym/streak')}
          accessibilityLabel={t('gym.streakDetailLabel', { count: streak.current })}
        >
          <View style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <StreakFlame size={space.xl} active={streak.current > 0} />
              <Text variant="statSmall" color={color.label}>
                {streak.current}
              </Text>
              <Text variant="bodyMedium" color={color.label}>
                {t('gym.dayStreak', { count: streak.current })}
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

        {/* The design's month calendar (V7), built from the sessions the server
            returned for this month plus today's, if it was just logged here. */}
        <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
          <GymCalendar
            title={monthTitle(month, today)}
            cells={view.cells}
            summary={summary}
            onPrev={() => setMonthOffset((m) => m - 1)}
            onNext={() => setMonthOffset((m) => Math.min(0, m + 1))}
            canNext={monthOffset < 0}
          />
        </Card>

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

      {/* The way into Profile, as on Summary (V2). */}
      <ProfileAvatarButton />
    </View>
  );
}
