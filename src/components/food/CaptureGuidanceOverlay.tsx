// CaptureGuidanceOverlay — presentational capture aids layered over a live
// CameraView: a status pill (lighting dots + a pulsing "Steady" dot), a dashed
// framing guide (ellipse for a plate, rectangle for a label), a static angle
// caption, and a one-time first-capture tip banner.
//
// IMPORTANT LIMITATION: this app has NO JS-side access to camera frames or pixels
// (expo-camera exposes no frame processor here, and expo-sensors / gyroscope is
// not installed). So lighting level, motion / steadiness and plate-shape CANNOT
// be measured. The lighting dots and the "Steady" pulse are therefore PURELY
// PRESENTATIONAL with fixed, sensible defaults — they must not be read as real
// sensor values. The dashed guide, the angle caption and the one-time tip banner
// ARE fully functional.
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, motion, radius, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { STORAGE_KEYS, getItem, setItem } from '@/lib/storage/secureStore';

// Fixed presentational lighting fill — 3 of 5 (see LIMITATION above). Not measured.
const LIGHTING_FILLED = 3;
const LIGHTING_TOTAL = 5;

export type CaptureGuidanceOverlayProps = {
  shape?: 'ellipse' | 'rectangle';
  promptKey?: string;
  promptText?: string;
  /** Extra top padding so the status pill / tip banner clear a screen's own
   *  header (e.g. the label-scan title). Default 0. */
  topOffset?: number;
};

export function CaptureGuidanceOverlay({
  shape = 'ellipse',
  promptKey = STORAGE_KEYS.forkPromptDismissed,
  promptText = 'Place your fork next to the food for better accuracy',
  topOffset = 0,
}: CaptureGuidanceOverlayProps) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [showTip, setShowTip] = useState(false);
  // Stable animated value (codebase convention — no ref access during render).
  const [pulse] = useState(() => new Animated.Value(1));

  // First-capture tip: persisted once dismissed. Async read → setState in the
  // promise callback (never synchronously in the effect body).
  useEffect(() => {
    let active = true;
    getItem(promptKey).then((v) => {
      if (active && v !== 'true') setShowTip(true);
    });
    return () => {
      active = false;
    };
  }, [promptKey]);

  // "Steady" dot pulse — reduce-motion → solid (no loop).
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: motion.duration.slow, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: motion.duration.slow, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);

  const dismissTip = () => {
    setShowTip(false);
    void setItem(promptKey, 'true');
  };

  const isRect = shape === 'rectangle';
  const guideLabel = isRect ? 'Align nutrition label in frame' : 'Position plate in frame';

  return (
    // box-none: the overlay itself never captures touches, so the shutter / close
    // controls (rendered ABOVE this overlay) keep working; only the Got-it button
    // inside the top zone takes taps.
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Top zone: status pill + one-time tip banner. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + space.md + topOffset,
          left: 0,
          right: 0,
          alignItems: 'center',
          gap: space.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            backgroundColor: color.overlayStrong,
            borderRadius: radius.pill,
            paddingVertical: space.xs,
            paddingHorizontal: space.md,
          }}
        >
          <Text variant="caption" color={color.white}>
            Lighting
          </Text>
          <View style={{ flexDirection: 'row', gap: space.xs }}>
            {Array.from({ length: LIGHTING_TOTAL }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i < LIGHTING_FILLED ? color.white : 'transparent',
                  borderWidth: layout.hairline,
                  borderColor: i < LIGHTING_FILLED ? color.white : color.overlayLineMuted,
                }}
              />
            ))}
          </View>
          <View style={{ width: layout.hairline, height: 12, backgroundColor: color.overlayLineMuted }} />
          <Animated.View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.white, opacity: reduce ? 1 : pulse }}
          />
          <Text variant="caption" color={color.white}>
            Steady
          </Text>
        </View>

        {showTip ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              maxWidth: 360,
              marginHorizontal: space.lg,
              backgroundColor: color.overlayStrong,
              borderRadius: radius.md,
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
            }}
          >
            <Icon name="restaurant" size={18} color={color.white} />
            <Text variant="footnote" color={color.white} style={{ flex: 1 }}>
              {promptText}
            </Text>
            <Pressable
              onPress={dismissTip}
              haptic={false}
              minTapTarget={false}
              accessibilityLabel="Dismiss tip"
              style={{
                paddingVertical: space.xs,
                paddingHorizontal: space.md,
                borderRadius: radius.pill,
                backgroundColor: color.overlayLineMuted,
              }}
            >
              <Text variant="label" color={color.white}>
                Got it
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Center: dashed framing guide + label + static angle caption. Never
          interactive (pointerEvents none). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space['2xl'],
        }}
      >
        <View
          style={{
            width: isRect ? 300 : 260,
            height: isRect ? 200 : 320,
            borderWidth: 2,
            borderColor: color.overlayLine,
            borderStyle: 'dashed',
            // ellipse ≈ fully-rounded (radius.full clamps to half the short side);
            // rectangle uses the standard card radius.
            // ponytail: dashed + large radius can render solid on some Android
            // builds — fine on the iOS target (expo-camera / SF Symbols).
            borderRadius: isRect ? radius.lg : radius.full,
          }}
        />
        <View style={{ alignItems: 'center', gap: space.xs }}>
          <Text variant="bodyMedium" color={color.white}>
            {guideLabel}
          </Text>
          <Text variant="footnote" color={color.overlayLine}>
            Hold camera at 45°
          </Text>
        </View>
      </View>
    </View>
  );
}
