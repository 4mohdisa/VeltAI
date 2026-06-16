// C10 · Custom food form
// name, calories per 100g, protein, carbs, fat, fibre. Save adds it to the
// user's custom food list for reuse.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';

type Macros = { calories: string; protein: string; carbs: string; fat: string; fibre: string };

export default function CustomFoodScreen() {
  const [name, setName] = useState('');
  const [macros, setMacros] = useState<Macros>({ calories: '', protein: '', carbs: '', fat: '', fibre: '' });

  const set = (key: keyof Macros) => (value: string) => setMacros((m) => ({ ...m, [key]: value }));
  const canSave = name.trim().length > 0 && macros.calories.trim().length > 0;

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <SheetContent
      title="Custom food"
      onClose={close}
      onDone={() => {
        showToast({ message: `Saved “${name.trim()}”.`, tone: 'success' });
        close();
      }}
      doneDisabled={!canSave}
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Mum's chicken karahi" />

      <TextField
        label="Calories per 100g"
        value={macros.calories}
        onChangeText={set('calories')}
        keyboardType="numeric"
        placeholder="kcal"
        required
      />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Protein (g)" value={macros.protein} onChangeText={set('protein')} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Carbs (g)" value={macros.carbs} onChangeText={set('carbs')} keyboardType="numeric" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Fat (g)" value={macros.fat} onChangeText={set('fat')} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Fibre (g)" value={macros.fibre} onChangeText={set('fibre')} keyboardType="numeric" />
        </View>
      </View>
    </SheetContent>
  );
}
