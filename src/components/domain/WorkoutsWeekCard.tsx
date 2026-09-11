// WorkoutsWeekCard — the Summary tab's "Workouts" card (V16, SummaryScreen.dc.html):
// this week's session count, the time logged, and a pip per day, green where a
// session was logged. From logged sessions only.
//
// Not built, for cause: the design's "of 5 sessions" (no weekly target was ever
// asked for) and "2,000 kcal burned in the gym" (sessions carry no calories).
// The line under the count says the minutes that were actually recorded instead.
import { View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { workoutsLine, type WorkoutsWeek } from '@/lib/data/summaryCards';

/** The design's day pip: 32pt tall, a 6pt gap, 600 12/16 letters. */
export const PIP_H = 32;
export const PIP_GAP = 6;

export type WorkoutsWeekCardProps = {
  week: WorkoutsWeek;
  loading: boolean;
  error: boolean;
};

export function WorkoutsWeekCard({ week, loading, error }: WorkoutsWeekCardProps) {
  const line = loading ? 'Loading this week…' : error ? "Couldn't load this week's sessions" : workoutsLine(week);
  const known = !loading && !error;
  return (
    <Card
      variant="elevated"
      onPress={() => router.push('/dashboard/training' as Href)}
      accessibilityLabel={known ? `Workouts this week. ${week.sessions} sessions. ${line}.` : `Workouts this week. ${line}.`}
    >
      <View style={{ gap: space.lg }}>
        <CardHeaderRow title="Workouts" icon="barbell" tint={categoryAccent.positive} scope="This week" chevron />
        <View style={{ gap: 2 }}>
          {known ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
              <Text variant="statLarge" color={color.label}>
                {week.sessions}
              </Text>
              <Text variant="callout" color={color.secondaryLabel}>
                {week.sessions === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
          ) : null}
          <Text variant="footnote" color={color.secondaryLabel}>
            {line}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: PIP_GAP }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {week.pips.map((p) => {
            const on = known && p.trained;
            return (
              <View
                key={p.date}
                testID={`pip-${p.date}`}
                style={{
                  flex: 1,
                  height: PIP_H,
                  borderRadius: radius.md,
                  backgroundColor: on ? categoryAccent.positive : color.light2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  variant="caption"
                  color={on ? color.white : color.tertiaryLabel}
                  style={{ fontSize: 12, lineHeight: 16, fontWeight: '600' }}
                >
                  {p.letter}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}
