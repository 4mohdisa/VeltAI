// F3 · Streak milestone modal
// Full-screen at 7 / 30 / 100-day streaks: flame animation, milestone count, XP
// bonus, and (when applicable) a granted streak freeze. Continue dismisses.
// NOTE: SKStoreReviewController fires separately after a 7-day streak — never
// coupled to this modal and never incentivised (App Store rule 1.1.6).
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { StreakFlame } from '@/components/animations/StreakFlame';
import { ConfettiBurst } from '@/components/animations/ConfettiBurst';
import { color, space } from '@/lib/design/tokens';

const BONUS: Record<string, number> = { '7': 50, '30': 200, '100': 500 };

export default function MilestoneModalScreen() {
  const { days } = useLocalSearchParams<{ days?: string }>();
  const count = days ?? '7';
  const bonus = BONUS[count] ?? 50;
  const grantsFreeze = count === '30' || count === '100';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <ConfettiBurst trigger={1} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg }}>
        <StreakFlame size={88} active />
        <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: space.xs }}>
          <Text variant="display" color={color.black}>
            {count}-day streak
          </Text>
          <Text variant="title3" color={color.gray700}>
            You showed up. That&apos;s the whole game.
          </Text>
        </Animated.View>

        <View style={{ alignItems: 'center', gap: space.sm, marginTop: space.md }}>
          <Text variant="statMedium" color={color.accent}>
            +{bonus} XP
          </Text>
          {grantsFreeze ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <Ionicons name="snow" size={16} color={color.gray500} />
              <Text variant="callout" color={color.gray700}>
                A streak freeze has been added to your account.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ padding: space.lg }}>
        <Button title="Continue" onPress={() => router.canGoBack() && router.back()} />
      </View>
    </SafeAreaView>
  );
}
