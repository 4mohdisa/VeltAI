// ToastHost — renders the active toast from the store with a slide+fade. Mounted
// once at the root. Top-center for info, bottom for action toasts.
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeOut, SlideInDown, SlideInUp } from 'react-native-reanimated';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, shadow, zIndex } from '@/lib/design/tokens';
import { useToastStore, type ToastTone } from './toastStore';

const toneStyle: Record<ToastTone, { bg: string; fg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  info: { bg: color.black, fg: color.white, icon: 'information-circle' },
  success: { bg: color.accent, fg: color.white, icon: 'checkmark-circle' },
  warn: { bg: color.warn, fg: color.black, icon: 'warning' },
  error: { bg: color.error, fg: color.white, icon: 'alert-circle' },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
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
        entering={atTop ? SlideInUp.springify().damping(18) : SlideInDown.springify().damping(18)}
        exiting={FadeOut.duration(200)}
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
        <Ionicons name={t.icon} size={18} color={t.fg} />
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
