// AI hub screen — a full-screen push route (auto-registered by expo-router).
// Top: the learned brain profile, then a standalone "Ask Lumo" entry, then the
// combined insights + anomalies feed (newest first). Degrades to a
// not-enough-data / no-insights empty state without ever crashing.
import { View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState, Skeleton } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { BrainProfileCard, InsightCard, AnomalyCard } from '@/components/ai';
import { useInsights, useBrainProfile } from '@/lib/data/aiBrain';
import { color, space, radius, categoryAccent } from '@/lib/design/tokens';
import type { AIAnomaly, AIInsight } from '@/lib/types';

type FeedItem =
  | { kind: 'insight'; item: AIInsight }
  | { kind: 'anomaly'; item: AIAnomaly };

export default function InsightsScreen() {
  const { insights, anomalies, loading, dismiss } = useInsights();
  const { notEnoughData } = useBrainProfile();

  // One tagged, newest-first list so insights and anomalies interleave by time.
  const feed: FeedItem[] = [
    ...insights.map((item): FeedItem => ({ kind: 'insight', item })),
    ...anomalies.map((item): FeedItem => ({ kind: 'anomaly', item })),
  ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime());

  const isEmpty = !loading && insights.length === 0 && anomalies.length === 0;

  return (
    <Screen title="Insights" showBack scroll>
      <BrainProfileCard onAskLumo={() => router.push('/ai-query' as Href)} />

      {/* Standalone Ask Lumo entry — always visible above the feed. */}
      <Card onPress={() => router.push('/ai-query' as Href)} accessibilityLabel="Ask Lumo">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Icon name="sparkles" size={24} color={categoryAccent.ai} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold" color={color.label}>
              Ask Lumo
            </Text>
            <Text variant="footnote" color={color.secondaryLabel}>
              Ask about your food, nutrition, or habits
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={color.tertiaryLabel} />
        </View>
      </Card>

      {/* Feed area: loading → skeletons; empty → learning / no-insights state. */}
      {loading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={96} rounded={radius.lg} />
          <Skeleton height={96} rounded={radius.lg} />
          <Skeleton height={96} rounded={radius.lg} />
        </View>
      ) : isEmpty ? (
        notEnoughData ? (
          <EmptyState
            icon="sparkles-outline"
            title="Lumo is learning"
            message="Log food and workouts for a few days and your personalised insights will appear here."
          />
        ) : (
          <EmptyState
            icon="bulb"
            title="No insights yet"
            message="Keep logging your food and workouts. Insights appear after a few days of data."
          />
        )
      ) : (
        <View style={{ gap: space.lg }}>
          {feed.map((entry, index) =>
            entry.kind === 'insight' ? (
              <InsightCard
                key={entry.item.id}
                insight={entry.item}
                onDismiss={(id: string) => dismiss(id, 'insight')}
                index={index}
              />
            ) : (
              <AnomalyCard
                key={entry.item.id}
                anomaly={entry.item}
                onDismiss={(id: string) => dismiss(id, 'anomaly')}
              />
            ),
          )}
        </View>
      )}
    </Screen>
  );
}
