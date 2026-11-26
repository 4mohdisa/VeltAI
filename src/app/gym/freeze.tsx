// D5 · Apply streak freeze
// Confirmation sheet: "Use 1 of your X freezes for [date]?" X-left dismisses,
// tick-right applies. Freezes protect a day from breaking the streak. A failed
// read with nothing stored shows the LoadFailedNotice with Retry; with no streak
// to protect yet, an empty state points to logging a session instead. At 0
// freezes Done is off, and a caption says why.
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { useGym, applyFreeze } from '@/lib/data';

export default function FreezeScreen() {
  const { t } = useTranslation();
  const {
    data: { streak },
    isLoading,
    error,
    refetch,
  } = useGym();
  const hasStreak = streak.longest > 0 || streak.totalGymDays > 0;
  // The server freezes TODAY and nothing else: POST /api/gym/streak/freeze takes
  // no date, and sets last_freeze_date = today (backend/internal/gym/gym.go).
  // This sheet used to default to tomorrow, and to pass through an `offset` from
  // the streak screen's 7-day list — both wrote a local freeze on a day the
  // server never froze, so the calendar drew a freeze that no server row backed.
  // The parked streak screen still pushes label/offset params; they are ignored,
  // because today is the only day the endpoint can protect.
  const close = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <SheetContent
      title={t('gym.freeze.title')}
      onClose={close}
      onDone={() => {
        applyFreeze(0);
        showToast({ message: t('gym.freeze.applied'), tone: 'success' });
        close();
      }}
      doneDisabled={!hasStreak || streak.freezesAvailable === 0}
    >
      {isLoading && !hasStreak ? null : error && !hasStreak ? (
        <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />
      ) : !hasStreak ? (
        <EmptyState
          icon="snow"
          title={t('gymFreeze.emptyTitle')}
          message={t('gymFreeze.emptyMessage')}
          actionLabel={t('addMenu.logGymSession')}
          onAction={() => router.replace('/gym/log-session')}
        />
      ) : (
        <Card>
          <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
            <Icon name="snow" size={44} color={color.gray500} />
            <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
              {t('gym.freeze.confirm', { available: streak.freezesAvailable })}
            </Text>
            <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
              {t('gym.freeze.explainer', { days: streak.current })}
            </Text>
            {streak.freezesAvailable === 0 ? (
              <Text variant="caption" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
                {t('gymStreak.noFreezes')}
              </Text>
            ) : null}
          </View>
        </Card>
      )}
    </SheetContent>
  );
}
