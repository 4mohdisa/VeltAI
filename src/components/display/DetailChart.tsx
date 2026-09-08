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
import type { JSX } from 'react';
import { View } from 'react-native';

import { ProgressBar } from '@/components/display/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { color, layout, opacity, radius, space } from '@/lib/design/tokens';
import { dayMonth } from '@/lib/data/energyRange';

/** Plot heights composed from the spacing scale (176 / 120 in the design). */
export const HERO_H = space['5xl'] * 2 + space['4xl'];
export const SEC_H = space['5xl'] + space['4xl'] + space.sm;
/** Right gutter the scale ceiling label sits in, clear of the bars. */
export const GUTTER = space['4xl'];

export type Bar = { h: number; bottom?: number; tint: string };
export type Col = { key: string; bars: Bar[]; dim?: boolean };

/** A column chart with two gridlines: the scale ceiling and the baseline. A
 *  column with no bars is a genuine gap — the day has no computable value. */
export function Plot({
  cols,
  height,
  ceiling,
  summary,
}: {
  cols: Col[];
  height: number;
  ceiling: string;
  summary: string;
}): JSX.Element {
  return (
    <View accessible accessibilityLabel={summary} style={{ height }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: layout.hairline,
          borderTopColor: color.light2,
        }}
      />
      <Text
        variant="caption"
        color={color.tertiaryLabel}
        style={{ position: 'absolute', right: 0, top: 0, width: GUTTER, textAlign: 'right' }}
      >
        {ceiling}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: space.xs,
          height: '100%',
          paddingRight: GUTTER,
        }}
      >
        {cols.map((c) => (
          <View
            key={c.key}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: space.xs,
              opacity: c.dim ? opacity.medium : opacity.full,
            }}
          >
            {c.bars.map((b, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: b.h,
                  marginBottom: b.bottom ?? 0,
                  borderRadius: radius.sm,
                  backgroundColor: b.tint,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** The x-axis under a Plot. Labels align with the columns, gutter included. */
export function Axis({ labels }: { labels: string[] }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: space.xs, paddingRight: GUTTER }}>
      {labels.map((l, i) => (
        <Text
          key={i}
          variant="caption"
          color={color.tertiaryLabel}
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'center' }}
        >
          {l}
        </Text>
      ))}
    </View>
  );
}

/** The header line inside a chart card: what the chart shows, and its range. */
export function ChartHeader({ title, note }: { title: string; note: string }): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
      <Text variant="bodyMedium" color={color.label} style={{ flex: 1 }} numberOfLines={1}>
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
    <View style={{ gap: space.xs, paddingBottom: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
        <Text variant="label" color={tint} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {kicker}
        </Text>
      </View>
      <Text variant="title1" color={color.label} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** The headline number + its unit, with an optional sub-line. */
export function StatLine({ value, unit, sub }: { value: string; unit: string; sub?: string }): JSX.Element {
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' }}>
        <Text variant="statLarge" color={color.label}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="callout" color={color.label} numberOfLines={1}>
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
