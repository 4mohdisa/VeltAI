// AI hub screen — a full-screen push route (auto-registered by expo-router).
// Top: the learned brain profile, then a standalone "Ask Lume" entry, then the
// combined insights + anomalies feed (newest first). Degrades to a
// not-enough-data / no-insights empty state without ever crashing.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState, Skeleton } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { BrainProfileCard, InsightCard, AnomalyCard } from '@/components/ai';
import { useInsights, useBrainProfile } from '@/lib/data/aiBrain';
import { hasAiConsent } from '@/lib/ai/consent';
import { aiConsentHref, replace } from '@/lib/nav';
import { color, space, radius, categoryAccent } from '@/lib/design/tokens';
import type { AIAnomaly, AIInsight } from '@/lib/types';

type FeedItem =
  | { kind: 'insight'; item: AIInsight }
  | { kind: 'anomaly'; item: AIAnomaly };

// 5.1.2(i): the feed's GET can trigger AI generation server-side, so the
// inner screen (whose hooks fetch on mount) renders only after AI consent.
// Without it the consent screen replaces this one, so Decline returns to the
// previous screen rather than to an empty insights screen, and Allow lands back
// here through the consent screen's `from`.
export default function InsightsScreen() {
  const { t } = useTranslation();
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    void hasAiConsent().then((ok) => {
      if (ok) setGranted(true);
      else replace(aiConsentHref('/insights'));
    });
  }, []);
  if (!granted) {
    return (
      <Screen variant="floating" eyebrow={t('insights.eyebrow')} title={t('insights.title')} showBack scroll>
        {null}
      </Screen>
    );
  }
  return <InsightsInner />;
}

function InsightsInner() {
  const { t } = useTranslation();
  const { insights, anomalies, loading, dismiss } = useInsights();
  const { notEnoughData } = useBrainProfile();

  // One tagged, newest-first list so insights and anomalies interleave by time.
  const feed: FeedItem[] = [
    ...insights.map((item): FeedItem => ({ kind: 'insight', item })),
    ...anomalies.map((item): FeedItem => ({ kind: 'anomaly', item })),
  ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime());

  const isEmpty = !loading && insights.length === 0 && anomalies.length === 0;

  return (
    <Screen variant="floating" eyebrow={t('insights.eyebrow')} title={t('insights.title')} showBack scroll contentStyle={{ gap: space.xl }}>
      <BrainProfileCard onAskLume={() => router.push('/ai-query' as Href)} />

      {/* Standalone Ask Lume entry — always visible above the feed. */}
      <Card variant="elevated" onPress={() => router.push('/ai-query' as Href)} accessibilityLabel={t('insights.askLume')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Icon name="sparkles" size={24} color={categoryAccent.ai} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold" color={color.label}>
              {t('insights.askLume')}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel}>
              {t('insights.askLumeHint')}
            </Text>
          </View>
          <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} />
        </View>
      </Card>

      {/* Feed area: loading → skeletons; empty → learning / no-insights state. */}
      {loading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={96} rounded={radius.xl} />
          <Skeleton height={96} rounded={radius.xl} />
          <Skeleton height={96} rounded={radius.xl} />
        </View>
      ) : isEmpty ? (
        notEnoughData ? (
          <EmptyState
            icon="sparkles-outline"
            title={t('insights.learningTitle')}
            message={t('insights.learningMessage')}
          />
        ) : (
          <EmptyState
            icon="bulb"
            title={t('insights.emptyTitle')}
            message={t('insights.emptyMessage')}
          />
        )
      ) : (
        <View style={{ gap: space.sm }}>
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
