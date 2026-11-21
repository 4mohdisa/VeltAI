// The Summary detail-view chrome: one kicker + hero stat + column plot + axis +
// Breakdown list, shared by all four detail routes (`/energy`,
// `/dashboard/week`, `/dashboard/training`, `/dashboard/nutrition`).
//
// This file is the extraction the four routes' `ponytail:` comments named. It
// was lifted VERBATIM from those routes — the four copies were byte-identical
// (comments aside), so nothing here is a redesign and no caller had to change
// what it renders. What differs between the four is what they FEED these
// components: the columns, the scale ceiling, the axis labels, the empty states
// and the footnotes all stay in the route, because that is the binding, not the
// chrome.
//
// No new dependency: bars are plain Views, same as MuscleChart.
import { useEffect, type JSX } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ProgressBar } from '@/components/display/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, layout, motion, opacity, radius, space } from '@/lib/design/tokens';
import { dayMonth } from '@/lib/data/energyRange';

/** Plot heights composed from the spacing scale (176 / 120 in the design). */
export const HERO_H = space['5xl'] * 2 + space['4xl'];
export const SEC_H = space['5xl'] + space['4xl'] + space.sm;
/** Default right gutter the scale labels sit in, clear of the bars. Plot and
 *  Axis share it so their columns line up; a route that overrides it passes the
 *  same `gutterWidth` to both. */
const GUTTER = space['4xl'];
/** Width an axis label may take, centred on its column — room for "27 Aug". */
const AXIS_LABEL_W = space['4xl'];
/** How much later each column starts growing than the one before it (Summary bundle :691). */
const GROW_STAGGER_MS = 60;
/** The design's tight stat line: stat-to-sub gap, stat-to-unit gap and stat tracking (Summary bundle :236-238). */
const TIGHT_STAT_GAP = 3;
const TIGHT_STAT_UNIT_GAP = 7;
const TIGHT_STAT_TRACKING = -1;
/** The design's hero chart title: 500 14/18, which no type token covers (Summary bundle :245). */
const HERO_TITLE = { fontSize: 14, lineHeight: 18 };
/** The design's Breakdown row: dot size and dot-to-label gap, and a 500 15/20
 *  label, none of which a token covers (Summary bundle :326-329). */
const BREAKDOWN_DOT = 9;
const BREAKDOWN_GAP = 9;
const BREAKDOWN_LABEL = { fontWeight: '500', lineHeight: 20 } as const;

/** `w` fixes a bar's width, centred in its column; without it the bar fills the column. */
export type Bar = { h: number; bottom?: number; tint: string; w?: number };
export type Col = { key: string; bars: Bar[]; dim?: boolean };

/** A column chart with two gridlines: the scale ceiling and the baseline, plus
 *  a labelled halfway line when `mid` is given. A column with no bars is a
 *  genuine gap — the day has no computable value. `dimOpacity` is how far a
 *  `dim` column fades. `gridInset` stops the gridlines where the columns stop,
 *  clear of the gutter. `floor` labels the baseline and centres every value
 *  label on its line, as the design's Daily net does. `barWidthRatio` sizes
 *  every bar without its own `w` to that share of its column, centred; without
 *  it those bars fill the column. `gap` spaces the columns, and the bars within
 *  a column; the day letters and tap targets a caller lays over the columns must
 *  use the same value to stay aligned. `gutterWidth` sets the right gutter, and
 *  `scaleLabelWidth` the box each scale value label sits in; both default to the
 *  gutter, and an Axis under the Plot must get the same `gutterWidth`.
 *  `barRadius` rounds each bar's top and bottom corners separately; without it
 *  every corner is `radius.sm`. `growIn` grows each bar from 0 to its height
 *  over the design's slow duration, each column `GROW_STAGGER_MS` after the one
 *  before; Reduce Motion skips it. */
