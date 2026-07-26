// AnomalyCard — an amber-accented sibling of InsightCard for unusual activity.
// Left orange border + warning glyph mark it as distinct. Dismiss collapses the
// card (height + opacity) before calling onDismiss. Reduce-motion aware.
import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { Animated, View, type LayoutChangeEvent } from 'react-native';

import { Card } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { accent, color, motion, space } from '@/lib/design/tokens';
import type { AIAnomaly } from '@/lib/types';

export function AnomalyCard(props: { anomaly: AIAnomaly; onDismiss: (id: string) => void }): JSX.Element {
  const { anomaly, onDismiss } = props;
  const reduceMotion = useReduceMotion();

  const [collapse] = useState(() => new Animated.Value(1));
  const heightRef = useRef(0);
  const [dismissing, setDismissing] = useState(false);
  const [dismissH, setDismissH] = useState(0);

  const handleDismiss = () => {
    const h = heightRef.current;
    if (reduceMotion || !h) {
      onDismiss(anomaly.id);
      return;
    }
    setDismissH(h);
    collapse.setValue(1);
    setDismissing(true);
    Animated.timing(collapse, {
      toValue: 0,
      duration: motion.duration.fast,
      useNativeDriver: false,
    }).start(() => onDismiss(anomaly.id));
  };

  const label = anomaly.title ?? 'Unusual activity';
  const body = anomaly.body ?? 'We spotted something unusual in your recent logs.';

  const wrapStyle = dismissing
    ? {
        height: collapse.interpolate({ inputRange: [0, 1], outputRange: [0, dismissH] }),
        opacity: collapse,
        overflow: 'hidden' as const,
      }
    : undefined;

  return (
    <Animated.View
      style={wrapStyle}
      onLayout={(e: LayoutChangeEvent) => {
        if (!dismissing) heightRef.current = e.nativeEvent.layout.height;
      }}
    >
      <Card style={{ borderLeftWidth: 4, borderLeftColor: accent.orange }}>
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="warning" size={16} color={accent.orange} />
            <Text variant="label" color={color.label} style={{ flex: 1 }}>
              {label}
            </Text>
            <Pressable onPress={handleDismiss} minTapTarget={false} hitSlop={10} accessibilityLabel="Dismiss">
              <Icon name="close" size={18} color={color.tertiaryLabel} />
            </Pressable>
          </View>
          <Text variant="callout" color={color.secondaryLabel}>
            {body}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}
