// Food item quick-edit — the tap-to-edit sheet for a single food item.
// Opened from any editable item row (e.g. meal detail C11). Standard glass
// header: X discards, tick saves. Delete item lives inside with a soft confirm.
// Presentation/chrome only — the underlying edit/save is mocked as before.
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';

export default function ItemEditScreen() {
  const p = useLocalSearchParams<{
    name?: string;
    quantityG?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  }>();

  const [name, setName] = useState(p.name ?? '');
  const [quantity, setQuantity] = useState(p.quantityG ?? '');
  const [calories, setCalories] = useState(p.calories ?? '');
  const [protein, setProtein] = useState(p.protein ?? '');
  const [carbs, setCarbs] = useState(p.carbs ?? '');
  const [fat, setFat] = useState(p.fat ?? '');

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete item?', 'This removes it from the meal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          showToast({ message: 'Item deleted.', tone: 'info' });
          close();
        },
      },
    ]);
  };

  return (
    <SheetContent
      title="Edit item"
      onClose={close}
      onDone={() => {
        showToast({ message: 'Item updated.', tone: 'success' });
        close();
      }}
    >
      <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Quantity (g)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Calories" value={calories} onChangeText={setCalories} keyboardType="numeric" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }} />
      </View>

      <Button title="Delete item" variant="destructive" icon="trash" onPress={confirmDelete} />
    </SheetContent>
  );
}
