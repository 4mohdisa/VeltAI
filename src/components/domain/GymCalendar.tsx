// GymCalendar — the design's Gym month calendar (V7, GymScreen.dc.html): the
// month's name with ‹ › paging, an M–S header, dated cells aligned to their
// weekday and shaded on the design's four-step ramp by minutes trained, today
// ringed, and the month's real total beneath with a Less → More key.
//
// Presentational: the cells come from monthView() (lib/data/gymRange.ts), which
// builds them from the sessions the server returned for this month plus one just
// logged on this device — never from a fixed 30-slot index. That index is what
// let a real streak sit beside a false "0 sessions" (DECISIONS.md, V7).
//
// One addition the design does not draw: a freeze day. The design's ramp has no
// freeze state, but a day the streak's freeze covered is a real event the user
// chose, so it gets the light3 fill the grid used before and says so to
// VoiceOver. Colour never carries it alone — the label does.
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { fromIso } from '@/lib/data/foodDays';
import type { MonthDay } from '@/lib/data/gymRange';
import { categoryAccent, color, layout, ROUNDED_FACE_BY_WEIGHT, space } from '@/lib/design/tokens';

// The design's own pixel values for this component. No token scale covers them;
// they are named so any drift from the design is a one-line diff.
export const CELL_GAP = 5;
export const CELL_RADIUS = 7;
export const SWATCH = 11;
export const SWATCH_RADIUS = 3;
export const NAV_SIZE = 32;
export const ROW_GAP = 6;
const CHEVRON = 14;
const DAY_FONT = 10;
const DAY_LINE = 12;
const DISABLED_OPACITY = 0.3;
const NAV_PRESSED_OPACITY = 0.5;

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** `a` blended toward `b` as CSS `color-mix(in srgb, a p, b)` — the design's
 *  ramp is written that way, and React Native has no color-mix. */
export function mixHex(a: string, b: string, p: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mixed = [0, 1, 2].map((i) =>
    Math.round(channel(a, i) * p + channel(b, i) * (1 - p))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${mixed.join('')}`;
}

/** The design's RAMP: light-2 (no training), the streak accent mixed 32% and 66%
 *  into light-1, then the accent itself. Indexed by `MonthDay.level`. */
export const RAMP = [
  color.light2,
  mixHex(categoryAccent.streak, color.light1, 0.32),
  mixHex(categoryAccent.streak, color.light1, 0.66),
  categoryAccent.streak,
] as const;

function dayLabel(d: MonthDay): string {
  const when = fromIso(d.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const suffix = d.today ? ', today' : '';
  if (d.future) return `${when}, upcoming`;
  if (d.frozen) return `${when}, streak freeze${suffix}`;
  if (d.sessions === 0) return `${when}, no session${suffix}`;
  const count = d.sessions === 1 ? '1 session' : `${d.sessions} sessions`;
  const length = d.minutes == null ? 'duration not recorded' : `${d.minutes} minutes`;
  return `${when}, ${count}, ${length}${suffix}`;
}

function Day({ d }: { d: MonthDay }) {
  const backgroundColor = d.future ? color.white : d.frozen ? color.light3 : RAMP[d.level];
  const border = d.today
    ? { borderWidth: layout.borderWidth * 2, borderColor: color.primary }
    : d.future
      ? { borderWidth: layout.borderWidth, borderColor: color.light2 }
      : null;
  return (
    <View
      accessible
      accessibilityLabel={dayLabel(d)}
      testID={`gym-day-${d.date}`}
      style={[
        {
          flex: 1,
          aspectRatio: 1,
          borderRadius: CELL_RADIUS,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        border,
      ]}
    >
      {/* The design's 600 10/12 rounded digit. statSmall is a rounded variant, so
          only the face and size are overridden and no fontWeight is set. */}
      <Text
        variant="statSmall"
        color={d.future ? color.light3 : color.label}
        style={{ fontFamily: ROUNDED_FACE_BY_WEIGHT['600'], fontSize: DAY_FONT, lineHeight: DAY_LINE }}
      >
        {d.day}
      </Text>
    </View>
  );
}

export type GymCalendarProps = {
  /** "September", or "December 2025" outside the current year (monthTitle). */
  title: string;
  /** monthView(...).cells — leading nulls, then one cell per day. */
  cells: (MonthDay | null)[];
  /** The line under the grid. The screen passes a loading or error message
   *  instead of a count while the month is not known. */
  summary: string;
  onPrev: () => void;
  onNext: () => void;
  /** False on the current month: there is nothing to page forward to. */
  canNext: boolean;
};

export function GymCalendar({ title, cells, summary, onPrev, onNext, canNext }: GymCalendarProps) {
  const weeks: (MonthDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += WEEKDAYS.length) weeks.push(cells.slice(i, i + WEEKDAYS.length));

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: ROW_GAP }}>
        <Text variant="bodyMedium" color={color.label} accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </Text>
        <Pressable
          onPress={onPrev}
          haptic={false}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={({ pressed }) => ({
            width: NAV_SIZE,
            height: NAV_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? NAV_PRESSED_OPACITY : 1,
          })}
        >
          <Icon name="chevron-back" size={CHEVRON} color={color.secondaryLabel} />
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canNext}
          haptic={false}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canNext }}
          style={({ pressed }) => ({
            width: NAV_SIZE,
            height: NAV_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? NAV_PRESSED_OPACITY : canNext ? 1 : DISABLED_OPACITY,
          })}
        >
          <Icon name="chevron-forward" size={CHEVRON} color={color.secondaryLabel} />
        </Pressable>
      </View>

      <View style={{ gap: CELL_GAP }}>
        <View style={{ flexDirection: 'row', gap: CELL_GAP }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} variant="caption" color={color.tertiaryLabel} style={{ flex: 1, textAlign: 'center' }}>
              {w}
            </Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap: CELL_GAP }}>
            {Array.from({ length: WEEKDAYS.length }, (_, i) => {
              const d = week[i];
              // Leading days of the previous month and the tail of the last week
              // hold their column empty so every cell keeps the same edge length.
              return d ? <Day key={d.date} d={d} /> : <View key={`pad-${wi}-${i}`} style={{ flex: 1, aspectRatio: 1 }} />;
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: ROW_GAP }}>
        <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
          {summary}
        </Text>
        <View
          accessible
          accessibilityLabel="Shading runs from less to more training"
          style={{ flexDirection: 'row', alignItems: 'center', gap: ROW_GAP }}
        >
          <Text variant="caption" color={color.tertiaryLabel}>
            Less
          </Text>
          {RAMP.map((bg) => (
            <View key={bg} style={{ width: SWATCH, height: SWATCH, borderRadius: SWATCH_RADIUS, backgroundColor: bg }} />
          ))}
          <Text variant="caption" color={color.tertiaryLabel}>
            More
          </Text>
        </View>
      </View>
    </View>
  );
}
