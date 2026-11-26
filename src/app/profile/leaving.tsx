// Row 9 · Thinking of leaving
// The user's own last 30 days from GET /api/retention/summary (counts only),
// a one-choice reason survey with an optional note, and Keep my plan. Nothing
// on this screen is sent to analytics.
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { Stat } from '@/components/display/Stat';
import { Button } from '@/components/forms/Button';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { TextField } from '@/components/forms/TextField';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { api, type RetentionSummary } from '@/lib/api';
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

const MAX_NOTE = 500;

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
  const [note, setNote] = useState('');

  return (
    <Screen
      variant="floating"
      eyebrow={t('subscription.eyebrow')}
      title={t('subscription.leaving.title')}
      showBack
      contentStyle={{ gap: space.xl }}
      footer={<Button title={t('subscription.leaving.keepPlan')} onPress={() => router.back()} />}
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
      <TextField
        label={t('subscription.leaving.noteLabel')}
        placeholder={t('subscription.leaving.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        maxLength={MAX_NOTE}
        multiline
      />
    </Screen>
  );
}
