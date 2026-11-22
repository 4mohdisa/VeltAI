// D4 · Streak detail
// Streak counter up top, then longest streak, total sessions and freezes
// available. The design's "next 7 days" list needs per-day log/freeze/scheduled
// suggestions no backend route provides (PHASE2_ROWS.md row 12) — rather than
// inventing them, this screen shows only what the server actually knows. A
// failed read with nothing stored shows the LoadFailedNotice with Retry; a user
// who has never trained sees the empty state instead of a row of zeros. While
// the first read runs with nothing stored, neither shows.
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Stat } from '@/components/display/Stat';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { useGym } from '@/lib/data';
import { space } from '@/lib/design/tokens';

export default function StreakDetailScreen() {
  const { t } = useTranslation();
  const {
    data: { streak },
    isLoading,
    error,
    refetch,
  } = useGym();
  const hasStreak = streak.longest > 0 || streak.totalGymDays > 0;

  return (
    <Screen variant="floating" title={t('profile.streak')} showBack contentStyle={{ gap: space.xl }}>
      {isLoading && !hasStreak ? null : error && !hasStreak ? (
        <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />
      ) : !hasStreak ? (
        <EmptyState
          icon="flame"
          title={t('gymStreak.emptyTitle')}
          message={t('gymStreak.emptyMessage')}
          actionLabel={t('addMenu.logGymSession')}
          onAction={() => router.push('/gym/log-session')}
        />
      ) : (
        <>
          <Card variant="elevated">
            <StreakCounter days={streak.current} />
          </Card>

          <Card variant="elevated">
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat value={streak.longest} label={t('profile.longest')} size="small" align="center" />
              <Stat value={streak.totalGymDays} label={t('gymStreak.sessions')} size="small" align="center" />
              <Stat value={streak.freezesAvailable} label={t('profile.freezes')} size="small" align="center" />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
