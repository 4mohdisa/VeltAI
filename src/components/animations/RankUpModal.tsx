// RankUpModal (F2 content) — full-screen celebration when a rank threshold is
// crossed: badge scales in, confetti fires, the rank name and its unlocks are
// listed, and a single Continue button dismisses. Presentational — the route
// supplies the rank data and the dismiss handler.
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/primitives/Icon';
import Animated, { ZoomIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { ConfettiBurst } from './ConfettiBurst';
import { color, radius, space } from '@/lib/design/tokens';

export type RankUpModalProps = {
  rankName: string;
  unlocks: string[];
  onContinue: () => void;
};

export function RankUpModal({ rankName, unlocks, onContinue }: RankUpModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <ConfettiBurst trigger={1} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg }}>
        <Animated.View
          entering={reduceMotion ? undefined : ZoomIn.springify().damping(12)}
          style={{
            width: 120,
            height: 120,
            borderRadius: radius.full,
            backgroundColor: color.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="trophy" size={56} color={color.white} />
        </Animated.View>

        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(150)}
          style={{ alignItems: 'center', gap: space.xs }}
        >
          <Text variant="caption" color={color.gray500} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            New rank reached
          </Text>
          <Text variant="display" color={color.black}>
            {rankName}
          </Text>
        </Animated.View>

        <View style={{ alignSelf: 'stretch', gap: space.sm, marginTop: space.md }}>
          {unlocks.map((unlock) => (
            <View key={unlock} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="lock-open" size={18} color={color.black} />
              <Text variant="body" color={color.gray900}>
                {unlock}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ padding: space.lg }}>
        <Button title="Continue" onPress={onContinue} accessibilityLabel="Continue" />
      </View>
    </SafeAreaView>
  );
}
