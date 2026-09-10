// E8 · Preferences — units
// A Metric/Imperial quick-toggle sets all four dimensions at once; the per-
// dimension segmented controls below let the user mix (e.g. metric but lb).
// Everything reads/writes the settings store, which the rest of the app uses at
// the display boundary. (Language is English-only at launch — the picker was
// removed; the i18n scaffolding / t() wrapping stays for later.)
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';
import { UNIT_OPTIONS, systemOf, type UnitDimension } from '@/lib/units';

const DIMENSIONS: { key: UnitDimension; labelKey: string }[] = [
  { key: 'weight', labelKey: 'preferences.bodyWeight' },
  { key: 'height', labelKey: 'preferences.height' },
  { key: 'mass', labelKey: 'preferences.foodQuantities' },
  { key: 'energy', labelKey: 'preferences.energy' },
];

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);
  const setSystem = useSettingsStore((s) => s.setSystem);
  const setUnit = useSettingsStore((s) => s.setUnit);
  const system = systemOf(units);

  return (
    <Screen variant="floating" eyebrow="Units" title={t('preferences.title')} showBack>
      <View style={{ gap: space.sm }}>
        <SegmentedField
          variant="inset"
          label={t('preferences.measurementSystem')}
          value={system}
          onChange={(v) => setSystem(v as 'metric' | 'imperial')}
          options={[
            { label: t('preferences.metric'), value: 'metric' },
            { label: t('preferences.imperial'), value: 'imperial' },
          ]}
        />
        <Text variant="footnote" color={color.secondaryLabel}>
          {system === 'custom' ? t('preferences.customHint') : t('preferences.systemHint')}
        </Text>
      </View>

      {DIMENSIONS.map((d) => (
        <SegmentedField
          key={d.key}
          variant="inset"
          label={t(d.labelKey)}
          value={units[d.key]}
          onChange={(v) => setUnit(d.key, v)}
          options={UNIT_OPTIONS[d.key]}
        />
      ))}
    </Screen>
  );
}
