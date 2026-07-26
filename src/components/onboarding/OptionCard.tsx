// OptionCard — a full-width selectable card (icon + label). Unselected reads as
// a white outlined card; selected flips to solid black. Scales in on appear
// (staggered via `delay`) and dips slightly on press. Respects Reduce Motion.
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, layout, motion, radius, space } from '@/lib/design/tokens';

export type OptionCardProps = {
  icon?: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  delay?: number;
};

export function OptionCard({ icon, label, selected, onPress, delay = 0 }: OptionCardProps) {
  const reduceMotion = useReduceMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    enter.value = reduceMotion
      ? 1
      : withDelay(delay, withTiming(1, { duration: motion.duration.fast }));
  }, [delay, enter, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: (0.95 + 0.05 * enter.value) * press.value }],
  }));

  const fg = selected ? color.white : color.label;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!reduceMotion) press.value = withTiming(0.97, { duration: motion.duration.snap });
        }}
        onPressOut={() => {
          if (!reduceMotion) press.value = withTiming(1, { duration: motion.duration.snap });
        }}
        haptic={false}
        minTapTarget={false}
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          width: '100%',
          minHeight: layout.buttonHeight + space.md,
          paddingVertical: space.lg,
          paddingHorizontal: space.xl,
          borderRadius: radius.lg,
          borderWidth: layout.borderWidth,
          borderColor: selected ? color.black : color.gray300,
          backgroundColor: selected ? color.black : color.white,
        }}
      >
        {icon ? <Icon name={icon} size={22} color={fg} /> : null}
        <Text variant="bodyMedium" color={fg}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
