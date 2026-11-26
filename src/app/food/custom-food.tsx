// C10 · Custom food form
// name, calories per 100g, protein, carbs, fat, fibre. Save adds it to the
// user's custom food list for reuse. Opened from the Food tab's "no matches" with
// a meal (?slot), Save also logs 100 g of it to that meal.
import { Button } from '@/components/forms/Button';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';
import { logMeal, saveFood } from '@/lib/data';
import { slotFromParam } from '@/lib/data/scan';
import { mealSlotName } from '@/lib/mealSlotName';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';

type Macros = { calories: string; protein: string; carbs: string; fat: string; fibre: string };

const num = (s: string) => Math.max(0, Number(s) || 0);

export default function CustomFoodScreen() {
  const { t } = useTranslation();
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const energyUnit = useUnitPreferences().energy;
  const [name, setName] = useState('');
  const [macros, setMacros] = useState<Macros>({ calories: '', protein: '', carbs: '', fat: '', fibre: '' });

  const set = (key: keyof Macros) => (value: string) => setMacros((m) => ({ ...m, [key]: value }));
  const calorieNum = Number(macros.calories);
  // Inline validation (AUDIT_REPORT.md M8): calories must parse to a positive number.
  const calorieError = macros.calories.trim() !== '' && !(calorieNum > 0) ? t('customFood.calorieError') : undefined;
  const canSave = name.trim().length > 0 && calorieNum > 0;

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  // Actually persist the custom food to the saved-foods list (AUDIT_REPORT.md M6):
  // previously this only toasted and discarded the entry.
  const done = () => {
    const food = {
      name: name.trim(),
      calories: num(macros.calories),
      protein: num(macros.protein),
      carbs: num(macros.carbs),
      fat: num(macros.fat),
      // A blank fibre field is "not known", which is not 0 g.
      ...(macros.fibre.trim() !== '' ? { fibre: num(macros.fibre) } : {}),
    };
    saveFood({ ...food, servingG: 100 });
    if (slot) {
      const meal = slotFromParam(slot);
      logMeal(meal, { ...food, quantityG: 100 }, 'manual');
      showToast({
        message: t('foodLog.addedToMeal', {
          energy: formatEnergy(food.calories, energyUnit),
          slot: mealSlotName(t, meal).toLowerCase(),
        }),
        tone: 'success',
      });
    } else {
      showToast({ message: t('customFood.saved', { name: food.name }), tone: 'success' });
    }
    close();
  };

  return (
    <SheetContent variant="leading" title={t('customFood.title')} onClose={close}>
      <TextField label={t('food.nameField')} value={name} onChangeText={setName} placeholder={t('customFood.namePlaceholder')} />

      <TextField
        label={t('customFood.caloriesLabel')}
        value={macros.calories}
        onChangeText={set('calories')}
        keyboardType="decimal-pad"
        placeholder={t('dashboard.kcal')}
        error={calorieError}
        required
      />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label={t('labelScan.protein')} value={macros.protein} onChangeText={set('protein')} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label={t('labelScan.carbs')} value={macros.carbs} onChangeText={set('carbs')} keyboardType="decimal-pad" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label={t('labelScan.fat')} value={macros.fat} onChangeText={set('fat')} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label={t('labelScan.fibre')} value={macros.fibre} onChangeText={set('fibre')} keyboardType="decimal-pad" />
        </View>
      </View>

      {/* The design saves with a pill at the end of the sheet, not a header tick.
          Same rule as before: a name and calories above zero, or it stays disabled. */}
      <Button title={t('customFood.saveButton')} onPress={done} disabled={!canSave} />
    </SheetContent>
  );
}
