// C10 · Custom food form
// name, calories per 100g, protein, carbs, fat, fibre. Save adds it to the
// user's custom food list for reuse.
import { Button } from '@/components/forms/Button';
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';
import { saveFood } from '@/lib/data';

type Macros = { calories: string; protein: string; carbs: string; fat: string; fibre: string };

const num = (s: string) => Math.max(0, Number(s) || 0);

export default function CustomFoodScreen() {
  const [name, setName] = useState('');
  const [macros, setMacros] = useState<Macros>({ calories: '', protein: '', carbs: '', fat: '', fibre: '' });

  const set = (key: keyof Macros) => (value: string) => setMacros((m) => ({ ...m, [key]: value }));
  const calorieNum = Number(macros.calories);
  // Inline validation (AUDIT_REPORT.md M8): calories must parse to a positive number.
  const calorieError = macros.calories.trim() !== '' && !(calorieNum > 0) ? 'Enter a calorie value greater than 0' : undefined;
  const canSave = name.trim().length > 0 && calorieNum > 0;

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  // Actually persist the custom food to the saved-foods list (AUDIT_REPORT.md M6):
  // previously this only toasted and discarded the entry.
  const done = () => {
    saveFood({
      name: name.trim(),
      servingG: 100,
      calories: num(macros.calories),
      protein: num(macros.protein),
      carbs: num(macros.carbs),
      fat: num(macros.fat),
    });
    showToast({ message: `Saved “${name.trim()}”.`, tone: 'success' });
    close();
  };

  return (
    <SheetContent variant="leading" title="Custom food" onClose={close}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Mum's chicken karahi" />

      <TextField
        label="Calories per 100g"
        value={macros.calories}
        onChangeText={set('calories')}
        keyboardType="decimal-pad"
        placeholder="kcal"
        error={calorieError}
        required
      />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Protein (g)" value={macros.protein} onChangeText={set('protein')} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Carbs (g)" value={macros.carbs} onChangeText={set('carbs')} keyboardType="decimal-pad" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Fat (g)" value={macros.fat} onChangeText={set('fat')} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Fibre (g)" value={macros.fibre} onChangeText={set('fibre')} keyboardType="decimal-pad" />
        </View>
      </View>

      {/* The design saves with a pill at the end of the sheet, not a header tick.
          Same rule as before: a name and calories above zero, or it stays disabled. */}
      <Button title="Save food" onPress={done} disabled={!canSave} />
    </SheetContent>
  );
}
