// BottomSheet — controlled sheet wrapper used for all modal sheets (log session,
// uncertainty prompts, confirmations). Scrim tap or drag-down dismisses. We drive
// translateY manually with timing curves (no spring → no bounce/overshoot) so the
// drag gesture and the open animation never fight. One sheet at a time (UI rule).
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { color, motion, radius, space, shadow, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

const OPEN_OFFSET = 0;
const CLOSED_OFFSET = 900;
const DISMISS_THRESHOLD = 120;

// Gentle ease-out, no overshoot; durations come from the motion tokens (HIG §9B —
// brief, ~180–300ms). Rising in is slightly longer than the snappier dismiss.
const RISE = { duration: motion.duration.fast, easing: Easing.out(Easing.cubic) }; // 260ms
const FALL = { duration: motion.duration.snap, easing: Easing.in(Easing.cubic) }; //  180ms

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
  const translateY = useSharedValue(CLOSED_OFFSET);
  const startY = useSharedValue(0);
  // Measured panel height → the sheet slides up from exactly its own height below
  // the bottom edge (falls back to CLOSED_OFFSET before the first layout pass).
  const sheetHeight = useSharedValue(CLOSED_OFFSET);

  useEffect(() => {
    if (visible) {
      // Reduce Motion (HIG §7.3): skip the slide, snap in place and let the scrim
      // fade carry the transition.
      if (reduceMotion) {
        translateY.value = OPEN_OFFSET;
        return;
      }
      translateY.value = sheetHeight.value;
      translateY.value = withTiming(OPEN_OFFSET, RISE);
    }
  }, [visible, translateY, sheetHeight, reduceMotion]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(OPEN_OFFSET, startY.value + e.translationY);
    })
    .onEnd((e) => {
      if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(sheetHeight.value, FALL);
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(OPEN_OFFSET, RISE);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', zIndex: zIndex.bottomSheet }}>
        <Animated.View
          entering={FadeIn.duration(motion.duration.snap)}
          exiting={FadeOut.duration(motion.duration.snap)}
          style={{ position: 'absolute', inset: 0, backgroundColor: color.overlay }}
        >
          <View
            accessibilityRole="button"
            accessibilityLabel="Close"
            onTouchEnd={onClose}
            style={{ flex: 1 }}
          />
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
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: radius.full,
                  backgroundColor: color.gray300,
                }}
              />
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
    </Modal>
  );
}
