// CalorieCrossCheck — cross-checks logged intake against the active energy read
// from Apple Health, vs the daily calorie goal. If Health is denied/unavailable
// it falls back to intake-only (no crash, no empty state). Active-energy gets the
// orange energy accent (functional); everything else stays monochrome.
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';

export type CalorieCrossCheckProps = {
  intake: number;
  goal: number;
  activeEnergy?: number; // undefined when Health is not connected
};

function Column({ value, label, tint, icon }: { value: string; label: string; tint?: string; icon?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: space.xs }}>
      <Text variant="statSmall" color={color.black}>
        {value}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        {icon ? <Icon name={icon} size={11} color={tint ?? color.gray500} /> : null}
        <Text variant="caption" color={color.gray500} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function CalorieCrossCheck({ intake, goal, activeEnergy }: CalorieCrossCheckProps) {
  const connected = typeof activeEnergy === 'number';

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Text variant="label" color={color.gray500} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Calorie cross-check
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Column value={formatNumber(intake)} label="Eaten" />
          {connected ? (
            <Column value={formatNumber(activeEnergy!)} label="Active burn" tint={categoryAccent.calories} icon="flame" />
          ) : null}
          <Column value={formatNumber(goal)} label="Goal" />
        </View>

        <Text variant="footnote" color={color.gray500} style={{ textAlign: 'center' }}>
          {connected
            ? `Net ${formatNumber(intake - activeEnergy!)} kcal against your ${formatNumber(goal)} goal.`
            : 'Connect Apple Health to cross-check against your active burn.'}
        </Text>
      </View>
    </Card>
  );
}
