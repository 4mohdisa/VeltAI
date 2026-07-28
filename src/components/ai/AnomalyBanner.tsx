// AnomalyBanner — a compact amber banner shown when the insights feed carries
// anomalies. Slides down + fades in on appear, opens the anomalies view on tap,
// and dismisses (session-local + best-effort server) all anomalies on close.
// Self-contained: reads anomalies from useInsights. Reduce-motion aware.
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Animated, View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useInsights } from '@/lib/data/aiBrain';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { accent, color, radius, space, surface } from '@/lib/design/tokens';

export function AnomalyBanner(props: { onPress: () => void }): JSX.Element | null {
  const { anomalies, dismiss } = useInsights();
  const reduceMotion = useReduceMotion();
  const [hidden, setHidden] = useState(false);
  const [anim] = useState(() => new Animated.Value(0));

  const visible = anomalies.length > 0 && !hidden;

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 60 }).start();
  }, [visible, reduceMotion, anim]);

  if (!visible) return null;

  const text =
    anomalies.length === 1
      ? anomalies[0].title ?? 'Unusual pattern detected'
      : `${anomalies.length} unusual patterns detected`;

  const closeAll = () => {
    setHidden(true);
    anomalies.forEach((a) => dismiss(a.id, 'anomaly'));
  };

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
      }}
    >
      {/* Plain View wrapper with two SIBLING accessible controls — a labelled
          Pressable nesting another makes the inner dismiss unreachable to
          VoiceOver. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          backgroundColor: surface.card,
          borderRadius: radius.md,
          borderLeftWidth: 4,
          borderLeftColor: accent.orange,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
        }}
      >
        <Pressable
          onPress={props.onPress}
          minTapTarget={false}
          accessibilityLabel={text}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm }}
        >
          <Icon name="warning" size={18} color={accent.orange} />
          <Text variant="bodyMedium" color={color.label} style={{ flex: 1 }}>
            {text}
          </Text>
          <Icon name="chevron-forward" size={18} color={color.tertiaryLabel} />
        </Pressable>
        <Pressable onPress={closeAll} minTapTarget={false} hitSlop={10} accessibilityLabel="Dismiss">
          <Icon name="close" size={18} color={color.tertiaryLabel} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
