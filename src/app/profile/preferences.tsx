// E8 · Preferences — units, then diet and cuisine
// A Metric/Imperial quick-toggle sets all four dimensions at once; the per-
// dimension segmented controls below let the user mix (e.g. metric but lb).
// Everything reads/writes the settings store, which the rest of the app uses at
// the display boundary. Every string on this screen goes through t() with en,
// es and fr text.
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { SettingsList } from '@/components/display/SettingsList';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { showToast } from '@/components/display/toastStore';
import { Button, MultiSelectField } from '@/components/forms';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { CUISINE_OPTIONS } from '@/components/onboarding/cuisines';
import { DIETARY, nextDietary } from '@/components/onboarding/dietary';
import { saveFoodPreferences, useFoodPreferences } from '@/lib/data';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';
import type { CuisineType, DietaryRequirement } from '@/lib/types';
import { UNIT_OPTIONS, systemOf, type UnitDimension } from '@/lib/units';

type FoodField = 'dietary' | 'cuisines';

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

  const food = useFoodPreferences();
  const [editing, setEditing] = useState<FoodField | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const canEdit = !food.isLoading && !food.error;

  const labelOf = (field: FoodField, value: string) =>
    t(field === 'dietary' ? `onboarding.dietary.options.${value}` : `onboarding.cuisine.options.${value}`);
  const summary = (field: FoodField) => {
    if (food.isLoading) return t('preferences.food.loading');
    const values = field === 'dietary' ? food.data.dietary : food.data.cuisines;
    return values.length ? values.map((v) => labelOf(field, v)).join(', ') : t('preferences.food.notSet');
  };
  const open = (field: FoodField) => {
    setDraft(field === 'dietary' ? food.data.dietary : food.data.cuisines);
    setEditing(field);
  };
  const save = async () => {
    setSaving(true);
    try {
      await saveFoodPreferences(
        editing === 'dietary' ? { dietary: draft as DietaryRequirement[] } : { cuisines: draft as CuisineType[] },
      );
      showToast({ message: t('preferences.food.saved'), tone: 'success' });
      setEditing(null);
    } catch {
      showToast({ message: t('preferences.food.saveFailed'), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };
  const options =
    editing === 'dietary'
      ? DIETARY.map((value) => ({ label: labelOf('dietary', value), value }))
      : CUISINE_OPTIONS.map((o) => ({ label: labelOf('cuisines', o.value), value: o.value }));

  return (
    <Screen variant="floating" eyebrow={t('settings.preferencesEyebrow')} title={t('preferences.title')} showBack contentStyle={{ gap: 18 }}>
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

      {food.error ? <LoadFailedNotice message={t('preferences.food.loadFailed')} onRetry={food.refetch} /> : null}
      <SettingsList
        title={t('preferences.food.title')}
        rows={(['dietary', 'cuisines'] as const).map((field) => ({
          icon: field === 'dietary' ? 'leaf-outline' : 'restaurant-outline',
          label: t(`preferences.food.${field}`),
          value: summary(field),
          onPress: canEdit ? () => open(field) : undefined,
        }))}
      />

      <BottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? t(`preferences.food.${editing}`) : undefined}
      >
        <View style={{ gap: space.lg }}>
          <MultiSelectField
            options={options}
            selected={draft}
            onChange={(next) => setDraft(editing === 'dietary' ? nextDietary(draft, next) : next)}
          />
          <Button
            title={t('common.save')}
            onPress={() => void save()}
            loading={saving}
            disabled={editing === 'cuisines' && draft.length === 0}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
