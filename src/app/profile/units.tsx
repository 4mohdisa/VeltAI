// E8 · Units
// Metric / Imperial segmented control.
import { useState } from 'react';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { mockUser } from '@/lib/mock/data';

export default function UnitsScreen() {
  const [units, setUnits] = useState<'metric' | 'imperial'>(mockUser.units);

  return (
    <Screen title="Units" showBack>
      <SegmentedField
        label="Measurement system"
        value={units}
        onChange={setUnits}
        options={[
          { label: 'Metric', value: 'metric' },
          { label: 'Imperial', value: 'imperial' },
        ]}
      />
      <Text variant="footnote" color={color.gray500}>
        {units === 'metric' ? 'Weight in kg, height in cm.' : 'Weight in lb, height in ft/in.'}
      </Text>
    </Screen>
  );
}
