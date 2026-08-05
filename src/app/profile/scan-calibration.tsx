// Task 6 · Scan calibration transparency
// Shows the user how Lume is learning their portion sizes: total/corrected scans,
// an accuracy score derived from the average correction magnitude, the per-food
// multipliers Lume has learned, and which foods it tends to under/over-estimate.
// Best-effort + offline-safe: a failed fetch degrades to an educational empty
// state, never a crash. Literal English copy here to keep the shared en.json lean.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Skeleton } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { api } from '@/lib/api';
import type { ScanCalibration } from '@/lib/types';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      variant="footnote"
      color={color.secondaryLabel}
      style={{ textTransform: 'uppercase', letterSpacing: 1 }}
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
  }, []);

  return (
    <Screen grouped title="Scan accuracy" showBack backLabel={t('settings.title')}>
      <Text variant="title2" color={color.label}>
        How accurate are your scans?
      </Text>

      {loading ? (
        <>
          <Skeleton height={120} rounded={20} />
          <Skeleton height={64} rounded={20} />
          <Skeleton height={140} rounded={20} />
        </>
      ) : (
        <Body data={data} failed={failed} />
      )}
    </Screen>
  );
}

function Body({ data, failed }: { data: ScanCalibration | null; failed: boolean }) {
  const summary = data?.accuracy_summary;
  const learned = (data?.factors ?? []).filter((f) => f.sample_count >= 3);
  const hasNothing = !summary || (learned.length === 0 && summary.corrected_count === 0);

  if (failed || !summary || hasNothing) {
    return (
      <EmptyState
        icon="camera"
        title="No scans yet"
        message="Log your first photo scan to start teaching Lume your portion sizes."
      />
    );
  }

  const correctedPct = summary.total_scans > 0 ? Math.round((summary.corrected_count / summary.total_scans) * 100) : 0;
  const score = clamp01(1 - summary.avg_correction_magnitude);
  const under = summary.most_underestimated ?? [];
  const over = summary.most_overestimated ?? [];

  return (
    <>
      {/* Summary */}
      <Card>
        <View style={{ gap: space.xs }}>
          <Text variant="body" color={color.label}>{`Total scans: ${summary.total_scans}`}</Text>
          <Text variant="body" color={color.label}>{`Corrected: ${summary.corrected_count} (${correctedPct}%)`}</Text>
          <Text variant="footnote" color={color.gray500}>
            Lume is learning your portions
          </Text>
        </View>
      </Card>

      {/* Accuracy score */}
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <SectionLabel>Accuracy score</SectionLabel>
          <Text variant="bodyBold" color={color.label}>{`${Math.round(score * 100)}%`}</Text>
        </View>
        <ProgressBar value={score} />
      </View>

      {/* Foods we've learned */}
      {learned.length > 0 ? (
        <View style={{ gap: space.md }}>
          <SectionLabel>Foods we&apos;ve learned</SectionLabel>
          <Card>
            <View style={{ gap: space.lg }}>
              {learned.map((f) => {
                const pct = Math.round((f.multiplier - 1) * 100);
                const adj = pct >= 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
                return (
                  <View key={f.food_name} style={{ gap: space.xs }}>
                    <Text variant="body" color={color.label}>{`${f.food_name} — We adjust by ${adj}`}</Text>
                    <Text variant="footnote" color={color.gray500}>{`Based on ${f.sample_count} corrections`}</Text>
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
          <SectionLabel>Most corrected</SectionLabel>
          <Card>
            <View style={{ gap: space.md }}>
              {under.map((name) => (
                <Text key={`u-${name}`} variant="body" color={color.label}>
                  {`You usually eat more ${name} than we estimate`}
                </Text>
              ))}
              {over.map((name) => (
                <Text key={`o-${name}`} variant="body" color={color.label}>
                  {`You usually eat less ${name} than we estimate`}
                </Text>
              ))}
            </View>
          </Card>
        </View>
      ) : null}
    </>
  );
}
