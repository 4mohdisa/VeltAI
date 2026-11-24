// ConfidenceBadge — the scan's confidence readout with a "Why?" disclosure.
//
// Colour encodes the SERVER's band (functional use of accent, per the token
// rules): High green, Medium yellow, Low red. The thresholds live in
// @/lib/food/confidence, which mirrors the Go pipeline. This component holds no
// thresholds of its own — it used to (green >=85 / amber >=60), which made
// green unreachable and painted a server-"High" scan red.
//
// Tapping "Why?" expands the factors the SERVER computed and stored in
// scan_results.confidence.factors, each with its signed point value. This
// component used to invent that list from the score alone — three fixed
// positives and a band-specific penalty, chosen so the rows summed to the
// displayed number — on the false premise, stated in this file's own header,
// that the backend returned only a scalar. The backend returns score, label AND
// factors (src/lib/api.ts ScanConfidence) and always has. A provenance
// disclosure containing invented provenance is the sharpest contradiction this
// product can ship, so when there are no server factors we say so instead.
// src/__tests__/scanConfidence.test.ts fails if the invented strings return.
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { accent, color, motion, radius, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { displayBand, type ConfidenceBand } from '@/lib/food/confidence';
import type { ScanConfidenceFactor } from '@/lib/api';

export type ConfidenceBadgeProps = {
  score: number; // 0..100
  /** The server's own label, when the payload carried one. */
  label?: string;
  /** scan_results.confidence.factors — the server's real breakdown. */
  breakdown?: ScanConfidenceFactor[];
};

function bandColor(band: ConfidenceBand): string {
  if (band === 'High') return accent.green;
  if (band === 'Medium') return accent.yellow;
  return accent.red;
}

const BAND_KEY: Record<ConfidenceBand, string> = {
  High: 'labelScan.confidenceHigh',
  Medium: 'labelScan.confidenceMedium',
  Low: 'labelScan.confidenceLow',
};

const signed = (p: number): string => `${p >= 0 ? '+' : '−'}${Math.abs(p)}`;

export function ConfidenceBadge({ score, label, breakdown }: ConfidenceBadgeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const reduce = useReduceMotion();
  const pct = Math.round(Math.min(100, Math.max(0, score)));
  const band = displayBand(label, pct);
  const tint = bandColor(band);
  const factors = breakdown ?? [];

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
        <Text variant="label" color={color.label}>
          {t(BAND_KEY[band])}
        </Text>
        <Pressable
          haptic={false}
          minTapTarget={false}
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={t(open ? 'scanCards.hideBreakdown' : 'scanCards.whyLabel')}
          hitSlop={12}
        >
          <Text variant="footnote" color={color.secondaryLabel}>
            {t(open ? 'gymSession.hide' : 'scanCards.why')}
          </Text>
        </Pressable>
      </View>

      {open ? (
        <Animated.View
          entering={reduce ? undefined : FadeInDown.duration(motion.duration.fast)}
          style={{ gap: space.xs, paddingLeft: space.md }}
        >
          {factors.length === 0 ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {t('scanCards.noBreakdown')}
            </Text>
          ) : (
            factors.map((f, i) => (
              <View key={`${f.name}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="footnote" color={f.points >= 0 ? accent.green : accent.yellow}>
                  {f.points >= 0 ? '✓' : '⚠'}
                </Text>
                <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
                  {f.message || f.name}
                </Text>
                <Text variant="footnote" color={color.label}>
                  {signed(f.points)}
                </Text>
              </View>
            ))
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}
