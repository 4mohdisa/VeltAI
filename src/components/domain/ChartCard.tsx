// ChartCard — the standard frame for every chart (HIG data-viz + §7). Design-file
// pass: the frame is now an elevated white card on the grey page, headed by the
// standard CardHeaderRow (bodyMedium name) with the takeaway as a footnote
// beneath it, instead of an uppercase kicker over a callout.
//
// Gives each
// chart: a headline (what it shows, in words), an optional plain-language takeaway
// (insight, not just data), a single VoiceOver summary for the whole chart, and
// empty / loading states. Chrome stays monochrome; the chart inside provides the
// functional accent (always with labels/markers, never colour-only).
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type ChartCardProps = {
  /** Headline — what the chart shows ("Calories", "Macros today"). */
  title: string;
  /** Plain-language takeaway near the chart ("420 kcal left of 2,150"). */
  takeaway?: string;
  /** VoiceOver summary for the whole chart; defaults to title + takeaway. */
  summary?: string;
  loading?: boolean;
  empty?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  children: ReactNode;
};

export function ChartCard({
  title,
  takeaway,
  summary,
  loading = false,
  empty = false,
  emptyIcon = 'chart.bar.xaxis',
  emptyTitle = 'No data yet',
  emptyMessage = 'Log to start seeing your trend here.',
  children,
}: ChartCardProps) {
  const voiceSummary = summary ?? (takeaway ? `${title}. ${takeaway}` : title);

  return (
    <Card variant="elevated">
      {/* One VoiceOver element summarises the chart (HIG §7) — title is a header. */}
      <View accessible accessibilityLabel={voiceSummary} style={{ gap: space.xs, marginBottom: space.md }}>
        <CardHeaderRow title={title} />
        {takeaway ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {takeaway}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View accessibilityLabel="Loading" style={{ gap: space.sm }}>
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
          <Skeleton width="90%" height={14} />
        </View>
      ) : empty ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
      ) : (
        children
      )}
    </Card>
  );
}
