// MorningBriefCard — self-contained morning brief surface. An elevated white
// card headed by the AI sparkle in categoryAccent.ai (the glyph is the only
// tinted element; the surface stays white). Fades in on mount,
// shows the first sentence collapsed, and expands (height + opacity) on "Read
// more" while marking the brief engaged once. Degrades to a skeleton while
// loading and renders nothing when there's no brief. Reduce-motion aware.
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';
import type { JSX } from 'react';
import { Animated, View, type LayoutChangeEvent } from 'react-native';

import { Badge, Card, Skeleton } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api } from '@/lib/api';
import { useMorningBrief } from '@/lib/data/aiBrain';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { categoryAccent, color, motion, space } from '@/lib/design/tokens';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function MorningBriefCard(): JSX.Element | null {
  const { brief, loading } = useMorningBrief();
  const reduceMotion = useReduceMotion();

  const [fade] = useState(() => new Animated.Value(0));
  const [expand] = useState(() => new Animated.Value(0));
  const collapsedHRef = useRef(0);
  const engagedRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [startH, setStartH] = useState(0);
  const [fullH, setFullH] = useState(0);

  // Feature entered — fired when a brief is actually on screen, not on mount:
  // this component renders null while loading and whenever there is no brief
  // (no consent, no data yet, AI unavailable), so a mount event would count
  // every home-screen visit as "the morning brief was used".
  const seenRef = useRef(false);
  useEffect(() => {
    if (brief && !seenRef.current) {
      seenRef.current = true;
      track('feature_used', { name: 'morning_brief' });
    }
  }, [brief]);

  // Fade in over ~400ms on mount (opacity only → native driver).
  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: motion.duration.medium,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, fade]);

  const doExpand = () => {
    if (expanded) return;
    if (!engagedRef.current && brief) {
      engagedRef.current = true;
      // Best-effort analytics ping — swallow rejection (matches aiBrain.ts).
      void api.ai.markBriefEngaged(brief.id).catch(() => undefined);
    }
    if (reduceMotion || !fullH) {
      setExpanded(true);
      return;
    }
    setStartH(collapsedHRef.current);
    setExpanded(true);
    setAnimating(true);
    expand.setValue(0);
    Animated.timing(expand, {
      toValue: 1,
      duration: motion.duration.snap,
      useNativeDriver: false,
    }).start(() => setAnimating(false));
  };

  if (loading) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.sm }}>
          <Skeleton width="90%" height={16} />
          <Skeleton width="70%" height={16} />
        </View>
      </Card>
    );
  }
  if (!brief) return null;

  const parts = brief.brief.split('. ');
  const hasMore = parts.length > 1;
  const collapsedText = hasMore ? `${parts[0]}…` : brief.brief;

  // During the expand animation, constrain + animate the text height (non-native);
  // before and after, leave the height natural.
  const textStyle = animating
    ? {
        height: expand.interpolate({ inputRange: [0, 1], outputRange: [startH || fullH, fullH] }),
        opacity: expand.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        overflow: 'hidden' as const,
      }
    : undefined;

  return (
    <Animated.View style={{ opacity: fade }}>
      <Card variant="elevated">
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="sparkles" size={17} color={categoryAccent.ai} />
            <Text variant="label" color={color.secondaryLabel}>
              {greeting()}
            </Text>
          </View>

          <Animated.View
            style={textStyle}
            onLayout={(e: LayoutChangeEvent) => {
              if (!expanded) collapsedHRef.current = e.nativeEvent.layout.height;
            }}
          >
            <Text variant="body" color={color.label}>
              {expanded ? brief.brief : collapsedText}
            </Text>
          </Animated.View>

          {/* Hidden measurer: full-text height, captured before expanding. */}
          {hasMore && !expanded ? (
            <View style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }} pointerEvents="none">
              <Text variant="body" color={color.label} onLayout={(e) => setFullH(e.nativeEvent.layout.height)}>
                {brief.brief}
              </Text>
            </View>
          ) : null}

          {brief.category ? <Badge label={brief.category} /> : null}

          {hasMore && !expanded ? (
            <Pressable
              onPress={doExpand}
              haptic={false}
              minTapTarget={false}
              hitSlop={12}
              style={{ alignSelf: 'flex-start' }}
              accessibilityLabel="Read more"
            >
              <Text variant="label" color={color.primary}>
                Read more
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}
