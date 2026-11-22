// BrainProfileCard — self-contained learned-profile surface. Skeletons while
// loading, a gentle "still learning" state before there's enough data, and a
// stat-row summary once the brain has a profile. Every loose Record field is
// read defensively (no `any`).
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Card, CardHeaderRow, ProgressBar, Skeleton } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useBrainProfile } from '@/lib/data/aiBrain';
import { categoryAccent, color, space } from '@/lib/design/tokens';

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

// "today" / "N hours ago" / "N days ago"; "recently" if null/unparseable.
function relativeTime(iso: string | null, t: TFunction): string {
  if (!iso) return t('insights.brainProfile.recently');
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return t('insights.brainProfile.recently');
  const hours = Math.floor((Date.now() - at) / 3_600_000);
  if (hours < 1) return t('insights.brainProfile.today');
  if (hours < 24) return t('insights.brainProfile.hoursAgo', { count: hours });
  return t('insights.brainProfile.daysAgo', { count: Math.floor(hours / 24) });
}

function readMostActiveDay(gp: Record<string, unknown> | null): string | null {
  if (!gp) return null;
  const direct = gp['most_active_day'];
  if (typeof direct === 'string' && direct.length > 0) return capitalize(direct);
  const weekdays = gp['preferred_weekdays'];
  if (Array.isArray(weekdays) && typeof weekdays[0] === 'string') return capitalize(weekdays[0]);
  return null;
}

function readScanPct(sp: Record<string, unknown> | null): number | null {
  if (!sp) return null;
  const pct = sp['overall_accuracy_pct'];
  return typeof pct === 'number' ? pct : null;
}

export function BrainProfileCard(props: { onAskLume?: () => void }): JSX.Element {
  const { t } = useTranslation();
  const { profile, loading, notEnoughData } = useBrainProfile();

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="50%" height={16} />
        </View>
      </Card>
    );
  }

  if (notEnoughData || !profile) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <CardHeaderRow title={t('insights.brainProfile.learningTitle')} icon="sparkles" tint={categoryAccent.ai} />
          <Text variant="callout" color={color.secondaryLabel}>
            {t('insights.brainProfile.learningMessage')}
          </Text>
          <ProgressBar value={0.3} tint={categoryAccent.ai} track={color.light2} />
        </View>
      </Card>
    );
  }

  const rows: { label: string; value: string }[] = [];
  if (profile.typical_daily_calories !== null) {
    rows.push({
      label: t('insights.brainProfile.typicalIntake'),
      value: t('insights.brainProfile.typicalIntakeValue', { value: Math.round(profile.typical_daily_calories) }),
    });
  }
  if (profile.goal_adherence_score !== null) {
    rows.push({
      label: t('insights.brainProfile.goalAdherence'),
      value: t('insights.brainProfile.goalAdherenceValue', { value: Math.round(profile.goal_adherence_score) }),
    });
  }
  const activeDay = readMostActiveDay(profile.gym_patterns);
  if (activeDay) rows.push({ label: t('insights.brainProfile.mostActiveDay'), value: activeDay });
  const scanPct = readScanPct(profile.scan_accuracy_profile);
  if (scanPct !== null) {
    rows.push({
      label: t('insights.brainProfile.scanAccuracy'),
      value: t('insights.brainProfile.scanAccuracyValue', { value: Math.round(scanPct) }),
    });
  }

  return (
    <Card variant="elevated">
      <View style={{ gap: space.lg }}>
        <CardHeaderRow title={t('insights.brainProfile.title')} icon="sparkles" tint={categoryAccent.ai} />

        <View style={{ gap: space.md }}>
          {rows.map((r) => (
            <View key={r.label} style={{ gap: space.xs }}>
              <Text variant="footnote" color={color.secondaryLabel}>
                {r.label}
              </Text>
              <Text variant="bodyMedium" color={color.label}>
                {r.value}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="caption" color={color.secondaryLabel}>
          {t('insights.brainProfile.updated', { time: relativeTime(profile.last_rebuilt, t) })}
        </Text>

        {props.onAskLume ? (
          <Pressable
            onPress={props.onAskLume}
            minTapTarget={false}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start' }}
            accessibilityLabel={t('insights.askLume')}
          >
            <Text variant="bodyMedium" color={color.primary}>
              {t('insights.askLume')}
            </Text>
            <Icon name="chevron-forward" size={16} color={color.primary} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
