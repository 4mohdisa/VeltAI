// FloatingHeader — the design file's top treatment: no nav bar, no border, no
// title. Just a blurred strip that content scrolls under, tinted with the screen
// background and fading out downwards, so the eyebrow + large title (which live
// inside the scroll) stay legible as they pass beneath it.
//
// The prototype draws it as
//   backdrop-filter: blur(18px) saturate(1.4)
//   background: linear-gradient(to bottom, backgroundAlt 86%, backgroundAlt 20%)
//   mask-image: linear-gradient(to bottom, #000 56%, transparent)
// React Native has no backdrop mask, so this is the documented approximation: a
// BlurView covering the solid part of the mask (the top 56%), with an SVG
// gradient painting the tint over the full height. The soft lower edge of the
// blur is lost; the tint fade carries the transition instead.
//
// Purely decorative — pointerEvents="none" so the scroll underneath keeps every
// touch, and nothing here is exposed to VoiceOver.
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { surface } from '@/lib/design/tokens';
import { useReduceTransparency } from '@/lib/design/reduceTransparency';

/** Height of the strip, measured from the very top of the screen (status bar
 *  included) — the prototype's 82px on a 402x874 frame. */
export const FLOATING_HEADER_HEIGHT = 82;

/** Fraction of the height the blur actually covers — the mask's solid part. */
const BLUR_FRACTION = 0.56;

export type FloatingHeaderProps = {
  /** Total strip height. Defaults to the design's 82. */
  height?: number;
};

export function FloatingHeader({ height = FLOATING_HEADER_HEIGHT }: FloatingHeaderProps) {
  const reduceTransparency = useReduceTransparency();

  // HIG §11: with Reduce Transparency on, a translucent strip becomes an opaque
  // one of the same height rather than disappearing — content must never scroll
  // illegibly under the status bar.
  if (reduceTransparency) {
    return (
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height,
          backgroundColor: surface.backgroundAlt,
        }}
      />
    );
  }

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
    >
      {/* Tint: backgroundAlt at 86% fading to 20% down the full height. */}
      <Svg width="100%" height={height} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="lumeHeaderFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={surface.backgroundAlt} stopOpacity={0.86} />
            <Stop offset="1" stopColor={surface.backgroundAlt} stopOpacity={0.2} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={height} fill="url(#lumeHeaderFade)" />
      </Svg>
      {/* Blur over the masked (solid) portion only. */}
      <BlurView
        tint="light"
        intensity={30}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.round(height * BLUR_FRACTION) }}
      />
    </View>
  );
}
