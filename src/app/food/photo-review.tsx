// C4 · Photo review
// Captured photos at top, AI-detected items below with confidence indicators
// (low-confidence dimmed + "Confirm"). Saving with unresolved low-confidence
// items routes to the uncertainty prompt first.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Text } from '@/components/primitives/Text';
import { DetectedItemsReview } from '@/components/domain/DetectedItemsReview';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { aiDetectedItems, CONFIDENCE_THRESHOLD, type DetectedItem } from '@/lib/mock/ai';

export default function PhotoReviewScreen() {
  const [items, setItems] = useState<DetectedItem[]>(aiDetectedItems);
  const hasUncertain = items.some((it) => it.confidence < CONFIDENCE_THRESHOLD);

  const discard = () => {
    router.dismissAll?.();
    router.replace('/(tabs)/food');
  };

  // Tick proceeds: → uncertainty Q&A if anything is unsure, else save the meal.
  const proceed = () => {
    if (hasUncertain) {
      router.push('/food/uncertainty');
    } else {
      showToast({ message: 'Meal saved.', tone: 'success' });
      discard();
    }
  };

  return (
    <SheetContent title="Review meal" onClose={discard} onDone={proceed}>
      {/* Captured photos (placeholder tiles — no real image in mock) */}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {['Meal', 'Label'].map((label) => (
          <View
            key={label}
            style={{
              width: 96,
              height: 96,
              borderRadius: radius.lg,
              backgroundColor: color.gray100,
              borderWidth: 1,
              borderColor: color.gray200,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.xs,
            }}
          >
            <Icon name="image" size={22} color={color.gray400} />
            <Text variant="caption" color={color.gray500}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {hasUncertain ? (
        <Text variant="footnote" color={color.gray700}>
          Some items are dimmed — we&apos;re not sure about them and will ask before saving.
        </Text>
      ) : null}

      <DetectedItemsReview items={items} onRemove={(id) => setItems((arr) => arr.filter((x) => x.id !== id))} />
    </SheetContent>
  );
}
