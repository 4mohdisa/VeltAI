// Row 9 · Thinking of leaving
// The user's own last 30 days from GET /api/retention/summary (counts only), a
// one-choice reason survey sent through POST /api/feedback (the reason key only),
// Keep my plan and Manage subscription. Nothing on this screen is sent to analytics.
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { Stat } from '@/components/display/Stat';
import { showToast } from '@/components/display/toastStore';
import { Button } from '@/components/forms/Button';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { api, type RetentionSummary } from '@/lib/api';
import { isManageSubscriptionAvailable, openManageSubscription } from '@/lib/billing/subscriptionLinks';
import { useApi } from '@/lib/data/gymSchedule';
import { color, space } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';

const LEAVING_REASONS = [
  'too_expensive',
  'not_using',
  'missing_feature',
  'found_other',
  'not_working',
  'other',
] as const;

function Usage({ summary }: { summary: RetentionSummary }) {
  const { t } = useTranslation();
  const { meals_last_30_days: meals, workouts_last_30_days: workouts, current_streak_days: streak } = summary;
  if (meals + workouts + streak === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title={t('subscription.leaving.emptyTitle')}
        message={t('subscription.leaving.emptyBody')}
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Stat size="medium" value={formatNumber(meals)} label={t('subscription.leaving.meals')} />
      <Stat size="medium" value={formatNumber(workouts)} label={t('subscription.leaving.workouts')} />
      <Stat size="medium" value={formatNumber(streak)} label={t('subscription.leaving.streak')} />
    </View>
  );
}

export default function LeavingScreen() {
  const { t } = useTranslation();
  const { data, loading, isError, refetch } = useApi<RetentionSummary | null>(() => api.retention.summary(), null);
  const [reason, setReason] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // The reason key only: no free text, so nothing the user typed leaves the device.
  const sendReason = async () => {
    setSendState('sending');
    try {
      await api.feedback.post({ category: 'account', message: `leaving_reason:${reason}` });
      setSendState('sent');
      showToast({ message: t('subscription.leaving.sent'), tone: 'success' });
    } catch {
      setSendState('idle');
      showToast({ message: t('subscription.leaving.sendFailed'), tone: 'error' });
    }
  };

  const openSubscriptions = async () => {
    if (!(await openManageSubscription())) {
      showToast({ message: t('profile.manageSubscriptionFailed'), tone: 'error' });
    }
  };

  return (
    <Screen
      variant="floating"
      eyebrow={t('subscription.eyebrow')}
      title={t('subscription.leaving.title')}
      showBack
      contentStyle={{ gap: space.xl }}
      footer={
        <View style={{ gap: space.sm }}>
          <Button title={t('subscription.leaving.keepPlan')} onPress={() => router.back()} />
          {isManageSubscriptionAvailable() ? (
            <Button title={t('subscription.manage')} variant="tertiary" onPress={() => void openSubscriptions()} />
          ) : null}
        </View>
      }
    >
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="title3" color={color.label}>
            {t('subscription.leaving.usageTitle')}
          </Text>
          {loading ? (
            <View testID="leaving-loading" style={{ gap: space.sm }}>
              <Skeleton width="55%" height={18} />
              <Skeleton width="80%" height={14} />
            </View>
          ) : isError || !data ? (
            <ErrorState onRetry={refetch} retryLabel={t('subscription.leaving.tryAgain')} />
          ) : (
            <Usage summary={data} />
          )}
        </View>
      </Card>
      <MultiSelectField
        label={t('subscription.leaving.reasonLabel')}
        options={LEAVING_REASONS.map((value) => ({ value, label: t(`subscription.leaving.reasons.${value}`) }))}
        selected={reason ? [reason] : []}
        // One choice: keep only the chip just tapped, or none when it is tapped again.
        onChange={(next) => setReason(next.find((v) => v !== reason) ?? '')}
      />
      <Button
        title={t('subscription.leaving.send')}
        variant="secondary"
        disabled={!reason || sendState === 'sent'}
        loading={sendState === 'sending'}
        onPress={() => void sendReason()}
      />
    </Screen>
  );
}
