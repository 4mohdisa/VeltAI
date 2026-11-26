// Row 14a · A one-line "was this useful?" chip shown after a feature is used.
// It renders only when the throttle allows a prompt for this feature; any
// answer, the close control included, records the prompt so the chip stays
// away for the cooldown. A failed save is dropped: it never blocks the answer.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';
import type { FeatureKey } from '@/lib/feedback/features';
import { loadFeedbackPromptState, saveFeedbackPromptState } from '@/lib/feedback/promptStore';
import { canPromptFeature, recordPrompt, type FeedbackPromptState } from '@/lib/feedback/throttle';

export type FeatureRating = 'up' | 'down';

export function FeatureFeedbackChip({
  featureKey,
  onRate,
}: {
  featureKey: FeatureKey;
  onRate: (rating: FeatureRating) => void;
}) {
  const { t } = useTranslation();
  // The loaded state while the chip shows; null while loading, blocked or answered.
  const [state, setState] = useState<FeedbackPromptState | null>(null);

  useEffect(() => {
    let alive = true;
    void loadFeedbackPromptState().then((loaded) => {
      if (alive && canPromptFeature(loaded, featureKey, Date.now(), false).allowed) setState(loaded);
    });
    return () => {
      alive = false;
    };
  }, [featureKey]);

  if (!state) return null;

  const record = async () => {
    setState(null);
    await saveFeedbackPromptState(recordPrompt(state, featureKey, Date.now())).catch(() => undefined);
  };
  const rate = (rating: FeatureRating) => void record().then(() => onRate(rating));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        alignSelf: 'flex-start',
        backgroundColor: surface.card,
        borderRadius: radius.pill,
        paddingLeft: space.md,
      }}
    >
      <Text variant="footnote" color={color.label}>
        {t('feedback.chip.question')}
      </Text>
      <Pressable accessibilityLabel={t('feedback.chip.thumbsUp')} onPress={() => rate('up')} style={{ alignItems: 'center' }}>
        <Icon name="hand.thumbsup" size={18} color={color.label} />
      </Pressable>
      <Pressable accessibilityLabel={t('feedback.chip.thumbsDown')} onPress={() => rate('down')} style={{ alignItems: 'center' }}>
        <Icon name="hand.thumbsdown" size={18} color={color.label} />
      </Pressable>
      <Pressable accessibilityLabel={t('feedback.chip.dismiss')} onPress={() => void record()} haptic={false} style={{ alignItems: 'center' }}>
        <Icon name="close" size={16} color={color.tertiaryLabel} />
      </Pressable>
    </View>
  );
}