export function Plot({
  cols,
  height,
  ceiling,
  mid,
  floor,
  gridInset = false,
  barWidthRatio,
  gap = space.xs,
  summary,
  dimOpacity = opacity.medium,
  gutterWidth = GUTTER,
  scaleLabelWidth = GUTTER,
  barRadius,
  growIn = false,
}: {
  cols: Col[];
  height: number;
  ceiling: string;
  mid?: string;
  floor?: string;
  gridInset?: boolean;
  barWidthRatio?: number;
  gap?: number;
  summary: string;
  dimOpacity?: number;
  gutterWidth?: number;
  scaleLabelWidth?: number;
  barRadius?: { top: number; bottom: number };
  growIn?: boolean;
}): JSX.Element {
  const barCorners = barRadius
    ? {
        borderTopLeftRadius: barRadius.top,
        borderTopRightRadius: barRadius.top,
        borderBottomLeftRadius: barRadius.bottom,
        borderBottomRightRadius: barRadius.bottom,
      }
    : { borderRadius: radius.sm };
  const lineRight = gridInset ? gutterWidth : 0;
  const onLine = floor !== undefined ? { transform: [{ translateY: '-50%' as const }] } : null;
  return (
    <View accessible accessibilityLabel={summary} style={{ height }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: lineRight,
          top: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: lineRight,
          bottom: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <Text
        variant="caption"
        color={color.tertiaryLabel}
        style={{ position: 'absolute', right: 0, top: 0, width: scaleLabelWidth, textAlign: 'right', ...onLine }}
      >
        {ceiling}
      </Text>
      {mid !== undefined ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: lineRight,
              top: height / 2,
              borderTopWidth: layout.hairline,
              borderTopColor: color.light2,
            }}
          />
          <Text
            variant="caption"
            color={color.tertiaryLabel}
            style={{ position: 'absolute', right: 0, top: height / 2, width: scaleLabelWidth, textAlign: 'right', ...onLine }}
          >
            {mid}
          </Text>
        </>
      ) : null}
      {floor !== undefined ? (
        <Text
          variant="caption"
          color={color.tertiaryLabel}
          style={{ position: 'absolute', right: 0, top: height, width: scaleLabelWidth, textAlign: 'right', ...onLine }}
        >
          {floor}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap,
          height: '100%',
          paddingRight: gutterWidth,
        }}
      >
        {cols.map((c, ci) => (
          <View
            key={c.key}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap,
              ...(barWidthRatio !== undefined || c.bars.some((b) => b.w !== undefined)
                ? { justifyContent: 'center' as const }
                : null),
              opacity: c.dim ? dimOpacity : opacity.full,
            }}
          >
            {c.bars.map((b, i) => {
              const barStyle: ViewStyle = {
                ...(b.w !== undefined
                  ? { width: b.w }
                  : barWidthRatio !== undefined
                    ? { width: `${Math.round(barWidthRatio * 100)}%` as const }
                    : { flex: 1 }),
                height: b.h,
                marginBottom: b.bottom ?? 0,
                ...barCorners,
                backgroundColor: b.tint,
              };
              return growIn ? (
                <GrowBar key={i} style={barStyle} height={b.h} delay={ci * GROW_STAGGER_MS} />
              ) : (
                <View key={i} style={barStyle} />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

/** A bar that grows from 0 to `height` after `delay`, over motion.duration.slow
 *  on motion.easing.standard's bezier. */
function GrowBar({ style, height, delay }: { style: ViewStyle; height: number; delay: number }): JSX.Element {
  const reduceMotion = useReduceMotion();
  const grown = useSharedValue(0);

  useEffect(() => {
    grown.value = reduceMotion
      ? height
      : withDelay(delay, withTiming(height, { duration: motion.duration.slow, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
  }, [height, delay, reduceMotion, grown]);

  const heightStyle = useAnimatedStyle(() => ({ height: grown.value }));

  return <Animated.View style={[style, heightStyle]} />;
}

/** The x-axis under a Plot. Labels align with the columns, gutter included, so
 *  `gap` must match the Plot's. `labelColor` and `labelLineHeight` restyle the
 *  labels; without them they are tertiary label at the caption line height.
 *  `labelFillsColumn` sizes each label to its column, cut with an ellipsis,
 *  instead of the fixed box that may overflow it. */
export function Axis({
  labels,
  gutterWidth = GUTTER,
  gap = space.xs,
  labelColor = color.tertiaryLabel,
  labelLineHeight,
  labelFillsColumn = false,
}: {
  labels: string[];
  gutterWidth?: number;
  gap?: number;
  labelColor?: string;
  labelLineHeight?: number;
  labelFillsColumn?: boolean;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap, paddingRight: gutterWidth }}>
      {labels.map((l, i) => (
        // Each label is centred on its column but may overflow it: a 14-day
        // axis marks only 4 of its columns, and one column is far narrower than
        // "27 Aug", which used to clip to "2…". Neighbouring marks sit several
        // columns apart, so the overflow never collides.
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <Text
            variant="caption"
            color={labelColor}
            numberOfLines={1}
            ellipsizeMode={labelFillsColumn ? 'tail' : undefined}
            style={{
              width: labelFillsColumn ? '100%' : AXIS_LABEL_W,
              textAlign: 'center',
              ...(labelLineHeight !== undefined && { lineHeight: labelLineHeight }),
            }}
          >
            {l}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The header line inside a chart card: what the chart shows, and its range.
 *  `hero` uses the design's hero header: a smaller title, centred on the range. */
export function ChartHeader({ title, note, hero = false }: { title: string; note: string; hero?: boolean }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: hero ? 'center' : 'baseline', gap: space.sm }}>
      <Text variant="bodyMedium" color={color.label} style={{ flex: 1, ...(hero ? HERO_TITLE : null) }} numberOfLines={1}>
        {title}
      </Text>
      <Text variant="caption" color={color.tertiaryLabel}>
        {note}
      </Text>
    </View>
  );
}

/** Coloured dot + uppercase category over the screen title (the design's kicker). */
export function KickerTitle({ kicker, title, tint }: { kicker: string; title: string; tint: string }): JSX.Element {
  return (
    <View style={{ gap: space.xs, paddingHorizontal: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: tint }} />
        <Text variant="label" color={tint} style={{ textTransform: 'uppercase', letterSpacing: 1.1 }}>
          {kicker}
        </Text>
      </View>
      <Text variant="title1" color={color.label} accessibilityRole="header" style={{ letterSpacing: -0.6 }}>
        {title}
      </Text>
    </View>
  );
}

/** The headline number + its unit, with an optional sub-line. `tight` uses the
 *  design's closer gaps and tighter stat tracking. */
export function StatLine({
  value,
  unit,
  sub,
  tight = false,
}: {
  value: string;
  unit: string;
  sub?: string;
  tight?: boolean;
}): JSX.Element {
  return (
    <View style={{ gap: tight ? TIGHT_STAT_GAP : space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: tight ? TIGHT_STAT_UNIT_GAP : space.sm, flexWrap: 'wrap' }}>
        <Text variant="statLarge" color={color.label} style={tight ? { letterSpacing: TIGHT_STAT_TRACKING } : undefined}>
          {value}
        </Text>
        <Text variant="callout" color={color.secondaryLabel}>
          {unit}
        </Text>
      </View>
      {sub ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

/** One Breakdown line: dot · label + sub · value · unit, over a progress track. */
export function BreakdownRow({
  tint,
  label,
  sub,
  value,
  unit,
  fraction,
}: {
  tint: string;
  label: string;
  sub?: string;
  value: string;
  unit?: string;
  fraction: number;
}): JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={`${label}${sub ? `, ${sub}` : ''}, ${value}${unit ? ` ${unit}` : ''}`}
      style={{ gap: space.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: BREAKDOWN_GAP }}>
        <View style={{ width: BREAKDOWN_DOT, height: BREAKDOWN_DOT, borderRadius: radius.full, backgroundColor: tint }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="callout" color={color.label} style={BREAKDOWN_LABEL} numberOfLines={1}>
            {label}
          </Text>
          {sub ? (
            <Text variant="caption" color={color.tertiaryLabel} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
        <Text variant="statSmall" color={color.label}>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" color={color.tertiaryLabel}>
            {unit}
          </Text>
        ) : null}
      </View>
      <ProgressBar value={fraction} tint={tint} track={color.light2} />
    </View>
  );
}

/** Only the first, a middle pair and the last date are labelled — 14 dates do
 *  not fit, and the design labels four of them. */
export function heroLabels(dates: string[]): string[] {
  const marks = new Set([0, Math.floor(dates.length / 3), Math.floor((dates.length * 2) / 3), dates.length - 1]);
  return dates.map((d, i) => (marks.has(i) ? dayMonth(d) : ''));
}
