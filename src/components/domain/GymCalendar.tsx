// GymCalendar — 30-day grid. Filled black circle = session, snowflake = freeze,
// empty outline = missed, ring = today. Read-only history view.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import type { DayStatus } from '@/lib/mock/data';

const CELL = 36;

// Day states are encoded by SHAPE/SYMBOL, not colour (HIG §8.3): filled +
// checkmark = session, snowflake = freeze, ring = today, thin outline = missed.
const STATUS_LABEL: Record<DayStatus, string> = {
  session: 'Session logged',
  freeze: 'Streak freeze',
  today: 'Today',
  missed: 'Missed',
  future: 'Upcoming',
};

function Cell({ status }: { status: DayStatus }) {
  const base = {
    width: CELL,
    height: CELL,
    borderRadius: radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const a11y = { accessible: true, accessibilityLabel: STATUS_LABEL[status] };

  switch (status) {
    case 'session':
      return (
        <View {...a11y} style={[base, { backgroundColor: color.black }]}>
          <Icon name="checkmark" size={18} color={color.white} />
        </View>
      );
    case 'freeze':
      return (
        <View {...a11y} style={[base, { backgroundColor: color.gray100, borderWidth: 1, borderColor: color.gray200 }]}>
          <Icon name="snow" size={16} color={color.gray500} />
        </View>
      );
    case 'today':
      return <View {...a11y} style={[base, { borderWidth: 2, borderColor: color.black }]} />;
    case 'missed':
      return <View {...a11y} style={[base, { borderWidth: 1, borderColor: color.gray200 }]} />;
    default:
      return <View {...a11y} style={[base, { backgroundColor: color.gray50 }]} />;
  }
}

export type GymCalendarProps = {
  days: { index: number; status: DayStatus }[];
};

export function GymCalendar({ days }: GymCalendarProps) {
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }}>
        {days.map((d) => (
          <Cell key={d.index} status={d.status} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg, marginTop: space.md }}>
        <Legend tint={color.black} label="Session" />
        <Legend tint={color.gray400} label="Freeze" icon />
        <Legend tint={color.gray200} label="Missed" outline />
      </View>
    </View>
  );
}

function Legend({ tint, label, icon, outline }: { tint: string; label: string; icon?: boolean; outline?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: radius.full,
          backgroundColor: outline ? 'transparent' : icon ? color.gray100 : tint,
          borderWidth: outline ? 1 : 0,
          borderColor: tint,
        }}
      />
      <Text variant="caption" color={color.gray500}>
        {label}
      </Text>
    </View>
  );
}
