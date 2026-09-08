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
import { color, layout, radius, shadow, space, surface } from '@/lib/design/tokens';
import { useReduceTransparency } from '@/lib/design/reduceTransparency';
import { useReduceMotion } from '@/lib/design/reduceMotion';

const LIQUID = isLiquidGlassAvailable();
const SIZE = layout.tapTarget; // 44pt — HIG minimum touch target

// Solid opaque fallback for Reduce Transparency (HIG §11): a flat monochrome
// surface with a hairline edge so the control still reads as a button.
const solidGlass: ViewStyle = { backgroundColor: surface.card, borderWidth: 1, borderColor: color.gray200 };

function GlassCircle({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReduceMotion();
  const base: ViewStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (reduceTransparency) {
    return <View style={[base, solidGlass, style]}>{children}</View>;
  }
  if (LIQUID) {
    // isInteractive off under Reduce Motion → no specular/motion response.
    return (
      <GlassView glassEffectStyle="regular" colorScheme="light" isInteractive={!reduceMotion} style={[base, style]}>
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

/**
 * GlassSurface — the same three-way material ladder as the circular buttons
 * (real Liquid Glass → BlurView → opaque under Reduce Transparency), but with a
 * caller-supplied shape. The floating tab bar uses it for its pill.
 *
 * Exported so the ladder lives in exactly one place: a second hand-rolled copy
 * would drift the moment one of the three branches changes.
 *
 * Do NOT animate opacity on this or any ancestor — `opacity: 0` collapses the
 * glass effect outright rather than fading it.
 */
export function GlassSurface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReduceMotion();

  if (reduceTransparency) {
    return <View style={[{ overflow: 'hidden' }, solidGlass, style]}>{children}</View>;
  }
  if (LIQUID) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="light"
        isInteractive={!reduceMotion}
        style={[{ overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    );
  }
  return (
    <BlurView tint="light" intensity={50} style={[{ overflow: 'hidden', backgroundColor: surface.card }, style]}>
      {children}
    </BlurView>
  );
}

export type GlassNavButtonProps = {
  onPress?: () => void;
  testID?: string;
};

// A visible back/close control that does nothing is worse than no control.
// When the screen IS the navigation root — deep link, notification tap, or a
// route presented as the entry screen — canGoBack() is false and these used to
// fall through to nothing at all: no navigation, no disabled state, no
// feedback. Fall back to the app's home tab so there is always a way out.
function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

export function GlassBackButton({ onPress, label, testID }: GlassNavButtonProps & { label?: string }) {
  const handlePress = () => {
    if (onPress) onPress();
    else goBackOrHome();
  };
  // HIG §4.2: where iOS shows it, the back control names the previous screen
  // ("‹ Food") instead of a bare arrow. A label turns the circle into a pill.
  return (
    <Pressable
      haptic={false}
      onPress={handlePress}
      accessibilityLabel={label ? `Back to ${label}` : 'Go back'}
      testID={testID}
    >
      <GlassCircle style={label ? { width: undefined, paddingHorizontal: space.md, flexDirection: 'row', gap: space.xs } : undefined}>
        <Icon name="chevron-back" size={20} color={color.black} />
        {label ? (
          <Text variant="bodyMedium" color={color.black} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
      </GlassCircle>
    </Pressable>
  );
}

export function GlassCloseButton({ onPress, testID }: GlassNavButtonProps) {
  const handlePress = () => {
    if (onPress) onPress();
    else goBackOrHome();
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

const FAB_SIZE = 56;

export type GlassFabProps = {
  onPress?: () => void;
  icon?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** 'solid' = the primary add button: solid black circle, white glyph (HIG
   *  §4.1 — the one primary action). 'glass' = a Liquid Glass utility FAB. */
  variant?: 'glass' | 'solid';
};

/** Floating action button. The caller positions it (absolute) clear of the tab
 *  bar. Opacity press feedback only (no spring). */
export function GlassFab({
  onPress,
  icon = 'plus',
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
  variant = 'glass',
}: GlassFabProps) {
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReduceMotion();
  const circle: ViewStyle = {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (variant === 'solid') {
    // Primary add button: black fill, white icon (opaque already).
    return (
      <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} testID={testID} style={style}>
        <View style={[circle, { backgroundColor: color.primary }, shadow.md]}>
          <Icon name={icon} size={26} color={color.onPrimary} />
        </View>
      </Pressable>
    );
  }

  const inner = <Icon name={icon} size={26} color={color.black} />;
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} testID={testID} style={style}>
      {/* Shadow wrapper — the glass circle clips its content (overflow hidden), so
          the drop shadow lives here to make the control read as a floating button. */}
      <View style={[{ borderRadius: radius.full }, shadow.md]}>
        {reduceTransparency ? (
          <View style={[circle, solidGlass]}>{inner}</View>
        ) : LIQUID ? (
          <GlassView glassEffectStyle="regular" colorScheme="light" isInteractive={!reduceMotion} style={circle}>
            {inner}
          </GlassView>
        ) : (
          <BlurView tint="light" intensity={50} style={[circle, { backgroundColor: surface.card }]}>
            {inner}
          </BlurView>
        )}
      </View>
    </Pressable>
  );
}

/** True when the real iOS Liquid Glass material is in use (vs the blur fallback). */
