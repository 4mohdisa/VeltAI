// GymCalendar — the design file's month heatmap, on our 30-day index-keyed
// model: a 7-column grid of rounded square cells whose FILL carries training
// (streak orange = trained), with a legend beneath.
//
// The day model stays index-keyed (`{ index, status }`) — it carries no dates,
// so the cells carry no digits and the grid is not calendar-aligned. Making it
// date-keyed is a data change, not a style one (DECISIONS.md, UI pass).
//
// Colour never carries a state on its own (HIG §8.3): a session keeps its
// checkmark and a freeze its snowflake, so the grid reads without colour.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, radius, space } from '@/lib/design/tokens';
import type { DayStatus } from '@/lib/mock/data';

/** Weeks are seven wide; cells size themselves off the card width. */
const COLUMNS = 7;

const STATUS_LABEL: Record<DayStatus, string> = {
  session: 'Session logged',
  freeze: 'Streak freeze',
  today: 'Today',
  missed: 'Missed',
  future: 'Upcoming',
};

function Cell({ status }: { status: DayStatus }) {
  const base = {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const a11y = { accessible: true, accessibilityLabel: STATUS_LABEL[status] };

  switch (status) {
    case 'session':
      return (
        <View {...a11y} style={[base, { backgroundColor: categoryAccent.streak }]}>
          <Icon name="checkmark" size={space.md} color={color.white} />
        </View>
      );
    case 'freeze':
      return (
        <View {...a11y} style={[base, { backgroundColor: color.light3 }]}>
          <Icon name="snow" size={space.md} color={color.label} />
        </View>
      );
    case 'today':
      // The selected-day ring, as the design draws it: white cell, black outline.
      return (
        <View
          {...a11y}
          style={[
            base,
            {
              backgroundColor: color.white,
              borderWidth: layout.borderWidth * 2,
              borderColor: color.primary,
            },
          ]}
        />
      );
    case 'missed':
      return <View {...a11y} style={[base, { backgroundColor: color.light2 }]} />;
    default:
      // Future days sit empty behind a hairline outline.
      return (
        <View
          {...a11y}
          style={[base, { backgroundColor: color.white, borderWidth: layout.borderWidth, borderColor: color.light2 }]}
        />
      );
  }
}

export type GymCalendarProps = {
  days: { index: number; status: DayStatus }[];
};

export function GymCalendar({ days }: GymCalendarProps) {
  const weeks: GymCalendarProps['days'][] = [];
  for (let i = 0; i < days.length; i += COLUMNS) weeks.push(days.slice(i, i + COLUMNS));
  // A short final week is padded with empty flex spacers so every cell in the
  // grid keeps the same edge length.
  const trailing = weeks.length > 0 ? COLUMNS - weeks[weeks.length - 1].length : 0;

  return (
    <View style={{ gap: space.xs }}>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', gap: space.xs }}>
          {week.map((d) => (
            <Cell key={d.index} status={d.status} />
          ))}
          {wi === weeks.length - 1
            ? Array.from({ length: trailing }, (_, i) => <View key={`pad-${i}`} style={{ flex: 1 }} />)
            : null}
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.sm }}>
        <Legend fill={categoryAccent.streak} label="Session" />
        <Legend fill={color.light3} label="Freeze" />
        <Legend fill={color.light2} label="Missed" />
      </View>
    </View>
  );
}

function Legend({ fill, label }: { fill: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      {/* A swatch of the same shape as a grid cell, so the key reads as the grid. */}
      <View style={{ width: space.md, height: space.md, borderRadius: radius.sm, backgroundColor: fill }} />
      <Text variant="caption" color={color.secondaryLabel}>
        {label}
      </Text>
    </View>
  );
}
