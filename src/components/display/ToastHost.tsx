// ToastHost — renders the active toast from the store with a slide+fade. Mounted
// once at the root. Top-center for info, bottom for action toasts.
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/primitives/Icon';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideInUp } from 'react-native-reanimated';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, motion, radius, space, shadow, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useToastStore, type ToastTone } from './toastStore';

// Monochrome: every toast is a solid black surface with white text. The tone is
// distinguished by the SF Symbol only, never by colour.
const toneStyle: Record<ToastTone, { bg: string; fg: string; icon: string }> = {
  info: { bg: color.black, fg: color.white, icon: 'information-circle' },
  success: { bg: color.black, fg: color.white, icon: 'checkmark-circle' },
  warn: { bg: color.black, fg: color.white, icon: 'warning' },
  error: { bg: color.black, fg: color.white, icon: 'alert-circle' },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, current.duration);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;

  const t = toneStyle[current.tone];
  const atTop = current.position === 'top';

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: space.lg,
        right: space.lg,
        top: atTop ? insets.top + space.sm : undefined,
        bottom: atTop ? undefined : insets.bottom + space.lg,
        zIndex: zIndex.toast,
      }}
    >
      <Animated.View
        entering={
          reduceMotion
            ? FadeIn.duration(motion.duration.snap)
            : (atTop ? SlideInUp : SlideInDown).duration(motion.duration.fast).easing(Easing.out(Easing.cubic))
        }
        exiting={FadeOut.duration(motion.duration.snap)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            backgroundColor: t.bg,
            borderRadius: radius.lg,
            paddingVertical: space.md,
            paddingHorizontal: space.lg,
          },
          shadow.md,
        ]}
      >
        {/* SF Symbol bounce on success/error confirms (skipped under Reduce Motion). */}
        <Icon
          name={t.icon}
          size={18}
          color={t.fg}
          animationSpec={
            !reduceMotion && (current.tone === 'success' || current.tone === 'error') ? { effect: { type: 'bounce' } } : undefined
          }
        />
        <Text variant="callout" color={t.fg} style={{ flex: 1 }}>
          {current.message}
        </Text>
        {current.actionLabel ? (
          <Pressable
            minTapTarget={false}
            haptic={false}
            accessibilityLabel={current.actionLabel}
            onPress={() => {
              current.onAction?.();
              dismiss();
            }}
          >
            <Text variant="bodyBold" color={t.fg} style={{ textDecorationLine: 'underline' }}>
              {current.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
