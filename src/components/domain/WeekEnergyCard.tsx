// WeekEnergyCard — the Summary tab's "This week" card (V16, SummaryScreen.dc.html):
// an In & out / Net switch, the week's average per day, seven days of paired
// bars (eaten, burned) or signed net bars, day letters, and a readout for the
// picked day (today by default). Every value is a real server day: a day the
// server could not compute draws no burned or net bar and reads "—".
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { router, type Href } from 'expo-router';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Skeleton } from '@/components/display';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { accent, categoryAccent, color, space } from '@/lib/design/tokens';
import { burnOf, netOf } from '@/lib/data/energyRange';
import { fromIso } from '@/lib/data/foodDays';
import { axisMax, dayReadout, weekStat } from '@/lib/data/summaryCards';
import { formatNumber } from '@/lib/formatting';
import { kcalToDisplay, type EnergyUnit } from '@/lib/units';
import type { EnergyBalance } from '@/lib/api';

// The design's chart geometry for this card.
export const CHART_H = 130;
const HALF = CHART_H / 2;
export const GUTTER = 46;
const LABEL_W = 42;
export const BAR_W = 12;
export const NET_BAR_W = 16;
const BAR_GAP = 4;
const DAY_GAP = 2;
const MIN_BAR = 5;
export const DIM = 0.28;
// Fixed letters, indexed by getDay(): Hermes' toLocaleDateString ignores `weekday: 'narrow'`.
const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Mode = 'inout' | 'net';

const barH = (v: number, max: number, span: number) => (v > 0 ? Math.max(MIN_BAR, (v / max) * span) : 0);

export type WeekEnergyCardProps = {
  /** The 7-day window, oldest first. */
  days: EnergyBalance[];
  loading: boolean;
  error: boolean;
  energyUnit: EnergyUnit;
};

export function WeekEnergyCard({ days, loading, error, energyUnit }: WeekEnergyCardProps) {
  const [mode, setMode] = useState<Mode>('inout');
  const [picked, setPicked] = useState<number | null>(null);
  const show = (kcal: number) => formatNumber(kcalToDisplay(kcal, energyUnit));
  const sel = picked ?? days.length - 1;

  const header = (
    <Pressable
      onPress={() => router.push('/dashboard/week' as Href)}
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel="This week detail"
    >
      <CardHeaderRow title="This week" icon="chart.bar.fill" tint={accent.blue} chevron />
    </Pressable>
  );

  if (loading || error || days.length === 0) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          {header}
          {loading ? (
            <Skeleton width="100%" height={CHART_H} />
          ) : (
            <Text variant="callout" color={color.secondaryLabel}>
              {error ? "Couldn't load this week. Pull down to try again." : 'No days to show yet this week.'}
            </Text>
          )}
        </View>
      </Card>
    );
  }

  const stat = weekStat(days, mode);
  const goal = days[days.length - 1]?.target ?? null;
  const max = axisMax([...days.flatMap((d) => [d.calories_in, burnOf(d)]), goal], 400);
  const netMax = axisMax(days.map(netOf), 200);
  const pickedDay = days[sel];

  return (
    <Card variant="elevated">
      <View style={{ gap: space.lg }}>
        {header}

        <SegmentedField
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { label: 'In & out', value: 'inout' },
            { label: 'Net', value: 'net' },
          ]}
          variant="inset"
        />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
          <Text variant="statMedium" color={color.label}>
            {stat == null ? '—' : mode === 'net' && stat > 0 ? `+${show(stat)}` : stat < 0 ? `−${show(-stat)}` : show(stat)}
          </Text>
          <Text variant="footnote" color={color.secondaryLabel}>
            {energyUnit} {mode === 'inout' ? 'in per day' : 'net per day'}
          </Text>
        </View>

        <View style={{ gap: space.sm }}>
          <View style={{ height: CHART_H }}>
            {/* Gridlines at 0, half and the ceiling, with their values in the gutter. */}
            {[0, HALF, CHART_H].map((y, i) => (
              <View
                key={y}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: GUTTER,
                  bottom: y,
                  borderTopWidth: 1,
                  borderTopColor: mode === 'net' && i === 1 ? color.light3 : color.light2,
                }}
              />
            ))}
            {(mode === 'inout' ? [0, max / 2, max] : [-netMax, 0, netMax]).map((v, i) => (
              <Text
                key={i}
                variant="caption"
                color={color.tertiaryLabel}
                style={{ position: 'absolute', right: 0, width: LABEL_W, textAlign: 'right', bottom: i * HALF - 7 }}
              >
                {mode === 'net' && v > 0 ? `+${show(v)}` : v < 0 ? `−${show(-v)}` : show(v)}
              </Text>
            ))}
            {mode === 'inout' && goal != null ? (
              // The calorie goal as a dashed line, where there is one.
              <Svg
                style={{ position: 'absolute', left: 0, right: GUTTER, bottom: (goal / max) * CHART_H }}
                height={2}
                width="100%"
              >
                <Line x1="0" y1="1" x2="100%" y2="1" stroke={color.gray400} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.65} />
              </Svg>
            ) : null}

            <View style={{ position: 'absolute', left: 0, right: GUTTER, top: 0, bottom: 0, flexDirection: 'row', gap: DAY_GAP }}>
              {days.map((d, i) => {
                const opacity = i === sel ? 1 : DIM;
                const burned = burnOf(d);
                const net = netOf(d);
                return (
                  <Pressable
                    key={d.date}
                    onPress={() => setPicked(i)}
                    haptic={false}
                    minTapTarget={false}
                    accessibilityRole="button"
                    accessibilityLabel={`${dayReadout(d, show)} ${energyUnit}`}
                    style={{ flex: 1, height: '100%' }}
                  >
                    {mode === 'inout' ? (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: BAR_GAP }}>
                        <View style={{ width: BAR_W, height: barH(d.calories_in, max, CHART_H), backgroundColor: categoryAccent.calories, opacity, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
                        <View style={{ width: BAR_W, height: burned == null ? 0 : barH(burned, max, CHART_H), backgroundColor: accent.blue, opacity, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
                      </View>
                    ) : (
                      <View style={{ flex: 1 }}>
                        <View style={{ height: HALF, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <View style={{ width: NET_BAR_W, height: net != null && net > 0 ? barH(net, netMax, HALF) : 0, backgroundColor: categoryAccent.calories, opacity, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                        </View>
                        <View style={{ height: HALF, alignItems: 'center', justifyContent: 'flex-start' }}>
                          <View style={{ width: NET_BAR_W, height: net != null && net < 0 ? barH(-net, netMax, HALF) : 0, backgroundColor: accent.blue, opacity, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: DAY_GAP, paddingRight: GUTTER }}>
            {days.map((d, i) => (
              <Text
                key={d.date}
                variant="caption"
                color={i === sel ? color.label : color.tertiaryLabel}
                style={{ flex: 1, textAlign: 'center', fontSize: 12, lineHeight: 16, fontWeight: i === sel ? '700' : '400' }}
              >
                {DAY_LETTER[fromIso(d.date).getDay()]}
              </Text>
            ))}
          </View>
        </View>

        {pickedDay ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {`${dayReadout(pickedDay, show)} ${energyUnit}`}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
