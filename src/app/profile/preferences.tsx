// E8 · Preferences — units (+ language, added with i18n)
// A Metric/Imperial quick-toggle sets all five dimensions at once; the per-
// dimension segmented controls below let the user mix (e.g. metric but lb).
// Everything reads/writes the settings store, which the rest of the app uses at
// the display boundary.
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';
import { UNIT_OPTIONS, systemOf, type UnitDimension } from '@/lib/units';

const DIMENSIONS: { key: UnitDimension; label: string }[] = [
  { key: 'weight', label: 'Body weight' },
  { key: 'height', label: 'Height' },
  { key: 'mass', label: 'Food quantities' },
  { key: 'volume', label: 'Volume' },
  { key: 'energy', label: 'Energy' },
];

export default function PreferencesScreen() {
  const units = useSettingsStore((s) => s.units);
  const setSystem = useSettingsStore((s) => s.setSystem);
  const setUnit = useSettingsStore((s) => s.setUnit);
  const system = systemOf(units);

  return (
    <Screen title="Preferences" showBack>
      <View style={{ gap: space.sm }}>
        <SegmentedField
          label="Measurement system"
          value={system}
          onChange={(v) => setSystem(v as 'metric' | 'imperial')}
          options={[
            { label: 'Metric', value: 'metric' },
            { label: 'Imperial', value: 'imperial' },
          ]}
        />
        <Text variant="footnote" color={color.gray500}>
          {system === 'custom'
            ? 'Custom — your units are mixed below.'
            : 'Sets every measurement at once. Fine-tune any of them below.'}
        </Text>
      </View>

      {DIMENSIONS.map((d) => (
        <SegmentedField
          key={d.key}
          label={d.label}
          value={units[d.key]}
          onChange={(v) => setUnit(d.key, v)}
          options={UNIT_OPTIONS[d.key]}
        />
      ))}
    </Screen>
  );
}
