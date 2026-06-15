// Card — the standard surface: white fill, hairline gray border, lg radius and
// padding (tokens doc "Card" shorthand). Depth comes from the border, not a
// shadow. Pass `onPress` to make the whole card tappable.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/primitives/Pressable';
import { color, radius, space } from '@/lib/design/tokens';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

const base: ViewStyle = {
  backgroundColor: color.white,
  borderColor: color.gray200,
  borderWidth: 1,
  borderRadius: radius.lg,
};

export function Card({
  children,
  onPress,
  style,
  padded = true,
  testID,
  accessibilityLabel,
}: CardProps) {
  const padding = padded ? { padding: space.lg } : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        haptic={false}
        minTapTarget={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        style={[base, padding, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[base, padding, style]}>
      {children}
    </View>
  );
}
