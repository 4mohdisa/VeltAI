// Liquid Glass nav buttons — back / close / save. These float above content as
// glass controls (nav layer ONLY — never on cards/lists/content). On the iOS 26
// SDK they use the real system Liquid Glass via expo-glass-effect; otherwise they
// fall back to a clean light BlurView material circle. Icon inside is black.
// Press feedback is opacity only (no spring) via the Pressable primitive.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

const LIQUID = isLiquidGlassAvailable();
const SIZE = 40;

function GlassCircle({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const base: ViewStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (LIQUID) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme="light" isInteractive style={[base, style]}>
        {children}
      </GlassView>
    );
  }
  // Fallback: clean light material circle.
  return (
    <BlurView tint="light" intensity={40} style={[base, { backgroundColor: surface.card }, style]}>
      {children}
    </BlurView>
  );
}

export type GlassNavButtonProps = {
  onPress?: () => void;
  testID?: string;
};

export function GlassBackButton({ onPress, testID }: GlassNavButtonProps) {
  const handlePress = () => {
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
  };
  return (
    <Pressable haptic={false} onPress={handlePress} accessibilityLabel="Go back" testID={testID}>
      <GlassCircle>
        <Icon name="chevron-back" size={20} color={color.black} />
      </GlassCircle>
    </Pressable>
  );
}

export function GlassCloseButton({ onPress, testID }: GlassNavButtonProps) {
  const handlePress = () => {
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
  };
  return (
    <Pressable haptic={false} onPress={handlePress} accessibilityLabel="Close" testID={testID}>
      <GlassCircle>
        <Icon name="close" size={18} color={color.black} />
      </GlassCircle>
    </Pressable>
  );
}

export type GlassSaveButtonProps = GlassNavButtonProps & {
  /** Render "Done" text instead of a checkmark glyph. */
  label?: string;
  disabled?: boolean;
};

export function GlassSaveButton({ onPress, label, disabled, testID }: GlassSaveButtonProps) {
  return (
    <Pressable
      haptic={false}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label ?? 'Done'}
      testID={testID}
    >
      <GlassCircle style={label ? { width: undefined, paddingHorizontal: space.lg } : undefined}>
        {label ? (
          <Text variant="bodyBold" color={color.black}>
            {label}
          </Text>
        ) : (
          <Icon name="checkmark" size={18} color={color.black} />
        )}
      </GlassCircle>
    </Pressable>
  );
}

/** True when the real iOS Liquid Glass material is in use (vs the blur fallback). */
export const liquidGlassActive = LIQUID;
