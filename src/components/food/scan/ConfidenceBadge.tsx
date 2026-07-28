// ConfidenceBadge — the scan's confidence readout with a "Why?" disclosure.
// Colour encodes the score band (functional use of accent, per the token rules):
// >=85 green, 60–84 yellow, <60 red. Tapping "Why?" expands the contributing
// factors, each with its signed point value. When the caller has no breakdown
// (the backend returns only a scalar 0..1 today) we SYNTHESISE one deterministically
// from the score: three fixed positive contributions that sum to 100, minus a
// single band-specific penalty that brings the total to the score — so the
// factors always sum to the displayed number and the signs stay sensible.
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { accent, color, motion, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import type { ConfidenceFactor } from '@/lib/types';

export type ConfidenceBadgeProps = {
  score: number; // 0..100
  breakdown?: ConfidenceFactor[];
};

function scoreColor(score: number): string {
  if (score >= 85) return accent.green;
  if (score >= 60) return accent.yellow;
  return accent.red;
}

function synthesizeBreakdown(score: number): ConfidenceFactor[] {
  const s = Math.round(Math.min(100, Math.max(0, score)));
  const factors: ConfidenceFactor[] = [
    { label: 'Food identified', points: 55 },
    { label: 'Portion size estimated', points: 30 },
    { label: 'Lighting & framing', points: 15 },
  ];
  const deficit = 100 - s;
  if (deficit > 0) {
    factors.push({
      label: s >= 85 ? 'Minor portion uncertainty' : s >= 60 ? 'Single camera angle' : 'Portion & ingredients unclear',
      points: -deficit,
    });
  }
  return factors;
}

const signed = (p: number): string => `${p >= 0 ? '+' : '−'}${Math.abs(p)}`;

export function ConfidenceBadge({ score, breakdown }: ConfidenceBadgeProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReduceMotion();
  const pct = Math.round(Math.min(100, Math.max(0, score)));
  const tint = scoreColor(pct);
  const factors = breakdown && breakdown.length > 0 ? breakdown : synthesizeBreakdown(pct);

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tint }} />
        <Text variant="footnote" color={color.label}>
          {pct}% confidence
        </Text>
        <Pressable
          haptic={false}
          minTapTarget={false}
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Hide confidence breakdown' : 'Why this confidence?'}
          hitSlop={12}
        >
          <Text variant="footnote" color={color.secondaryLabel}>
            {open ? 'Hide' : 'Why?'}
          </Text>
        </Pressable>
      </View>

      {open ? (
        <Animated.View
          entering={reduce ? undefined : FadeInDown.duration(motion.duration.fast)}
          style={{ gap: space.xs, paddingLeft: space.md }}
        >
          {factors.map((f, i) => (
            <View key={`${f.label}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Text variant="footnote" color={f.points >= 0 ? accent.green : accent.yellow}>
                {f.points >= 0 ? '✓' : '⚠'}
              </Text>
              <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
                {f.label}
              </Text>
              <Text variant="footnote" color={color.label}>
                {signed(f.points)}
              </Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}
