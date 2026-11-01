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
import { useEffect, type ReactNode } from 'react';
import { PixelRatio, Pressable as RNPressable, StyleSheet, View, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, motion, shadow, space, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

/** Panel width — the design's 232pt; no token covers a popover width. */
const PANEL_WIDTH = 232;

/** The design's own values for the panel and its rows. No token covers them. */
const PANEL_RADIUS = 18;
const PANEL_SHADOW = { ...shadow.lg, shadowOpacity: 0.2, shadowRadius: 42, shadowOffset: { width: 0, height: 18 } };
const PANEL_RING_WIDTH = 0.5;
const PANEL_RING = 'rgba(0, 0, 0, 0.06)';
const POP_OFFSET_Y = 6;
const ROW_MIN_HEIGHT = 54;
const ROW_SIDE_PADDING = 18;
const ROW_PRESSED_FILL = 'rgba(0, 0, 0, 0.05)';
const DIVIDER_HEIGHT = 0.5;
const DIVIDER_COLOR = 'rgba(0, 0, 0, 0.1)';

const rowLabelStyle = (): TextStyle => ({ fontSize: 16, fontWeight: '500', lineHeight: 20 * PixelRatio.getFontScale() });

export type AddMenuProps = {
  visible: boolean;
  onClose: () => void;
  /** Distance from the screen bottom to the top of the "+" button. */
  anchorBottom: number;
  onLogGym: () => void;
  onLogFood: () => void;
  gymGlyph: ReactNode;
  foodGlyph: ReactNode;
};

export function AddMenu({ visible, onClose, anchorBottom, onLogGym, onLogFood, gymGlyph, foodGlyph }: AddMenuProps) {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const scrimProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // Reduce Motion still needs the fade — an element appearing with no
      // transition at all is harsher than a cross-fade, and opacity is not
      // motion. No scale, no translation.
      progress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.snap });
      scrimProgress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.snap });
      return;
    }
    const easing = visible ? Easing.bezier(0, 0, 0.2, 1) : Easing.bezier(0.4, 0, 1, 1);
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? motion.duration.medium : motion.duration.snap, easing });
    scrimProgress.value = withTiming(visible ? 1 : 0, { duration: visible ? motion.duration.fast : motion.duration.snap, easing });
  }, [visible, reduceMotion, progress, scrimProgress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimProgress.value }));
  const panelStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: progress.value };
    return {
      opacity: progress.value,
      transform: [
        { translateY: (1 - progress.value) * POP_OFFSET_Y },
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
            borderRadius: PANEL_RADIUS,
            backgroundColor: color.white,
            // The design pops it from the button it belongs to, bottom-right.
            transformOrigin: 'bottom right',
          },
          PANEL_SHADOW,
          panelStyle,
        ]}
      >
        {/* Clipped in here: on iOS `overflow: hidden` would also clip the panel's shadow. */}
        <View style={{ borderRadius: PANEL_RADIUS, borderWidth: PANEL_RING_WIDTH, borderColor: PANEL_RING, overflow: 'hidden' }}>
          <MenuRow label={t('addMenu.logGymSession')} glyph={gymGlyph} onPress={onLogGym} />
          <View style={{ height: DIVIDER_HEIGHT, backgroundColor: DIVIDER_COLOR, marginLeft: ROW_SIDE_PADDING }} />
          <MenuRow label={t('addMenu.logFood')} glyph={foodGlyph} onPress={onLogFood} />
        </View>
      </Animated.View>
    </View>
  );
}

function MenuRow({
  label,
  glyph,
  onPress,
}: {
  label: string;
  glyph: ReactNode;
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
        paddingHorizontal: ROW_SIDE_PADDING,
        minHeight: ROW_MIN_HEIGHT,
        backgroundColor: pressed ? ROW_PRESSED_FILL : 'transparent',
        opacity: 1,
      })}
    >
      <Text color={color.label} style={[rowLabelStyle(), { flex: 1 }]}>
        {label}
      </Text>
      {/* The glyph is the only tinted thing — it names which log this is. */}
      {glyph}
    </Pressable>
  );
}
