// C13 · Saved foods
// Searchable list of saved / frequent / recent items (mock). Each row has a
// one-tap + Add that logs straight to today — no scan, AI or edit step. Tapping
// the row opens the shared item edit sheet, where "Delete item" un-saves it.
// Reached from the add-menu's "Saved foods" card.
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { TextField } from '@/components/forms/TextField';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { mockSavedFoods, type SavedFood } from '@/lib/mock/data';

const toEditable = (f: SavedFood): EditableItem => ({
  id: f.id,
  name: f.name,
  quantityG: f.servingG,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
});

export default function SavedFoodsScreen() {
  const [foods, setFoods] = useState<SavedFood[]>(mockSavedFoods);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<EditableItem | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q));
  }, [foods, query]);

  const add = (f: SavedFood) => showToast({ message: `Added ${f.name}.`, tone: 'success' });

  const applyEdit = (next: EditableItem) => {
    setFoods((arr) =>
      arr.map((f) =>
        f.id === next.id
          ? { ...f, name: next.name, servingG: next.quantityG, calories: next.calories, protein: next.protein, carbs: next.carbs, fat: next.fat }
          : f,
      ),
    );
    setEditing(null);
  };

  const unsave = (id: string) => {
    setFoods((arr) => arr.filter((f) => f.id !== id));
    setEditing(null);
    showToast({ message: 'Removed from saved.', tone: 'info' });
  };

  return (
    <SheetContent title="Saved foods" onClose={() => router.canGoBack() && router.back()}>
      <TextField
        placeholder="Search saved…"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        accessibilityLabel="Search saved foods"
      />

      {results.length === 0 ? (
        <Text variant="callout" color={color.gray500} style={{ textAlign: 'center', paddingVertical: space.xl }}>
          {query.trim() ? `No saved foods match “${query.trim()}”.` : 'No saved foods yet.'}
        </Text>
      ) : (
        <Card padded={false}>
          {results.map((f, i) => (
            <View
              key={f.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: color.gray100,
              }}
            >
              {/* Whole text area opens the edit / un-save sheet. */}
              <Pressable
                haptic={false}
                minTapTarget={false}
                onPress={() => setEditing(toEditable(f))}
                accessibilityLabel={`Edit ${f.name}`}
                style={{ flex: 1, gap: space.xs, paddingVertical: space.lg, paddingLeft: space.lg }}
              >
                <Text variant="body" color={color.black}>
                  {f.name}
                </Text>
                <Text variant="footnote" color={color.gray500}>
                  {f.brand ? `${f.brand} · ` : ''}
                  {f.servingG} g · {formatCalories(f.calories)} · P {f.protein}g
                </Text>
              </Pressable>

              {/* One-tap add — logs straight to today, no edit step. */}
              <Pressable
                haptic
                minTapTarget={false}
                onPress={() => add(f)}
                accessibilityLabel={`Add ${f.name}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  backgroundColor: color.black,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: space.lg,
                }}
              >
                <Icon name="add" size={22} color={color.white} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <FoodItemEditSheet item={editing} onClose={() => setEditing(null)} onSave={applyEdit} onDelete={unsave} />
    </SheetContent>
  );
}
