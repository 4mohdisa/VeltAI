// BottomSheet — controlled sheet wrapper used for all modal sheets (log session,
// uncertainty prompts, confirmations). Scrim tap or drag-down dismisses. We drive
// translateY manually so the drag gesture and the open spring never fight a
// layout animation. One sheet at a time (UI doc rule).
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { color, radius, space, shadow, zIndex } from '@/lib/design/tokens';

const OPEN_OFFSET = 0;
const CLOSED_OFFSET = 900;
const DISMISS_THRESHOLD = 120;

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
      translateY.value = withSpring(OPEN_OFFSET, { damping: 20, stiffness: 220 });
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
        translateY.value = withSpring(CLOSED_OFFSET, { damping: 24, stiffness: 220 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(OPEN_OFFSET, { damping: 20, stiffness: 220 });
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
