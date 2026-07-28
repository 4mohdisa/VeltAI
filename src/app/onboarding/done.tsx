// Done — brief success beat after a successful onboarding POST, then hands off
// to the main tabs. No back, no progress; this screen is never returned to.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { showToast } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { haptics } from '@/lib/haptics';
import { replace } from '@/lib/nav';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, motion, space } from '@/lib/design/tokens';

export default function DoneScreen() {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    haptics.success();
    if (!reduceMotion) {
      scale.value = withTiming(1, { duration: motion.duration.slow });
      opacity.value = withTiming(1, { duration: motion.duration.slow });
    }
    // 750ms: the 700ms entrance animation finishes before the hand-off.
    const t = setTimeout(() => {
      showToast({ message: 'Welcome to Lumo!', tone: 'success' });
      replace('/(tabs)');
    }, 750);
    return () => clearTimeout(t);
  }, [opacity, reduceMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <OnbScaffold showBack={false} showProgress={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Animated.View style={animStyle}>
          <Icon name="checkmark-circle" size={96} color={color.label} />
        </Animated.View>
        <Text variant="title2" color={color.label} style={{ textAlign: 'center' }}>
          {"You're all set"}
        </Text>
      </View>
    </OnbScaffold>
  );
}
