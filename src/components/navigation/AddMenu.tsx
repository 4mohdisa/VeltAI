// AddMenu — the popover the tab bar's black "+" opens: two ways to log, anchored
// to the button's bottom-right corner. The design file's `lumePop` entrance
// (scale 0.94 → 1, translateY 6 → 0, fading in) over motion.duration.medium.
//
// Surface choice: the design draws this as translucent glass. It renders as a
// SOLID white card here, deliberately — glass is a nav-layer material in this
// codebase and never sits over scrolling content (GlassButtons.tsx, HIG §11).
// A popover that floats above the food log is content-layer.
//
// Scrim: the design uses a 10% black wash. This uses `color.overlay`, the app's
// one scrim token, so the menu dims exactly like every BottomSheet does. Darker
// than the prototype, and the deviation is recorded in DECISIONS.md.
import { useEffect } from 'react';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, motion, radius, shadow, space, surface, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

/** Panel width — the design's 232pt; no token covers a popover width. */
const PANEL_WIDTH = 232;

export type AddMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** Distance from the screen bottom to the top of the "+" button. */
  anchorBottom: number;
  onLogGym: () => void;
  onLogFood: () => void;
};

export function AddMenu({ visible, onClose, anchorBottom, onLogGym, onLogFood }: AddMenuProps) {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // Reduce Motion still needs the fade — an element appearing with no
      // transition at all is harsher than a cross-fade, and opacity is not
      // motion. No scale, no translation.
      progress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.snap });
      return;
    }
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? motion.duration.medium : motion.duration.snap,
      easing: visible ? Easing.bezier(0, 0, 0.2, 1) : Easing.bezier(0.4, 0, 1, 1),
    });
  }, [visible, reduceMotion, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: progress.value };
    return {
      opacity: progress.value,
      transform: [
        { translateY: (1 - progress.value) * space.sm },
        { scale: 0.94 + progress.value * 0.06 },
      ],
    };
  });

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: zIndex.modal }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay }, scrimStyle]}>
        {/* Tapping the scrim dismisses. Labelled so VoiceOver can leave the menu. */}
        <RNPressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('tabBar.closeMenu')} />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        style={[
          {
            position: 'absolute',
            right: space.lg,
            bottom: anchorBottom + space.md,
            width: PANEL_WIDTH,
            borderRadius: radius.lg,
            backgroundColor: color.white,
            overflow: 'hidden',
            // The design pops it from the button it belongs to, bottom-right.
            transformOrigin: 'bottom right',
          },
          shadow.lg,
          panelStyle,
        ]}
      >
        <MenuRow label="Log gym session" icon="barbell" tint={categoryAccent.positive} onPress={onLogGym} />
        <View style={{ height: layout.hairline, backgroundColor: surface.divider, marginLeft: space.lg }} />
        <MenuRow label="Log food" icon="restaurant" tint={categoryAccent.calories} onPress={onLogFood} />
      </Animated.View>
    </View>
  );
}

function MenuRow({
  label,
  icon,
  tint,
  onPress,
}: {
  label: string;
  icon: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      minTapTarget={false}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        minHeight: layout.buttonHeight,
        backgroundColor: pressed ? surface.tilePressed : 'transparent',
      })}
    >
      <Text variant="bodyMedium" color={color.label} style={{ flex: 1 }}>
        {label}
      </Text>
      {/* The glyph is the only tinted thing — it names which log this is. */}
      <Icon name={icon} size={20} color={tint} />
    </Pressable>
  );
}
