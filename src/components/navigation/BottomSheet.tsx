// BottomSheet — controlled sheet wrapper used for all in-app modal sheets (item
// edit, log session, uncertainty prompts, confirmations).
//
// ROOT-CAUSE NOTE (this is the third pass on the sheet animation): the previous
// versions rendered inside RN's <Modal>. On the New Architecture the Modal owns
// its own native presentation Animated.Value — which (a) emits the spurious
// "Sending 'onAnimatedValueUpdate' with no listeners registered" warning the
// moment it mounts (eagerly, with the tab screens), and (b) fights Reanimated:
// the Modal presents the content instantly so the slide is "consumed" (it appears
// instead of sliding) and it unmounts the instant visible=false so dismiss never
// slides down. Driving timing/easing harder couldn't fix a mechanism problem.
//
// Fix: render in a react-native-screens <FullWindowOverlay> (the same primitive
// @gorhom/bottom-sheet uses) instead of <Modal>. There is no Modal Animated.Value
// (warning gone) and Reanimated fully owns translateY, so the sheet slides up on
// open and DOWN on dismiss before it unmounts. No spring, no bounce.
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { color, motion, radius, space, shadow, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

const OPEN_OFFSET = 0;
const CLOSED_OFFSET = 900; // fully off-screen below; the panel is anchored bottom
const DISMISS_THRESHOLD = 120;

// Gentle ease curves, no overshoot; durations from the motion tokens (~180–300ms).
const RISE = { duration: motion.duration.fast, easing: Easing.out(Easing.cubic) };
const FALL = { duration: motion.duration.snap, easing: Easing.in(Easing.cubic) };

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  testID?: string;
};

export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  // `mounted` is decoupled from `visible` so we can play the slide-DOWN before the
  // overlay unmounts (Modal couldn't — it tore down on visible=false instantly).
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(CLOSED_OFFSET);
  const startY = useSharedValue(0);
  const sheetHeight = useSharedValue(CLOSED_OFFSET);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        translateY.value = OPEN_OFFSET; // snap (scrim still fades via translateY)
      } else {
        // Park off-screen (its own height below), then slide up — always visible.
        translateY.value = sheetHeight.value;
        translateY.value = withTiming(OPEN_OFFSET, RISE);
      }
    } else if (mounted) {
      if (reduceMotion) {
        setMounted(false);
        return;
      }
      // Slide down, then unmount once the animation actually finishes.
      translateY.value = withTiming(sheetHeight.value, FALL, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(OPEN_OFFSET, startY.value + e.translationY);
    })
    .onEnd((e) => {
      if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 800) {
        // Hand off to the close effect, which animates down + unmounts.
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(OPEN_OFFSET, RISE);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  // Scrim opacity follows the slide (1 at rest, 0 fully off-screen) — no layout
  // animations, so nothing inside the overlay registers a stray native listener.
  const scrimStyle = useAnimatedStyle(() => {
    const h = sheetHeight.value || CLOSED_OFFSET;
    const p = 1 - translateY.value / h;
    return { opacity: p < 0 ? 0 : p > 1 ? 1 : p };
  });

  if (!mounted) return null;

  return (
    <FullWindowOverlay>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', zIndex: zIndex.bottomSheet }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay }, scrimStyle]}>
          <View accessibilityRole="button" accessibilityLabel="Close" onTouchEnd={onClose} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View
          testID={testID}
          accessibilityViewIsModal
          onLayout={(e) => {
            sheetHeight.value = e.nativeEvent.layout.height + insets.bottom;
          }}
          style={[
            {
              backgroundColor: color.white,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: space.lg,
              paddingTop: space.sm,
              paddingBottom: insets.bottom + space.lg,
            },
            shadow.lg,
            panelStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
              {/* grab handle */}
              <View style={{ width: 40, height: 5, borderRadius: radius.full, backgroundColor: color.gray300 }} />
              {title ? (
                <Text variant="title3" color={color.black} style={{ marginTop: space.md }}>
                  {title}
                </Text>
              ) : null}
            </View>
          </GestureDetector>
          <View style={{ gap: space.md }}>{children}</View>
        </Animated.View>
      </View>
    </FullWindowOverlay>
  );
}
