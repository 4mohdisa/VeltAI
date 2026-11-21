// GymPatternsCard — a plain-language summary of the user's gym habits (frequency,
// adherence, most/least-trained muscles, most-missed day) in the design file's
// card language: an elevated white card, a CardHeaderRow, and tinted / tile
// chips instead of black pills. Self-contained via useGymPatterns(); shows a
// muted prompt until there's enough logged data.
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, CardHeaderRow, Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';

const cap = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function Chip({ label }: { label: string }): JSX.Element {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        minHeight: space['2xl'],
        justifyContent: 'center',
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        backgroundColor: surface.tile,
      }}
    >
      <Text variant="caption" color={color.label}>
        {cap(label)}
      </Text>
    </View>
  );
}

function ChipRow({ title, muscles }: { title: string; muscles: string[] }): JSX.Element | null {
  if (muscles.length === 0) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="footnote" color={color.secondaryLabel}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {muscles.map((m) => (
          <Chip key={m} label={m} />
        ))}
      </View>
    </View>
  );
}

export function GymPatternsCard(): JSX.Element {
  const { t } = useTranslation();
  const { patterns, loading } = useGymPatterns();

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="80%" height={14} />
          <Skeleton width="65%" height={14} />
        </View>
      </Card>
    );
  }

  const notEnough =
    !patterns || (patterns.avg_sessions_per_week === 0 && patterns.most_trained_muscles.length === 0);

  if (notEnough) {
    return (
      <Card variant="elevated">
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('gym.keepLoggingPatterns')}
        </Text>
      </Card>
    );
  }

  const perWeek = Math.round(patterns.avg_sessions_per_week * 10) / 10;
  const adherence = Math.round(patterns.adherence_rate * 100);

  return (
    <Card variant="elevated">
      <View style={{ gap: space.lg }}>
        <CardHeaderRow title={t('gym.yourGymHabits')} icon="stats-chart" tint={categoryAccent.positive} />

        <View style={{ flexDirection: 'row', gap: space['2xl'] }}>
          <View style={{ gap: space.xs }}>
            <Text variant="statSmall" color={color.label}>
              {perWeek}
            </Text>
            <Text variant="caption" color={color.secondaryLabel}>
              {t('gym.sessionsAWeek')}
            </Text>
          </View>
          <View style={{ gap: space.xs }}>
            <Text variant="statSmall" color={color.label}>
              {`${adherence}%`}
            </Text>
            <Text variant="caption" color={color.secondaryLabel}>
              {t('gym.scheduleAdherence')}
            </Text>
          </View>
        </View>

        <ChipRow title={t('gym.mostTrained')} muscles={patterns.most_trained_muscles.slice(0, 2)} />
        <ChipRow title={t('gym.needsAttention')} muscles={patterns.least_trained_muscles.slice(0, 2)} />

        {patterns.most_missed_day ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('gym.oftenSkip', { day: patterns.most_missed_day })}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
