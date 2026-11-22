// D6 · Gym session history
// Reverse-chronological list of past sessions: date, duration, effort, notes.
// No XP, no verification, no photo — gym logging is a single tap.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { useGym } from '@/lib/data';

export default function GymHistoryScreen() {
  const { t } = useTranslation();
  const {
    data: { sessions },
    isLoading: loading,
    error,
    refetch,
  } = useGym();

  return (
    <Screen variant="floating" title={t('gym.sessionHistory')} showBack backLabel={t('gym.title')} contentStyle={{ gap: space.xl }}>
      {loading ? (
        <SkeletonList rows={4} />
      ) : error && sessions.length === 0 ? (
        <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title={t('dashboard.trainingNoSessionsTitle')}
          message={t('gymHistory.emptyMessage')}
        />
      ) : (
        <Card variant="elevated" padded={false}>
          {sessions.map((session, i) => (
          <View
            key={session.id}
            style={{
              gap: space.xs,
              padding: space.lg,
              borderTopWidth: i === 0 ? 0 : layout.hairline,
              borderTopColor: color.light1,
            }}
          >
            <Text variant="bodyBold" color={color.black}>
              {session.date}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="time-outline" size={14} color={color.gray500} />
              <Text variant="footnote" color={color.gray500}>
                {session.durationMin != null ? formatDuration(session.durationMin) : t('gymHistory.durationNotRecorded')}
                {session.effort != null ? ` · ${t('gymHistory.effort', { value: session.effort })}` : ''}
              </Text>
            </View>
            {session.notes ? (
              <Text variant="footnote" color={color.label}>
                {session.notes}
              </Text>
            ) : null}
          </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
