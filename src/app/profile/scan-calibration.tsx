// Task 6 · Scan calibration transparency
// Shows the user how Lume is learning their portion sizes: total/corrected scans,
// an accuracy score derived from the average correction magnitude, the per-food
// multipliers Lume has learned, and which foods it tends to under/over-estimate.
// Best-effort + offline-safe: a failed fetch degrades to an educational empty
// state, never a crash. Copy reads from the settings.scanCalibration locale keys.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Stat } from '@/components/display/Stat';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { api } from '@/lib/api';
import type { ScanCalibration } from '@/lib/types';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      variant="label"
      color={color.secondaryLabel}
      style={{ textTransform: 'uppercase', letterSpacing: 1, marginLeft: space.xs }}
    >
      {children}
    </Text>
  );
}

export default function ScanCalibrationScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState<ScanCalibration | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cal = await api.scan.calibration();
        if (alive) setData(cal);
      } catch (err) {
        if (__DEV__) console.warn('scan calibration fetch failed', err);
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return (
    <Screen variant="floating" eyebrow={t('settings.scanCalibrationEyebrow')} title={t('settings.scanAccuracy')} showBack contentStyle={{ gap: space.xl }}>
      {loading ? (
        <>
          <Skeleton height={140} rounded={radius.xl} />
          <Skeleton height={88} rounded={radius.xl} />
          <Skeleton height={140} rounded={radius.xl} />
        </>
      ) : (
        <Body data={data} failed={failed} onRetry={retry} />
      )}
    </Screen>
  );
}

function Body({ data, failed, onRetry }: { data: ScanCalibration | null; failed: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  const summary = data?.accuracy_summary;
  const learned = (data?.factors ?? []).filter((f) => f.sample_count >= 3);

  if (failed) {
    return <ErrorState message={t('settings.scanCalibration.loadFailed')} onRetry={onRetry} />;
  }

  // Scans with no corrections are still scans: only a user with none sees the empty state.
  if (!summary || summary.total_scans === 0) {
    return (
      <EmptyState
        icon="camera"
        title={t('settings.scanCalibration.emptyTitle')}
        message={t('settings.scanCalibration.emptyMessage')}
      />
    );
  }

  const correctedPct = summary.total_scans > 0 ? Math.round((summary.corrected_count / summary.total_scans) * 100) : 0;
  const score = clamp01(1 - summary.avg_correction_magnitude);
  const under = summary.most_underestimated ?? [];
  const over = summary.most_overestimated ?? [];

  return (
    <>
      {/* Accuracy hero — the design's ring card, drawn as a bar because the
          trend sentence and corrections list behind the ring have no source
          (UI_PASS_GAPS.md). */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <CardHeaderRow title={t('settings.scanCalibration.scoreTitle')} icon="camera" tint={categoryAccent.positive} />
          <Text variant="statLarge" color={color.label}>{t('settings.scanCalibration.percent', { value: Math.round(score * 100) })}</Text>
          <ProgressBar value={score} tint={categoryAccent.positive} track={color.light2} />
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('settings.scanCalibration.learning')}
          </Text>
        </View>
      </Card>

      {/* Stat tiles */}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Card variant="elevated" style={{ flex: 1, padding: space.lg }}>
          <Stat value={summary.total_scans} label={t('settings.scanCalibration.scansLogged')} size="small" />
        </Card>
        <Card variant="elevated" style={{ flex: 1, padding: space.lg }}>
          <Stat
            value={summary.corrected_count}
            label={t('settings.scanCalibration.youCorrected')}
            size="small"
            valueColor={categoryAccent.calories}
          />
        </Card>
        <Card variant="elevated" style={{ flex: 1, padding: space.lg }}>
          <Stat value={t('settings.scanCalibration.percent', { value: correctedPct })} label={t('settings.scanCalibration.ofYourScans')} size="small" />
        </Card>
      </View>

      {/* Foods we've learned */}
      {learned.length > 0 ? (
        <View style={{ gap: space.md }}>
          <SectionLabel>{t('settings.scanCalibration.learnedTitle')}</SectionLabel>
          <Card variant="elevated">
            <View style={{ gap: space.lg }}>
              {learned.map((f) => {
                const pct = Math.round((f.multiplier - 1) * 100);
                const adjustment = t('settings.scanCalibration.percent', { value: pct >= 0 ? `+${pct}` : `−${Math.abs(pct)}` });
                return (
                  <View key={f.food_name} style={{ gap: space.xs }}>
                    <Text variant="body" color={color.label}>{t('settings.scanCalibration.adjustBy', { food: f.food_name, adjustment })}</Text>
                    <Text variant="footnote" color={color.secondaryLabel}>{t('settings.scanCalibration.basedOn', { count: f.sample_count })}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Most corrected */}
      {under.length > 0 || over.length > 0 ? (
        <View style={{ gap: space.md }}>
          <SectionLabel>{t('settings.scanCalibration.mostCorrected')}</SectionLabel>
          <Card variant="elevated">
            <View style={{ gap: space.md }}>
              {under.map((name) => (
                <Text key={`u-${name}`} variant="body" color={color.label}>
                  {t('settings.scanCalibration.eatMore', { food: name })}
                </Text>
              ))}
              {over.map((name) => (
                <Text key={`o-${name}`} variant="body" color={color.label}>
                  {t('settings.scanCalibration.eatLess', { food: name })}
                </Text>
              ))}
            </View>
          </Card>
        </View>
      ) : null}
    </>
  );
}
