// ScanReviewCard — the "review before saving" card for scanned foods
// that came back READY (analyzed but not yet confirmed). Each item gets an
// editable name (tap → rename), a weight slider (with ½×/1×/2× shortcuts and a
// live calorie readout that scales linearly from the per-item estimate), an
// optional "typical for you" portion hint, and a confidence badge. The whole
// card slides up on appear. Everything below is best-effort + offline-safe:
// portion hints and calibration multipliers are fetched on mount and simply
// absent if the backend is unreachable.
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Button } from '@/components/forms/Button';
import { SliderField } from '@/components/forms/SliderField';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ScanConfidenceFactor } from '@/lib/api';
import { api } from '@/lib/api';
import { categoryAccent, color, motion, radius, shadow, space, surface } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { openFoodDetail } from '@/lib/food/detailSubject';

/** A scanned food awaiting review. Macros are the AI ESTIMATE at
 *  `estimatedWeightG`; the live UI scales them to `weightG`. */
export type ReviewItem = {
  id: string;
  name: string;
  estimatedWeightG: number;
  weightG: number;
  confidence: number; // 0..100
  scanSessionId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Multi-angle capture (Phase 13): agreement 0..1, the disagreement prompt, and
  // the other angle's total weight when the angles disagreed.
  angleAgreement?: number;
  needsConfirmation?: boolean;
  reconciliationNote?: string;
  alternateWeightG?: number;
  // Repeat-meal match (signal 5): one-tap accept of the usual portion.
  matchedMealName?: string;
  matchedMealWeightG?: number;
  // The server's confidence verdict, shown as-is by ConfidenceBadge.
  confidenceLabel?: string;
  confidenceFactors?: ScanConfidenceFactor[];
};

export type ScanReviewCardProps = {
  items: ReviewItem[];
  onWeightChange: (id: string, grams: number) => void;
  onDiscard: () => void;
  onSaveAll: () => void;
  portionHints?: Record<string, number>; // lowercased food name → typical grams
};

const STEP = 5;

function rangeFor(est: number): { min: number; max: number } {
  const min = Math.min(50, Math.round(est * 0.3));
  const max = Math.max(Math.round(est * 2.5), est + STEP);
  return { min, max };
}

function snap(value: number, min: number, max: number): number {
  const stepped = Math.round(value / STEP) * STEP;
  return Math.min(max, Math.max(min, stepped));
}

