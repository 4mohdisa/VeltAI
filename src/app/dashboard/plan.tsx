// B2 · Today's plan detail
// Full vertical timeline from wake to bedtime. Meal slots show the target
// calories and three cuisine-matched suggestions; the gym slot is marked. Tap a
// meal → Add Meal pre-filled with that slot. Generation reason shown (transparency).
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import { mockPlan, mockPlanReason, type PlanEntry } from '@/lib/mock/data';

const iconFor: Record<PlanEntry['kind'], string> = {
  wake: 'sunny',
  meal: 'restaurant',
  gym: 'barbell',
  sleep: 'moon',
};

export default function PlanDetailScreen() {
  return (
    <Screen title="Today's plan" showBack>
      <View style={{ gap: space.md }}>
        {mockPlan.map((entry, index) => {
          const isMeal = entry.kind === 'meal';
          const content = (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              {/* time + node */}
              <View style={{ alignItems: 'center', width: 52 }}>
                <Text variant="footnote" color={color.gray500}>
                  {entry.time}
                </Text>
                <View
                  style={{
                    marginTop: space.xs,
                    width: 34,
                    height: 34,
                    borderRadius: radius.full,
                    backgroundColor: entry.kind === 'gym' ? color.black : color.gray100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={iconFor[entry.kind]}
                    size={18}
                    color={entry.kind === 'gym' ? color.white : color.gray700}
                  />
                </View>
              </View>
              {/* detail */}
              <View style={{ flex: 1, gap: space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="bodyBold" color={color.black}>
                    {entry.title}
                  </Text>
                  {entry.targetKcal ? (
                    <Badge label={`${entry.targetKcal} kcal`} tone="neutral" />
                  ) : null}
                </View>
                {entry.detail ? (
                  <Text variant="footnote" color={color.gray500}>
                    {entry.detail}
                  </Text>
                ) : null}
                {entry.suggestions ? (
                  <Text variant="footnote" color={color.gray700}>
                    Suggested: {entry.suggestions.join(', ')}
                  </Text>
                ) : null}
              </View>
            </View>
          );

          return isMeal ? (
            <Pressable
              key={index}
              haptic={false}
              minTapTarget={false}
              accessibilityLabel={`Add ${entry.title}`}
              onPress={() => router.push('/food/add')}
            >
              {content}
            </Pressable>
          ) : (
            <View key={index}>{content}</View>
          );
        })}
      </View>

      <Card style={{ backgroundColor: color.gray50 }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Icon name="sparkles" size={18} color={color.black} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text variant="footnote" color={color.gray700} style={{ fontWeight: '600' }}>
              Why this plan
            </Text>
            <Text variant="footnote" color={color.gray700}>
              {mockPlanReason}
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
