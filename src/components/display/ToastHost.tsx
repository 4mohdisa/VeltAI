// ToastHost — renders the active toast from the store with a fade. Mounted once
// at the root, at the bottom of the screen unless a caller asks for the top.
import { useEffect } from 'react';
import { AccessibilityInfo, PixelRatio, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/primitives/Icon';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, motion, radius, space, shadow, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { haptics } from '@/lib/haptics';
import { useToastStore, type ToastTone } from './toastStore';

// Monochrome: every toast is the design's near-black pill with white text. The
// tone is distinguished by the SF Symbol only, never by colour. Confirmations
// (info, success) use the design's bare tick; warn and error keep their tone
// symbol so a failure never shows a tick.
const toneStyle: Record<ToastTone, { bg: string; fg: string; icon: string }> = {
  info: { bg: color.gray1, fg: color.white, icon: 'checkmark' },
  success: { bg: color.gray1, fg: color.white, icon: 'checkmark' },
  warn: { bg: color.gray1, fg: color.white, icon: 'warning' },
  error: { bg: color.gray1, fg: color.white, icon: 'alert-circle' },
};

/** The design's toast metrics (GymScreen.dc.html). No token covers any of them:
 *  112pt off the screen bottom, clear of the floating tab bar; 13pt vertical
 *  padding; a 9pt icon gap; a 16pt glyph; 500 14/18 text. */
const TOAST_BOTTOM = 112;
const TOAST_PADDING_V = 13;
const TOAST_GAP = 9;
const TOAST_ICON = 16;
const TOAST_TEXT_SIZE = 14;
const TOAST_TEXT_LINE_HEIGHT = 18;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  // Each toast pairs its tone with the matching haptic (HIG §9) — the toast is the
  // visual half — and announces itself to VoiceOver (HIG §7.1 live region), so a
  // log update like "Meal logged. 1,098 calories left today." is spoken.
  useEffect(() => {
    if (!current) return;
    if (current.tone === 'success') haptics.success();
    else if (current.tone === 'error') haptics.error();
    else if (current.tone === 'warn') haptics.warning();
    AccessibilityInfo.announceForAccessibility(current.message);
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
        bottom: atTop ? undefined : TOAST_BOTTOM,
        zIndex: zIndex.toast,
      }}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        entering={FadeIn.duration(reduceMotion ? motion.duration.snap : motion.duration.fast)}
        exiting={FadeOut.duration(motion.duration.snap)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: TOAST_GAP,
            backgroundColor: t.bg,
            borderRadius: radius.pill,
            paddingVertical: TOAST_PADDING_V,
            paddingHorizontal: space.lg,
          },
          shadow.md,
        ]}
      >
        {/* SF Symbol bounce on success/error confirms (skipped under Reduce Motion). */}
        <Icon
          name={t.icon}
          size={TOAST_ICON}
          color={t.fg}
          animationSpec={
            !reduceMotion && (current.tone === 'success' || current.tone === 'error') ? { effect: { type: 'bounce' } } : undefined
          }
        />
        <Text
          variant="bodyMedium"
          color={t.fg}
          style={{ flex: 1, fontSize: TOAST_TEXT_SIZE, lineHeight: TOAST_TEXT_LINE_HEIGHT * PixelRatio.getFontScale() }}
        >
          {current.message}
        </Text>
        {current.actionLabel ? (
          <Pressable
            minTapTarget={false}
            hitSlop={12}
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
