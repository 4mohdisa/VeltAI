// InsightCard — one insight in the feed. An elevated white card on the grey
// page, headed by the AI sparkle in categoryAccent.ai (the ONE tinted thing —
// the card surface itself stays white). Staggered fade-in on entrance, a
// body that collapses to a few lines with a more/less toggle, an optional type
// badge, and a dismiss control that collapses the card (height + opacity) before
// calling onDismiss. Reduce-motion aware (no entrance/exit animation).
import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { Animated, View, type LayoutChangeEvent } from 'react-native';

import { Badge, Card } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { categoryAccent, color, motion, space } from '@/lib/design/tokens';
import type { AIInsight } from '@/lib/types';

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

export function InsightCard(props: {
  insight: AIInsight;
  onDismiss: (id: string) => void;
  index?: number;
}): JSX.Element {
  const { insight, onDismiss, index = 0 } = props;
  const reduceMotion = useReduceMotion();

  const [appear] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [collapse] = useState(() => new Animated.Value(1));
  const heightRef = useRef(0);
  const [dismissing, setDismissing] = useState(false);
  const [dismissH, setDismissH] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Staggered entrance: fade + slight rise, delayed by the card's index.
  useEffect(() => {
    if (reduceMotion) {
      appear.setValue(1);
      return;
    }
    Animated.timing(appear, {
      toValue: 1,
      duration: motion.duration.fast,
      delay: Math.min(index, 5) * 50,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, appear, index]);

  const handleDismiss = () => {
    const h = heightRef.current;
    if (reduceMotion || !h) {
      onDismiss(insight.id);
      return;
    }
    setDismissH(h);
    collapse.setValue(1);
    setDismissing(true);
    Animated.timing(collapse, {
      toValue: 0,
      duration: motion.duration.fast,
      useNativeDriver: false,
    }).start(() => onDismiss(insight.id));
  };

  const wrapStyle = dismissing
    ? {
        height: collapse.interpolate({ inputRange: [0, 1], outputRange: [0, dismissH] }),
        opacity: collapse,
        overflow: 'hidden' as const,
      }
    : {
        opacity: appear,
        transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      };

  const isLong = insight.body.length > 120; // ponytail: length heuristic, swap for onTextLayout if it misfires

  return (
    <Animated.View
      style={wrapStyle}
      onLayout={(e: LayoutChangeEvent) => {
        if (!dismissing) heightRef.current = e.nativeEvent.layout.height;
      }}
    >
      <Card variant="elevated">
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="sparkles" size={17} color={categoryAccent.ai} />
            <Text variant="bodyMedium" color={color.label} numberOfLines={1} style={{ flex: 1 }}>
              {insight.title}
            </Text>
            <Pressable onPress={handleDismiss} minTapTarget={false} hitSlop={10} accessibilityLabel="Dismiss insight">
              <Icon name="close" size={18} color={color.tertiaryLabel} />
            </Pressable>
          </View>

          <Text variant="callout" color={color.secondaryLabel} numberOfLines={expanded ? undefined : 3}>
            {insight.body}
          </Text>

          {isLong ? (
            <Pressable
              onPress={() => setExpanded((v) => !v)}
              haptic={false}
              minTapTarget={false}
              hitSlop={12}
              style={{ alignSelf: 'flex-start' }}
              accessibilityLabel={expanded ? 'Show less' : 'Show more'}
            >
              <Text variant="label" color={color.primary}>
                {expanded ? 'less' : 'more'}
              </Text>
            </Pressable>
          ) : null}

          {insight.type ? <Badge label={capitalize(insight.type)} /> : null}
        </View>
      </Card>
    </Animated.View>
  );
}
