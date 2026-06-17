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
import { color, radius, space, shadow, zIndex } from '@/lib/design/tokens';

const OPEN_OFFSET = 0;
const CLOSED_OFFSET = 900;
const DISMISS_THRESHOLD = 120;

// Gentle ease-out, no overshoot. Rising in feels slightly longer than dismissing.
const RISE = { duration: 280, easing: Easing.out(Easing.cubic) };
const FALL = { duration: 220, easing: Easing.in(Easing.cubic) };

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  testID?: string;
};

export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(CLOSED_OFFSET);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = CLOSED_OFFSET;
      translateY.value = withTiming(OPEN_OFFSET, RISE);
    }
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(OPEN_OFFSET, startY.value + e.translationY);
    })
    .onEnd((e) => {
      if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(CLOSED_OFFSET, FALL);
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
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
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
