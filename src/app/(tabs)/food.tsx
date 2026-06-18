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
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { Skeleton, SkeletonList } from '@/components/display/LoadingSkeleton';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { TextField } from '@/components/forms/TextField';
import { GlassFab } from '@/components/navigation/GlassButtons';
import { FoodItemEditSheet, type EditableItem } from '@/components/domain/FoodItemEditSheet';
import { color, radius, space, surface, zIndex } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
import { haptics } from '@/lib/haptics';
import { formatCalories } from '@/lib/formatting';
import { useUnitPreferences } from '@/lib/settings/store';
import { formatEnergy } from '@/lib/units';
import { useFoodLog, useFoodSearch, editFoodItem, deleteFoodItem, type StoredMeal } from '@/lib/data';
import type { FoodResult, MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

type FoodRow = EditableItem & { pending?: boolean };
type MealSection = { slot: MealSlot; subtotal: number; data: FoodRow[] };

// Group the store's meals into one section per canonical slot (rows carry the
// store item id so edits/deletes/pending map straight back through the seam).
function buildSections(meals: StoredMeal[]): MealSection[] {
  const bySlot: Record<MealSlot, FoodRow[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  for (const meal of meals) {
    for (const it of meal.items) {
      bySlot[meal.slot].push({
        id: it.id,
        name: it.name,
        quantityG: it.quantityG,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        pending: it.pending,
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
  const [editing, setEditing] = useState<FoodRow | null>(null);

  // Data seam — reactive meals + first-load slot. Edits go through the mutations.
  const { data: meals, isLoading: loading, error, refetch } = useFoodLog();
  const loadError = !!error;
  const sections = useMemo(() => buildSections(meals), [meals]);

  const total = sections.reduce((sum, s) => sum + s.subtotal, 0);
  const itemCount = sections.reduce((n, s) => n + s.data.length, 0);

  const searching = query.trim().length > 0;
  const { results } = useFoodSearch(query);

  const onRefresh = useCallback(() => {
    haptics.impactLight(); // pull-to-refresh trigger
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const applyEdit = (next: EditableItem) => {
    editFoodItem(next.id, next);
    setEditing(null);
  };
  const removeRow = (id: string) => {
    deleteFoodItem(id);
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
          <Text variant="title1" color={color.label} accessibilityRole="header">
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
            <EmptyState
              icon="magnifyingglass"
              title={t('foodLog.noMatches', { query: query.trim() })}
              message={t('foodLog.noMatchesHint')}
              actionLabel={t('foodLog.addCustomFood')}
              onAction={() => router.push('/food/custom-food')}
            />
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
      ) : loadError ? (
        <ErrorState
          message="We couldn't load today's food log. Check your connection and try again."
          onRetry={refetch}
        />
      ) : loading ? (
        <ScrollView contentContainerStyle={{ padding: space.xl }}>
          <SkeletonList rows={5} />
        </ScrollView>
      ) : itemCount === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: space['5xl'] }}>
          <EmptyState
            icon="fork.knife"
            title={t('foodLog.noMealsTitle')}
            message={t('foodLog.noMealsMessage')}
            actionLabel={t('foodLog.addMeal')}
            onAction={() => router.push('/food/add')}
          />
        </View>
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
            // Swipe-to-delete (Reanimated); tapping the row → edit sheet Delete is
            // the accessible non-gesture alternative.
            <SwipeableRow
              onDelete={() => removeRow(item.id)}
              confirmTitle={`Remove ${item.name}?`}
              confirmMessage="This removes it from today's log."
            >
              <FoodItemRow
                item={item}
                first={index === 0}
                last={index === section.data.length - 1}
                energyUnit={energyUnit}
                onPress={() => setEditing(item)}
              />
            </SwipeableRow>
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
      {/* Native iOS circular control (Liquid Glass), consistent with the other
          native circular buttons; opens the add menu. */}
      <GlassFab
        variant="glass"
        accessibilityLabel={t('foodLog.addMeal')}
        accessibilityHint="Opens the add menu: scan, barcode, voice or saved foods"
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
      <Text
        variant="title3"
        color={color.label}
        accessibilityRole="header"
        accessibilityLabel={`${slot}, ${formatEnergy(subtotal, energyUnit)}`}
      >
        {slot}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text variant="footnote" color={color.secondaryLabel} accessibilityElementsHidden importantForAccessibility="no">
          {formatEnergy(subtotal, energyUnit)}
        </Text>
        <Pressable haptic={false} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add to ${slot}`}>
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
  // HIG §7.2: at large text the trailing calories stack under the name/macros
  // (no clipping, no truncation) instead of colliding on one line.
  const large = useLargeText();
  const pending = item.pending;
  return (
    <Pressable
      haptic={false}
      minTapTarget={false}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        pending
          ? 'Analyzing scanned food…'
          : `${item.name}, ${item.quantityG} g, protein ${item.protein}, carbs ${item.carbs}, fat ${item.fat}, ${formatEnergy(item.calories, energyUnit)}`
      }
      accessibilityHint={pending ? undefined : 'Double tap to edit, swipe left to delete'}
      style={{
        backgroundColor: surface.card,
        flexDirection: large ? 'column' : 'row',
        alignItems: large ? 'flex-start' : 'center',
        gap: large ? space.xs : space.md,
        paddingHorizontal: space.lg,
        paddingVertical: large ? space.md : 0,
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
      {pending ? (
        // Analyzing state (Task 3) — the scanned row fills in once the mock/real
        // inference resolves. Same row height so the layout doesn't jump.
        <>
          <View style={{ flex: large ? undefined : 1, gap: space.xs, paddingVertical: space.sm }}>
            <Text variant="footnote" color={color.secondaryLabel}>
              Analyzing…
            </Text>
            <Skeleton width="60%" height={14} />
          </View>
          <Skeleton width={40} height={14} />
        </>
      ) : (
        <>
          <View style={{ flex: large ? undefined : 1, gap: space.xs, paddingVertical: large ? 0 : space.sm }}>
            <Text variant="body" color={color.label} numberOfLines={large ? 0 : 1}>
              {item.name}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel} numberOfLines={large ? 0 : 1}>
              {item.quantityG} g · P {item.protein} · C {item.carbs} · F {item.fat}
            </Text>
          </View>
          <Text variant="bodyMedium" color={color.label}>
            {formatEnergy(item.calories, energyUnit)}
          </Text>
        </>
      )}
    </Pressable>
  );
}
