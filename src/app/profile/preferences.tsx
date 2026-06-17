// E8 · Preferences — units + language
// A Metric/Imperial quick-toggle sets all five dimensions at once; the per-
// dimension segmented controls below let the user mix (e.g. metric but lb). A
// language picker overrides the device language. Everything reads/writes the
// settings store, which the rest of the app uses at the display boundary.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';
import { UNIT_OPTIONS, systemOf, type UnitDimension } from '@/lib/units';
import i18n, { SUPPORTED_LANGUAGES, deviceLanguage } from '@/lib/i18n';

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
  const languageOverride = useSettingsStore((s) => s.languageOverride);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const system = systemOf(units);

  // null override → System default (follow the device language).
  const changeLanguage = (code: string | null) => {
    void i18n.changeLanguage(code ?? deviceLanguage());
    setLanguage(code);
  };

  return (
    <Screen title={t('preferences.title')} showBack>
      <View style={{ gap: space.sm }}>
        <SegmentedField
          label={t('preferences.measurementSystem')}
          value={system}
          onChange={(v) => setSystem(v as 'metric' | 'imperial')}
          options={[
            { label: t('preferences.metric'), value: 'metric' },
            { label: t('preferences.imperial'), value: 'imperial' },
          ]}
        />
        <Text variant="footnote" color={color.gray500}>
          {system === 'custom' ? t('preferences.customHint') : t('preferences.systemHint')}
        </Text>
      </View>

      {DIMENSIONS.map((d) => (
        <SegmentedField
          key={d.key}
          label={t(d.labelKey)}
          value={units[d.key]}
          onChange={(v) => setUnit(d.key, v)}
          options={UNIT_OPTIONS[d.key]}
        />
      ))}

      <SettingsList
        title={t('preferences.language')}
        rows={[
          {
            icon: languageOverride === null ? 'checkmark-circle' : 'ellipse-outline',
            label: t('preferences.systemDefault'),
            onPress: () => changeLanguage(null),
          },
          ...SUPPORTED_LANGUAGES.map((l) => ({
            icon: languageOverride === l.code ? 'checkmark-circle' : 'ellipse-outline',
            label: l.label,
            onPress: () => changeLanguage(l.code),
          })),
        ]}
      />
    </Screen>
  );
}
