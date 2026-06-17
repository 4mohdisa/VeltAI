// C1 · Food log (default)
// A native iOS sectioned list (SectionList): one section per meal slot
// (Breakfast/Lunch/Dinner/Snacks) with a header showing the meal + its calorie
// subtotal, and the logged foods as rows (name + macros left, calories right,
// hairline separators, rounded inset group). Tapping a row opens the shared edit
// sheet; the section's + adds to that meal. A search bar pins above the list;
// the solid black + FAB floats clear of the tab bar.
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, SectionList, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Card } from '@/components/display/Card';
import { TextField } from '@/components/forms/TextField';
import { GlassFab } from '@/components/navigation/GlassButtons';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { color, radius, space, surface, zIndex } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { foodCatalog, mockMeals, type FoodResult, type MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

type FoodRow = EditableItem;
type MealSection = { slot: MealSlot; subtotal: number; data: FoodRow[] };

// Group today's meal items into one section per canonical slot (stable row ids).
function buildSections(): MealSection[] {
  const bySlot: Record<MealSlot, FoodRow[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  let n = 0;
  for (const meal of mockMeals) {
    for (const it of meal.items) {
      bySlot[meal.slot].push({
        id: `fl${n++}`,
        name: it.name,
        quantityG: it.quantityG,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
      });
    }
  }
  return SLOTS.map((slot) => ({
    slot,
    data: bySlot[slot],
    subtotal: bySlot[slot].reduce((s, i) => s + i.calories, 0),
  }));
}

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const energyUnit = useUnitPreferences().energy;
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [sections, setSections] = useState<MealSection[]>(buildSections);
  const [editing, setEditing] = useState<FoodRow | null>(null);

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0);

  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as FoodResult[];
    return foodCatalog.filter((r) => r.name.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const recompute = (rows: FoodRow[]) => rows.reduce((s, i) => s + i.calories, 0);

  const applyEdit = (next: EditableItem) => {
    setSections((prev) =>
      prev.map((sec) => {
        const data = sec.data.map((r) => (r.id === next.id ? { ...r, ...next } : r));
        return { ...sec, data, subtotal: recompute(data) };
      }),
    );
    setEditing(null);
  };
  const removeRow = (id: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        const data = sec.data.filter((r) => r.id !== id);
        return { ...sec, data, subtotal: recompute(data) };
      }),
    );
    setEditing(null);
  };

  // Picking a search result opens the serving-size picker before adding.
  const pick = (food: FoodResult) =>
    router.push({ pathname: '/food/serving', params: { name: food.name, kcalPer100: String(food.kcalPer100) } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['top']}>
      {/* Pinned header: large title + total + search */}
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="title1" color={color.label}>
            {t('foodLog.today')}
          </Text>
          <Text variant="callout" color={color.secondaryLabel}>
            {formatEnergy(total, energyUnit)}
          </Text>
        </View>
        <TextField
          placeholder={t('foodLog.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          accessibilityLabel={t('foodLog.searchPlaceholder')}
        />
      </View>

      {searching ? (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: space['4xl'] + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {results.length > 0 ? (
            <Card padded={false}>
              {results.map((food, i) => (
                <Pressable
                  key={`${food.name}-${i}`}
                  haptic={false}
                  minTapTarget={false}
                  onPress={() => pick(food)}
                  accessibilityLabel={`Add ${food.name}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    padding: space.lg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: color.gray100,
                  }}
                >
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Text variant="body" color={color.label}>
                      {food.name}
                    </Text>
                    <Text variant="footnote" color={color.secondaryLabel}>
                      {food.brand ? `${food.brand} · ` : ''}
                      {t('foodLog.per100', { value: formatCalories(food.kcalPer100) })}
                    </Text>
                  </View>
                  <Icon name="add-circle-outline" size={22} color={color.black} />
                </Pressable>
              ))}
            </Card>
          ) : (
            <Text variant="callout" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
              {t('foodLog.noMatches', { query: query.trim() })}
            </Text>
          )}

          <Pressable
            haptic={false}
            minTapTarget={false}
            onPress={() => router.push('/food/custom-food')}
            accessibilityLabel={t('foodLog.addCustomFood')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md }}
          >
            <Icon name="create-outline" size={18} color={color.black} />
            <Text variant="bodyBold" color={color.label}>
              {t('foodLog.addCustomFood')}
            </Text>
          </Pressable>
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space['4xl'] + insets.bottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.black} />}
          renderSectionHeader={({ section }) => (
            <MealSectionHeader
              slot={section.slot}
              subtotal={section.subtotal}
              energyUnit={energyUnit}
              onAdd={() => router.push('/food/add')}
            />
          )}
          renderItem={({ item, index, section }) => (
            <FoodItemRow
              item={item}
              first={index === 0}
              last={index === section.data.length - 1}
              energyUnit={energyUnit}
              onPress={() => setEditing(item)}
            />
          )}
          renderSectionFooter={({ section }) =>
            section.data.length === 0 ? (
              <Pressable
                haptic={false}
                minTapTarget={false}
                onPress={() => router.push('/food/add')}
                accessibilityLabel={`Add to ${section.slot}`}
                style={{
                  backgroundColor: surface.card,
                  borderRadius: radius.lg,
                  paddingHorizontal: space.lg,
                  minHeight: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  marginBottom: space.xl,
                }}
              >
                <Icon name="add-circle-outline" size={20} color={color.secondaryLabel} />
                <Text variant="body" color={color.secondaryLabel}>
                  {t('foodLog.addToMeal', { slot: section.slot })}
                </Text>
              </Pressable>
            ) : (
              <View style={{ height: space.xl }} />
            )
          }
          ListFooterComponent={
            <Pressable
              haptic={false}
              minTapTarget={false}
              onPress={() => router.push('/food/history')}
              accessibilityLabel={t('foodLog.mealHistory')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: space.md }}
            >
              <Icon name="time-outline" size={16} color={color.black} />
              <Text variant="bodyBold" color={color.label}>
                {t('foodLog.mealHistory')}
              </Text>
            </Pressable>
          }
        />
      )}

      {/* Primary add FAB — solid black, white +, floats clear of the tab bar */}
      <GlassFab
        variant="solid"
        accessibilityLabel={t('foodLog.addMeal')}
        onPress={() => router.push('/food/add')}
        style={{ position: 'absolute', right: space.xl, bottom: insets.bottom + space['5xl'] + space.lg, zIndex: zIndex.fab }}
      />

      <FoodItemEditSheet item={editing} onClose={() => setEditing(null)} onSave={applyEdit} onDelete={removeRow} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function MealSectionHeader({
  slot,
  subtotal,
  energyUnit,
  onAdd,
}: {
  slot: MealSlot;
  subtotal: number;
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
  onAdd: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: space.lg,
        paddingBottom: space.sm,
      }}
    >
      <Text variant="title3" color={color.label}>
        {slot}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text variant="footnote" color={color.secondaryLabel}>
          {formatEnergy(subtotal, energyUnit)}
        </Text>
        <Pressable haptic={false} onPress={onAdd} accessibilityLabel={`Add to ${slot}`}>
          <Icon name="add-circle" size={24} color={color.black} />
        </Pressable>
      </View>
    </View>
  );
}

function FoodItemRow({
  item,
  first,
  last,
  energyUnit,
  onPress,
}: {
  item: FoodRow;
  first: boolean;
  last: boolean;
  energyUnit: ReturnType<typeof useUnitPreferences>['energy'];
  onPress: () => void;
}) {
  return (
    <Pressable
      haptic={false}
      minTapTarget={false}
      onPress={onPress}
      accessibilityLabel={`Edit ${item.name}, ${formatEnergy(item.calories, energyUnit)}`}
      style={{
        backgroundColor: surface.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        minHeight: 60,
        borderTopLeftRadius: first ? radius.lg : 0,
        borderTopRightRadius: first ? radius.lg : 0,
        borderBottomLeftRadius: last ? radius.lg : 0,
        borderBottomRightRadius: last ? radius.lg : 0,
      }}
    >
      {/* hairline separator between rows (inset under the text) */}
      {!first ? (
        <View style={{ position: 'absolute', left: space.lg, right: 0, top: 0, height: 1, backgroundColor: color.gray200 }} />
      ) : null}
      <View style={{ flex: 1, gap: space.xs, paddingVertical: space.sm }}>
        <Text variant="body" color={color.label} numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="footnote" color={color.secondaryLabel} numberOfLines={1}>
          {item.quantityG} g · P {item.protein} · C {item.carbs} · F {item.fat}
        </Text>
      </View>
      <Text variant="bodyMedium" color={color.label}>
        {formatEnergy(item.calories, energyUnit)}
      </Text>
    </Pressable>
  );
}
