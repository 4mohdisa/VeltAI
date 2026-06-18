// CalorieCrossCheck — cross-checks logged intake against the active energy read
// from Apple Health, vs the daily calorie goal. If Health is denied/unavailable
// it falls back to intake-only (no crash, no empty state). Active-energy gets the
// orange energy accent (functional); everything else stays monochrome.
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
import { formatNumber } from '@/lib/formatting';
import { kcalToDisplay, type EnergyUnit } from '@/lib/units';

export type CalorieCrossCheckProps = {
  intake: number; // canonical kcal
  goal: number; //   canonical kcal
  activeEnergy?: number; // canonical kcal; undefined when Health is not connected
  energyUnit?: EnergyUnit;
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

export function CalorieCrossCheck({ intake, goal, activeEnergy, energyUnit = 'kcal' }: CalorieCrossCheckProps) {
  const connected = typeof activeEnergy === 'number';
  const large = useLargeText(); // §7.2: stack columns vertically at large text
  const e = (kcal: number) => formatNumber(kcalToDisplay(kcal, energyUnit)); // respect energy unit

  // VoiceOver summary for the whole cross-check (one element, not three columns).
  const summary = connected
    ? `Calorie cross-check. Eaten ${e(intake)}, active burn ${e(activeEnergy!)}, goal ${e(goal)} ${energyUnit}. Net ${e(intake - activeEnergy!)} against goal.`
    : `Calorie cross-check. Eaten ${e(intake)} of ${e(goal)} ${energyUnit} goal. Connect Apple Health to add active burn.`;

  return (
    <Card>
      <View style={{ gap: space.md }} accessible accessibilityLabel={summary}>
        <Text
          variant="label"
          color={color.secondaryLabel}
          accessibilityRole="header"
          style={{ textTransform: 'uppercase', letterSpacing: 1 }}
        >
          Calorie cross-check ({energyUnit})
        </Text>

        <View
          style={{
            flexDirection: large ? 'column' : 'row',
            justifyContent: 'space-around',
            gap: large ? space.md : 0,
          }}
        >
          <Column value={e(intake)} label="Eaten" />
          {connected ? (
            <Column value={e(activeEnergy!)} label="Active burn" tint={categoryAccent.calories} icon="flame" />
          ) : null}
          <Column value={e(goal)} label="Goal" />
        </View>

        <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
          {connected
            ? `Net ${e(intake - activeEnergy!)} ${energyUnit} against your ${e(goal)} goal.`
            : 'Connect Apple Health to cross-check against your active burn.'}
        </Text>
      </View>
    </Card>
  );
}
