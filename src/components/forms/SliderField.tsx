// SliderField — a controlled slider built on gesture-handler + reanimated
// (no extra native dep). Drag the thumb or use VoiceOver increment/decrement.
// Snaps to `step`, clamps to [min, max], and reports via onValueChange.
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

const THUMB = 28;
const TRACK_HEIGHT = 6;

export type SliderFieldProps = FieldShellProps & {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  testID?: string;
};

export function SliderField({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  formatValue,
  label,
  helper,
  error,
  required,
  disabled,
  testID,
}: SliderFieldProps) {
  const [width, setWidth] = useState(0);
  const usable = Math.max(0, width - THUMB);
  const frac = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;

  const startFrac = useSharedValue(frac);
  const curFrac = useSharedValue(frac);
  // Keep the worklet value in sync with the controlled prop.
  curFrac.value = frac;

  const report = (f: number) => {
    const raw = min + f * (max - min);
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, snapped));
    if (clamped !== value) onValueChange(clamped);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      startFrac.value = curFrac.value;
    })
    .onUpdate((e) => {
      if (usable <= 0) return;
      let f = startFrac.value + e.translationX / usable;
      f = Math.min(1, Math.max(0, f));
      curFrac.value = f;
      runOnJS(report)(f);
    });

  const thumbStyle = useAnimatedStyle(() => ({ left: curFrac.value * usable }));
  const fillStyle = useAnimatedStyle(() => ({ width: curFrac.value * usable + THUMB / 2 }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const display = formatValue ? formatValue(value) : String(value);

  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <View style={{ gap: space.sm }}>
        <Text variant="statSmall" color={disabled ? color.gray400 : color.black}>
          {display}
        </Text>
        <GestureDetector gesture={pan}>
          <View
            onLayout={onLayout}
            testID={testID}
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityValue={{ min, max, now: value, text: display }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') {
                onValueChange(Math.min(max, value + step));
              } else if (event.nativeEvent.actionName === 'decrement') {
                onValueChange(Math.max(min, value - step));
              }
            }}
            style={{ height: THUMB, justifyContent: 'center' }}
          >
            {/* track */}
            <View
              style={{
                height: TRACK_HEIGHT,
                borderRadius: radius.full,
                backgroundColor: color.gray200,
              }}
            />
            {/* fill */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  height: TRACK_HEIGHT,
                  borderRadius: radius.full,
                  backgroundColor: disabled ? color.gray300 : color.black,
                },
                fillStyle,
              ]}
            />
            {/* thumb */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: THUMB,
                  height: THUMB,
                  borderRadius: radius.full,
                  backgroundColor: color.white,
                  borderWidth: 2,
                  borderColor: disabled ? color.gray300 : color.black,
                },
                thumbStyle,
              ]}
            />
          </View>
        </GestureDetector>
      </View>
    </FieldShell>
  );
}
