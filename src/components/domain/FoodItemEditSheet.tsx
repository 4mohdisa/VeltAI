// FoodItemEditSheet — the ONE universal item edit sheet, shared by every flow
// that needs to tweak a single food item before it's logged: photo review (C4),
// voice review (C6), barcode confirm (C8) and Saved foods (C13). Native bottom
// sheet, X/close on the LEFT, ✓/confirm on the RIGHT, editable fields, and a
// Delete item button at the bottom. No edit pencils — the whole row that opens
// this is tappable. Editing is local; the parent applies onSave to its totals.
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/navigation/BottomSheet';
import { GlassCloseButton, GlassSaveButton } from '@/components/navigation/GlassButtons';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type EditableItem = {
  id: string;
  name: string;
  quantityG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodItemEditSheetProps = {
  item: EditableItem | null; // null → sheet hidden
  onClose: () => void;
  onSave: (item: EditableItem) => void;
  onDelete?: (id: string) => void;
};

export function FoodItemEditSheet({ item, onClose, onSave, onDelete }: FoodItemEditSheetProps) {
  return (
    <BottomSheet visible={!!item} onClose={onClose}>
      {/* Re-seed local field state each time a different item opens. */}
      {item ? (
        <EditForm key={item.id} item={item} onClose={onClose} onSave={onSave} onDelete={onDelete} />
      ) : null}
    </BottomSheet>
  );
}

function EditForm({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: EditableItem;
  onClose: () => void;
  onSave: (item: EditableItem) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantityG));
  const [calories, setCalories] = useState(String(item.calories));
  const [protein, setProtein] = useState(String(item.protein));
  const [carbs, setCarbs] = useState(String(item.carbs));
  const [fat, setFat] = useState(String(item.fat));

  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));

  const save = () =>
    onSave({
      ...item,
      name: name.trim() || item.name,
      quantityG: num(quantity),
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    });

  return (
    <View style={{ gap: space.md }}>
      {/* X-left / title / ✓-right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <GlassCloseButton onPress={onClose} />
        <Text variant="title3" color={color.black}>
          Edit item
        </Text>
        <GlassSaveButton onPress={save} />
      </View>

      <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Serving (g)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
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

      {onDelete ? (
        <Button title="Delete item" variant="destructive" icon="trash" onPress={() => onDelete(item.id)} />
      ) : null}
    </View>
  );
}
