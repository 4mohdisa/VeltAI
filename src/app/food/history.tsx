// C12 · Meal history
// List by date, descending. Each day shows date, total calories, and gym status
// (checkmark or dash). Tap a day → that day's food log.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';

type DayRow = { date: string; kcal: number; gym: boolean };

const HISTORY: DayRow[] = [
  { date: 'Today', kcal: 1240, gym: false },
  { date: 'Yesterday', kcal: 2080, gym: true },
  { date: 'Sun 14 Jun', kcal: 2240, gym: true },
  { date: 'Sat 13 Jun', kcal: 2610, gym: false },
  { date: 'Fri 12 Jun', kcal: 1990, gym: true },
  { date: 'Thu 11 Jun', kcal: 2120, gym: true },
];

export default function MealHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  return (
    <Screen title="Meal history" showBack refreshing={refreshing} onRefresh={onRefresh}>
      <Card padded={false}>
        {HISTORY.map((day, i) => (
          <Pressable
            key={day.date}
            haptic={false}
            minTapTarget={false}
            onPress={() => router.push('/(tabs)/food')}
            accessibilityLabel={`${day.date}, ${formatCalories(day.kcal)}, gym ${day.gym ? 'done' : 'missed'}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: color.gray100,
            }}
          >
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="bodyBold" color={color.black}>
                {day.date}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {formatCalories(day.kcal)}
              </Text>
            </View>
            <Icon
              name={day.gym ? 'checkmark-circle' : 'remove-circle-outline'}
              size={20}
              color={day.gym ? color.accent : color.gray400}
            />
            <Icon name="chevron-forward" size={18} color={color.gray400} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
