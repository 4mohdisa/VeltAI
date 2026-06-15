// Pressable — wraps RN Pressable with two house rules baked in:
//   1. Light-impact haptic on every press (opt out with haptic={false}).
//   2. Minimum 44pt tap target height (iOS HIG) unless minTapTarget={false}.
// Defaults accessibilityRole to "button"; callers should still pass an
// accessibilityLabel for anything without visible text.
import {
  Pressable as RNPressable,
  type PressableProps,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
  type PressableStateCallbackType,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { layout, opacity } from '@/lib/design/tokens';

export type AppPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  haptic?: boolean;
  minTapTarget?: boolean;
};

export function Pressable({
  haptic = true,
  onPress,
  style,
  minTapTarget = true,
  disabled,
  accessibilityRole = 'button',
  ...rest
}: AppPressableProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(event);
  };

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={(state) => [
        minTapTarget ? { minHeight: layout.tapTarget, justifyContent: 'center' } : null,
        { opacity: state.pressed ? opacity.pressed : disabled ? opacity.disabled : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    />
  );
}
