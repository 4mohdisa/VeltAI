// Card — the standard surface: a light grey fill on white, NO border, soft 20px
// radius, generous 20px padding. Fills (not borders) are what make the app read
// clean. Pass `onPress` to make the whole card tappable.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/primitives/Pressable';
import { radius, space, surface } from '@/lib/design/tokens';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

const base: ViewStyle = {
  backgroundColor: surface.card,
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
  const padding = padded ? { padding: space.xl } : null;

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