export function ScanReviewCard({
  items,
  onWeightChange,
  onDiscard,
  onSaveAll,
  portionHints,
}: ScanReviewCardProps) {
  const reduce = useReduceMotion();
  const [hints, setHints] = useState<Record<string, number>>({});
  const [calibration, setCalibration] = useState<Record<string, number>>({});
  const calibratedRef = useRef<Set<string>>(new Set());

  const namesKey = useMemo(() => items.map((i) => i.name).join('|'), [items]);

  // Fetch per-name portion memory + the global calibration table on mount / when
  // the item set changes. Best-effort: a failure just leaves the hint/factor out.
  useEffect(() => {
    let active = true;
    const names = [...new Set(items.map((i) => i.name))];
    for (const name of names) {
      api.foodLogs
        .portionMemory(name)
        .then((pm) => {
          const w = pm.typical_weight_g;
          if (active && pm.found && w != null) {
            setHints((h) => ({ ...h, [name.toLowerCase()]: w }));
          }
        })
        .catch(() => {});
    }
    api.scan
      .calibration()
      .then((cal) => {
        if (!active) return;
        const map: Record<string, number> = {};
        for (const f of cal.factors) map[f.food_name.toLowerCase()] = f.multiplier;
        setCalibration(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  // Apply the calibration multiplier to the initial weight ONCE per item, and
  // only while it's still at the untouched estimate (never override a user drag).
  useEffect(() => {
    for (const it of items) {
      if (calibratedRef.current.has(it.id)) continue;
      const mult = calibration[it.name.toLowerCase()];
      if (mult === undefined) continue;
      calibratedRef.current.add(it.id);
      if (mult !== 1 && it.weightG === it.estimatedWeightG) {
        const { min, max } = rangeFor(it.estimatedWeightG);
        const g = snap(it.estimatedWeightG * mult, min, max);
        if (g !== it.weightG) onWeightChange(it.id, g);
      }
    }
  }, [calibration, items, onWeightChange]);

  const mergedHints = { ...portionHints, ...hints };

  // Correcting the name happens in the ONE shared food-detail sheet, in review
  // mode — name only. Its macros stay out of reach here on purpose: this card
  // re-scales energy from the AI's estimate at `estimatedWeightG`, so an edited
  // calorie figure would be scaled a second time.
  const rename = (it: ReviewItem) => {
    openFoodDetail({
      mode: 'review',
      item: {
        id: it.id,
        name: it.name,
        quantityG: it.weightG,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
      },
    });
    router.push('/food/detail');
  };

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInUp.duration(motion.duration.medium)}
      style={{
        backgroundColor: surface.cardElevated,
        borderRadius: radius.xl,
        overflow: 'hidden',
        ...shadow.sm,
      }}
    >
      <View style={{ flex: 1, padding: space.xl, gap: space.lg }}>
        {/* The design's card header: one tinted glyph (this card holds a scan
            result, so the AI accent) + the card's name. The old amber left rail
            is gone — colour belongs on the glyph, never on the chrome. */}
        <CardHeaderRow title="Review before saving" icon="sparkles" tint={categoryAccent.ai} />

        {/* Multi-angle result (Phase 13): agreement line when the angles agreed;
            both estimates + a pick when they disagreed. */}
        {items[0]?.needsConfirmation && items[0].alternateWeightG != null ? (
          <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: surface.tile }}>
            <Text variant="footnote" color={color.label}>
              {items[0].reconciliationNote ?? 'Your camera angles disagree — pick the estimate that looks right.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Pressable
                haptic={false}
                minTapTarget={false}
                hitSlop={10}
                accessibilityLabel={`Keep ${Math.round(items[0].estimatedWeightG)} grams`}
                onPress={() => onWeightChange(items[0].id, items[0].estimatedWeightG)}
                style={{ paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.primary }}
              >
                <Text variant="label" color={color.onPrimary}>{`Top view: ${Math.round(items[0].estimatedWeightG)} g`}</Text>
              </Pressable>
              <Pressable
                haptic={false}
                minTapTarget={false}
                hitSlop={10}
                accessibilityLabel={`Use ${Math.round(items[0].alternateWeightG)} grams`}
                onPress={() => onWeightChange(items[0].id, items[0].alternateWeightG ?? items[0].weightG)}
                style={{ paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: surface.tile }}
              >
                <Text variant="label" color={color.label}>{`Side view: ${Math.round(items[0].alternateWeightG)} g`}</Text>
              </Pressable>
            </View>
          </View>
        ) : items[0]?.angleAgreement != null ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {`Angles agree ${Math.round(items[0].angleAgreement * 100)}% — estimate refined from multiple shots`}
          </Text>
        ) : null}

        {/* Repeat-meal match (signal 5): one-tap accept of the usual portion. */}
        {items[0]?.matchedMealName && items[0].matchedMealWeightG != null ? (
          <Pressable
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`Use your usual ${items[0].matchedMealName} portion`}
            onPress={() => onWeightChange(items[0].id, items[0].matchedMealWeightG ?? items[0].weightG)}
            style={{ padding: space.md, borderRadius: radius.md, backgroundColor: surface.tile }}
          >
            <Text variant="footnote" color={color.label}>
              {`Looks like your usual "${items[0].matchedMealName}" — tap to use ${Math.round(items[0].matchedMealWeightG)} g`}
            </Text>
          </Pressable>
        ) : null}

        {items.map((it, idx) => {
          const { min, max } = rangeFor(it.estimatedWeightG);
          const est = it.estimatedWeightG > 0 ? it.estimatedWeightG : it.weightG || 1;
          const liveCalories = Math.round((it.calories * it.weightG) / est);
          const typical = mergedHints[it.name.toLowerCase()];
          return (
            <View
              key={it.id}
              style={{
                gap: space.md,
                paddingTop: idx === 0 ? 0 : space.lg,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: surface.divider,
              }}
            >
              <Pressable
                haptic={false}
                minTapTarget={false}
                onPress={() => rename(it)}
                accessibilityRole="button"
                accessibilityLabel={`Rename ${it.name}`}
                accessibilityHint="Opens a field to correct the food name"
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}
              >
                <Text variant="bodyBold" color={color.label} style={{ flex: 1 }}>
                  {it.name}
                </Text>
                <Text variant="bodyMedium" color={color.label}>
                  {liveCalories} kcal
                </Text>
              </Pressable>

              <SliderField
                label="Weight"
                value={it.weightG}
                min={min}
                max={max}
                step={STEP}
                onValueChange={(g) => onWeightChange(it.id, g)}
                formatValue={(v) => `${v} g`}
              />

              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {(
                  [
                    { label: '½×', mult: 0.5 },
                    { label: '1×', mult: 1 },
                    { label: '2×', mult: 2 },
                  ] as const
                ).map((q) => (
                  <Pressable
                    key={q.label}
                    haptic
                    minTapTarget={false}
                    hitSlop={10}
                    onPress={() => onWeightChange(it.id, snap(it.estimatedWeightG * q.mult, min, max))}
                    accessibilityRole="button"
                    accessibilityLabel={`Set weight to ${q.label} the estimate`}
                    style={{
                      paddingVertical: space.xs,
                      paddingHorizontal: space.md,
                      borderRadius: radius.pill,
                      backgroundColor: surface.tilePressed,
                    }}
                  >
                    <Text variant="footnote" color={color.label}>
                      {q.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {typical != null ? (
                <Text variant="footnote" color={color.secondaryLabel}>
                  Typical for you: {Math.round(typical)} g
                </Text>
              ) : null}

              <ConfidenceBadge
                score={it.confidence}
                label={it.confidenceLabel}
                breakdown={it.confidenceFactors}
              />
            </View>
          );
        })}

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Button title="Discard" variant="secondary" onPress={onDiscard} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Save all items" variant="primary" onPress={onSaveAll} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
