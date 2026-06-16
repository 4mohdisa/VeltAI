// DetectedItemsReview — shared review list for AI-detected food (photo & voice).
// High-confidence items render at full opacity; low-confidence ones are dimmed
// and flagged "Confirm" so the user knows the AI is unsure (no silent guessing).
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, opacity, space } from '@/lib/design/tokens';
import { formatCalories, formatGrams } from '@/lib/formatting';
import { CONFIDENCE_THRESHOLD, type DetectedItem } from '@/lib/mock/ai';

export type DetectedItemsReviewProps = {
  items: DetectedItem[];
  onRemove?: (id: string) => void;
};

export function DetectedItemsReview({ items, onRemove }: DetectedItemsReviewProps) {
  const total = items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <View style={{ gap: space.md }}>
      <Card padded={false}>
        {items.map((item, i) => {
          const uncertain = item.confidence < CONFIDENCE_THRESHOLD;
          return (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                padding: space.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: color.gray100,
                opacity: uncertain ? opacity.low : opacity.full,
              }}
            >
              <View style={{ flex: 1, gap: space.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text variant="body" color={color.black}>
                    {item.name}
                  </Text>
                  {uncertain ? <Badge label="Confirm" tone="warn" /> : null}
                </View>
                <Text variant="footnote" color={color.gray500}>
                  {formatGrams(item.quantityG)} · {formatCalories(item.calories)} · P {item.protein}g
                </Text>
              </View>
              {onRemove ? (
                <Pressable
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => onRemove(item.id)}
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Icon name="close-circle" size={20} color={color.gray400} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title3" color={color.black}>
            {formatCalories(total.calories)}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            P {total.protein}g · C {total.carbs}g · F {total.fat}g
          </Text>
        </View>
      </Card>
    </View>
  );
}
