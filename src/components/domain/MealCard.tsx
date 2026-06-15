// MealCard — one logged meal in the food log: slot + entry-method icon, time,
// calories, and a protein/carbs/fat summary. Tap → meal detail.
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/display/Card';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import type { EntryMethod, Meal } from '@/lib/mock/data';

const methodIcon: Record<EntryMethod, React.ComponentProps<typeof Ionicons>['name']> = {
  photo: 'camera',
  voice: 'mic',
  barcode: 'barcode',
  manual: 'create',
};

export type MealCardProps = {
  meal: Meal;
  onPress?: () => void;
};

export function MealCard({ meal, onPress }: MealCardProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${meal.slot}, ${formatCalories(meal.calories)}`}>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name={methodIcon[meal.method]} size={16} color={color.gray500} />
          <Text variant="bodyBold" color={color.black} style={{ flex: 1 }}>
            {meal.slot}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            {meal.time}
          </Text>
        </View>

        <Text variant="callout" color={color.gray700} numberOfLines={1}>
          {meal.items.map((it) => it.name).join(', ')}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="statSmall" color={color.black}>
            {formatCalories(meal.calories)}
          </Text>
          <Text variant="footnote" color={color.gray500}>
            P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
          </Text>
        </View>
      </View>
    </Card>
  );
}
