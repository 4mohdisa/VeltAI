// E13 · Goals — custom calorie & macro targets
// "Use AI recommendation" (the onboarding-derived default) vs "Set my own". When
// custom, the user owns calories + protein/carbs/fat, editable by grams OR by
// percentage split (the two stay in sync against the calorie target). Fibre is
// optional. A soft reconciliation hint shows when macros don't sum to calories —
// never a hard block. All values are stored canonical (kcal + grams); the energy
// unit only affects how calories are shown/entered.
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { color, space } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
import { useSettingsStore, useUnitPreferences } from '@/lib/settings/store';
import { useGoals } from '@/lib/data';
import { displayToKcal, formatEnergy, kcalToDisplay } from '@/lib/units';

// Atwater factors (kcal per gram).
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;
type MacroKey = keyof typeof KCAL_PER_G;

export default function GoalsScreen() {
  const { t } = useTranslation();
  const energyUnit = useUnitPreferences().energy;
  const large = useLargeText(); // §7.2: stack grams/% fields at large text

  const goalMode = useSettingsStore((s) => s.goalMode);
  const setGoalMode = useSettingsStore((s) => s.setGoalMode);
  const customGoals = useSettingsStore((s) => s.customGoals);
  const setCustomGoals = useSettingsStore((s) => s.setCustomGoals);
  const resetGoalsToAi = useSettingsStore((s) => s.resetGoalsToAi);
  const splitBy = useSettingsStore((s) => s.macroSplitBy);
  const setSplitBy = useSettingsStore((s) => s.setMacroSplitBy);

  const isCustom = goalMode === 'custom';
  // In AI mode show the derived recommendation; in custom mode the user's values.
  const aiRecommendation = useGoals();
  const goals = isCustom ? customGoals : aiRecommendation;

  // Macro kcal sum (for the % view and the reconciliation hint).
  const macroKcal = useMemo(
    () => goals.protein * KCAL_PER_G.protein + goals.carbs * KCAL_PER_G.carbs + goals.fat * KCAL_PER_G.fat,
    [goals],
  );
  const reconciled = Math.abs(macroKcal - goals.calories) <= 10;

  // --- field commit helpers (parse display → canonical, write to store) ------
  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));

  // Draft-per-field: while a field is focused the raw string lives locally and
  // is parsed/committed only when editing ends — clearing a field no longer
  // snaps to '0', and the kJ round-trip can't rewrite digits under the caret.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draft = (key: string, storeValue: string, commit: (v: string) => void) => ({
    value: drafts[key] ?? storeValue,
    onChangeText: (v: string) => setDrafts((d) => ({ ...d, [key]: v })),
    onEndEditing: (e: { nativeEvent: { text: string } }) => {
      commit(e.nativeEvent.text);
      setDrafts(({ [key]: _committed, ...rest }) => rest); // re-sync to the (clamped) store value
    },
  });

  const onCalories = (v: string) => setCustomGoals({ calories: Math.round(displayToKcal(num(v), energyUnit)) });

  const onMacroGrams = (key: MacroKey, v: string) => setCustomGoals({ [key]: num(v) });

  const onMacroPercent = (key: MacroKey, v: string) => {
    const pct = Math.max(0, Math.min(100, Number(v) || 0));
    const grams = Math.round((pct / 100) * goals.calories / KCAL_PER_G[key]);
    setCustomGoals({ [key]: grams });
  };

  const percentOf = (key: MacroKey) =>
    goals.calories > 0 ? String(Math.round((goals[key] * KCAL_PER_G[key]) / goals.calories * 100)) : '0';

  const macroRows: { key: MacroKey; label: string }[] = [
    { key: 'protein', label: t('goals.protein') },
    { key: 'carbs', label: t('goals.carbs') },
    { key: 'fat', label: t('goals.fat') },
  ];

  return (
    <Screen variant="floating" eyebrow="Daily targets" title={t('goals.title')} showBack backLabel={t('settings.title')}>
      <SegmentedField
        variant="inset"
        label={t('goals.mode')}
        value={goalMode}
        onChange={(v) => setGoalMode(v as 'ai' | 'custom')}
        options={[
          { label: t('goals.useAi'), value: 'ai' },
          { label: t('goals.setOwn'), value: 'custom' },
        ]}
      />
      {!isCustom ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('goals.aiHint')}
        </Text>
      ) : null}

      <TextField
        label={`${t('goals.dailyCalories')} (${energyUnit})`}
        {...draft('calories', String(kcalToDisplay(goals.calories, energyUnit)), onCalories)}
        helper="Between 1,200 and 10,000 kcal."
        editable={isCustom}
        disabled={!isCustom}
        keyboardType="numeric"
      />

      <SegmentedField
        variant="inset"
        label={t('goals.splitBy')}
        value={splitBy}
        onChange={(v) => setSplitBy(v as 'grams' | 'percent')}
        disabled={!isCustom}
        options={[
          { label: t('goals.grams'), value: 'grams' },
          { label: t('goals.percent'), value: 'percent' },
        ]}
      />

      <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('goals.macros')}
      </Text>

      {macroRows.map((m) => (
        <View key={m.key} style={{ flexDirection: large ? 'column' : 'row', gap: space.md, alignItems: large ? 'stretch' : 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextField
              label={`${m.label} (g)`}
              {...draft(`${m.key}-g`, String(goals[m.key]), (v) => onMacroGrams(m.key, v))}
              editable={isCustom && splitBy === 'grams'}
              disabled={!isCustom || splitBy !== 'grams'}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label={`${m.label} (%)`}
              {...draft(`${m.key}-pct`, percentOf(m.key), (v) => onMacroPercent(m.key, v))}
              editable={isCustom && splitBy === 'percent'}
              disabled={!isCustom || splitBy !== 'percent'}
              keyboardType="numeric"
            />
          </View>
        </View>
      ))}

      <TextField
        label={t('goals.fibre')}
        {...draft('fibre', String(goals.fibre), (v) => setCustomGoals({ fibre: num(v) }))}
        editable={isCustom}
        disabled={!isCustom}
        keyboardType="numeric"
      />

      {isCustom && !reconciled ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('goals.reconcileHint', {
            total: formatEnergy(macroKcal, energyUnit),
            target: formatEnergy(goals.calories, energyUnit),
          })}
        </Text>
      ) : null}

      <Button
        title={t('goals.resetToAi')}
        variant="secondary"
        icon="sparkles"
        disabled={!isCustom}
        onPress={() => {
          resetGoalsToAi();
          showToast({ message: t('goals.saved'), tone: 'success' });
        }}
      />

      {/* Guideline 1.4.1 — computed health targets need a visible disclaimer. */}
      <HealthDisclaimer />
    </Screen>
  );
}
