// Card — the standard surface. Two looks, both border-free (fills, not borders,
// are what make the app read clean):
//
//   'filled'   (default) a light grey fill on white, soft 20px radius. What every
//              existing screen renders; unchanged.
//   'elevated' a WHITE card on the grey zone background, 28px radius + shadow.sm.
//              The design-file look (see DECISIONS.md "Design-file UI pass"):
//              cards lift off `surface.backgroundAlt` instead of sinking into
//              white. Only ever correct on a backgroundAlt screen — a white card
//              on white needs no shadow (tokens.ts shadow rule).
//
// The variant is opt-in precisely because `Card` has callers on screens the
// design does not cover; omitting it reproduces the old rendering exactly.
// Pass `onPress` to make the whole card tappable.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Pressable } from '@/components/primitives/Pressable';
import { radius, shadow, space, surface } from '@/lib/design/tokens';

export type CardVariant = 'filled' | 'elevated';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  variant?: CardVariant;
  testID?: string;
  accessibilityLabel?: string;
};

const fills: Record<CardVariant, ViewStyle> = {
  filled: { backgroundColor: surface.card, borderRadius: radius.lg },
  elevated: { backgroundColor: surface.cardElevated, borderRadius: radius.xl, ...shadow.sm },
};

export function Card({
  children,
  onPress,
  style,
  padded = true,
  variant = 'filled',
  testID,
  accessibilityLabel,
}: CardProps) {
  const padding = padded ? { padding: space.xl } : null;
  const base = fills[variant];

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
