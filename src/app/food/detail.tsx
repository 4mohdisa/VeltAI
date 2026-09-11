// Food detail — the ONE sheet behind every food-detail surface (architecture
// item 4 in DECISIONS.md). It replaces four screens that all did the same job in
// slightly different clothes: the serving picker for a manual-search hit, the
// barcode product confirm, the meal-detail item editor and the universal item
// edit sheet.
//
// The subject arrives through `@/lib/food/detailSubject` — a store, never route
// params, because a food name and its macros are personal data and this repo
// keeps personal data out of query strings.
//
// Everything on screen traces to a real value: the search catalog is kcal-only,
// so search subjects show no macro fields at all rather than a fabricated zero.
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { EmptyState } from '@/components/display/EmptyState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { TextField } from '@/components/forms/TextField';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { formatCalories, formatNumber } from '@/lib/formatting';
import { haptics } from '@/lib/haptics';
import {
  deleteFoodItem,
  editFoodItem,
  editSavedFood,
  logMeal,
  lookupBarcodeAsync,
  saveFood,
  slotForNow,
  unsaveFood,
} from '@/lib/data';
import { useFoodStore } from '@/lib/data/foodStore';
import { SLOTS } from '@/lib/data/mappers';
import { basisOf, presetsFor, useDetailSubject, type DetailItem } from '@/lib/food/detailSubject';
import type { BarcodeProduct } from '@/lib/food/barcode';
import type { MealSlot } from '@/lib/mock/data';

// The search catalog carries no per-food serving suggestions, so a manual hit
// gets the standard four.
const SEARCH_SERVINGS = [50, 100, 150, 200];

/** What the sheet's fields hold. NO id: `logMeal` assigns the row's own, and a
 *  subject id spread into the write would overwrite it. */
type FoodValues = Omit<DetailItem, 'id'>;

export default function FoodDetailScreen() {
  // Read the subject ONCE. The sheet is about the thing it was opened on, so a
  // later store write (the next open, or a clear on the way out) must not swap
  // the content out from under a half-finished edit.
  const [subject] = useState(() => useDetailSubject.getState().subject);
  const clearDetail = useDetailSubject((s) => s.clearDetail);

  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [loading, setLoading] = useState(subject?.mode === 'barcode');

  // A logged row can go away behind this sheet — swipe-to-delete on the food tab,
  // a stale list, another device. Checked once, at open: editing a ghost is the
  // failure worth catching, and a LIVE check would swap the content out mid-
  // dismissal every time the sheet's own Delete ran.
  // ponytail: snapshot, not a subscription. Make it live if a real flow ever
  // deletes the row while this sheet is on screen.
  const [stillLogged] = useState(
    () =>
      subject?.mode !== 'logged' ||
      useFoodStore.getState().meals.some((m) => m.items.some((it) => it.id === subject.item.id)),
  );

  useEffect(() => {
    if (subject?.mode !== 'barcode') return;
    let active = true;
    void lookupBarcodeAsync(subject.code).then((found) => {
      if (!active) return;
      setProduct(found);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [subject]);

  const close = () => {
    clearDetail();
    if (router.canGoBack()) router.back();
  };

  // Logged and gone: the sheet is finished with, so drop the subject on the way
  // out and land back on the food tab.
  const logAndLeave = (name: string) => {
    clearDetail();
    showToast({ message: `Added ${name}.`, tone: 'success' });
    router.replace('/(tabs)/food');
  };

  if (!subject) {
    return (
      <SheetContent variant="leading" title="Food" onClose={close}>
        <EmptyState
          icon="fork.knife"
          title="Nothing to show"
          message="Open a food from your log, a search result or a scan."
        />
      </SheetContent>
    );
  }

  if (loading) {
    return (
      <SheetContent variant="leading" title="Looking up product…" onClose={close}>
        <SkeletonList rows={3} />
      </SheetContent>
    );
  }

  // The row was already gone when the sheet opened.
  if (!stillLogged) {
    return (
      <SheetContent variant="leading" title="Food" onClose={close}>
        <EmptyState icon="fork.knife" title="No longer in your log" message="This item has already been removed." />
      </SheetContent>
    );
  }

  if (subject.mode === 'search') {
    return (
      <DetailForm
        key={`search:${subject.name}`}
        title={subject.name}
        ctaLabel={`Add to ${slotForNow().toLowerCase()}`}
        seed={{
          name: subject.name,
          quantityG: 100,
          calories: Math.round(subject.kcalPer100),
          protein: 0,
          carbs: 0,
          fat: 0,
        }}
        subLine={`${formatCalories(subject.kcalPer100)} / 100g`}
        servings={SEARCH_SERVINGS}
        // Energy only: the search catalog has no macro columns, so nothing here
        // invents protein/carbs/fat — the log stores them as 0.
        per100={{ calories: subject.kcalPer100, protein: 0, carbs: 0, fat: 0 }}
        macros={false}
        onClose={close}
        onDone={(draft) => {
          // 'search' isn't an EntryMethod — 'manual' matches the saved-foods path.
          logMeal(slotForNow(), draft, 'manual');
          logAndLeave(draft.name);
        }}
      />
    );
  }

  if (subject.mode === 'barcode') {
    // Not found: the lookup resolved with no product (unknown code, or the
    // backend was unreachable). A real way out beats an infinite loader
    // (AUDIT_REPORT.md M1).
    if (!product) {
      return (
        <SheetContent variant="leading" title="Product not found" onClose={close}>
          <View style={{ gap: space.lg, alignItems: 'center', paddingVertical: space.lg }}>
            <Icon name="barcode-outline" size={40} color={color.tertiaryLabel} />
            <Text variant="body" color={color.label} style={{ textAlign: 'center' }}>
              We couldn&apos;t find that barcode. Try scanning again, or photograph the nutrition label instead.
            </Text>
            <Button title="Scan again" variant="secondary" onPress={() => router.replace('/food/barcode-scan')} />
          </View>
        </SheetContent>
      );
    }
    const p = product;
    const first = p.servingOptions[0] ?? 100;
    const scale = (per100: number) => Math.round((per100 * first) / 100);
    return (
      <DetailForm
        key={`barcode:${subject.code}`}
        title="Confirm product"
        ctaLabel={`Add to ${slotForNow().toLowerCase()}`}
        seed={{
          name: p.name,
          quantityG: first,
          calories: scale(p.kcalPer100),
          protein: scale(p.proteinPer100),
          carbs: scale(p.carbsPer100),
          fat: scale(p.fatPer100),
        }}
        subLine={`${p.brand ? `${p.brand} · ` : ''}${formatCalories(p.kcalPer100)} / 100g`}
        servings={p.servingOptions}
        per100={{
          calories: p.kcalPer100,
          protein: p.proteinPer100,
          carbs: p.carbsPer100,
          fat: p.fatPer100,
        }}
        macros
        onClose={close}
        onDone={(draft) => {
          logMeal(slotForNow(), draft, 'barcode');
          logAndLeave(draft.name);
        }}
      />
    );
  }

  if (subject.mode === 'saved') {
    const item = subject.item;
    return (
      <DetailForm
        key={`saved:${item.id}`}
        title="Edit food"
        ctaLabel="Save changes"
        seed={item}
        macros
        onClose={close}
        onDone={(draft) => {
          editSavedFood(item.id, {
            name: draft.name,
            servingG: draft.quantityG,
            calories: draft.calories,
            protein: draft.protein,
            carbs: draft.carbs,
            fat: draft.fat,
          });
          close();
        }}
        remove={{
          label: 'Remove from saved',
          confirm: `Remove ${item.name}?`,
          run: () => {
            unsaveFood(item.id);
            clearDetail();
            showToast({ message: 'Removed from saved.', tone: 'info' });
            if (router.canGoBack()) router.back();
          },
        }}
      />
    );
  }

  // 'review' edits the name only; 'logged' is the full item editor (V6): serving
  // presets scaled from the row's OWN per-gram values, read-only numbers until
  // "Edit values manually", and a meal switch that moves the row on the server.
  const item = subject.item;
  const review = subject.mode === 'review';
  const loggedSlot = subject.mode === 'logged' ? subject.slot : undefined;
  const basis = review ? null : basisOf(item);
  return (
    <DetailForm
      key={`${subject.mode}:${item.id}`}
      title={review ? 'Rename food' : 'Edit item'}
      ctaLabel={review ? 'Save name' : 'Save changes'}
      seed={item}
      servings={basis ? presetsFor(item.quantityG) : undefined}
      per100={basis ?? undefined}
      macros
      nameOnly={review}
      lockValues={!review}
      meal={loggedSlot}
      onClose={close}
      onDone={(draft, meal) => {
        editFoodItem(item.id, review ? { name: draft.name } : draft, meal !== loggedSlot ? meal : undefined);
        close();
      }}
      // Star equivalent: keep this logged food for one-tap re-adding later.
      onSaveToFoods={
        review
          ? undefined
          : (draft) => {
              saveFood({
                name: draft.name,
                servingG: draft.quantityG,
                calories: draft.calories,
                protein: draft.protein,
                carbs: draft.carbs,
                fat: draft.fat,
              });
              showToast({ message: `Saved ${draft.name} to your foods.`, tone: 'success' });
            }
      }
      remove={
        review
          ? undefined
          : {
              label: 'Delete item',
              confirm: `Delete ${item.name}?`,
              run: () => {
                deleteFoodItem(item.id);
                clearDetail();
                showToast({ message: 'Item deleted.', tone: 'info' });
                if (router.canGoBack()) router.back();
              },
            }
      }
    />
  );
}

// ---------------------------------------------------------------------------

type DetailFormProps = {
  title: string;
  seed: FoodValues;
  /** Line under the name: the brand and the energy density it came from. */
  subLine?: string;
  /** Suggested serving sizes in grams. Omitted when the subject has no catalog. */
  servings?: number[];
  /** Per-100 g basis. Picking a serving — or typing grams — re-derives the
   *  numbers from it, which is also what discards a manual override. */
  per100?: { calories: number; protein: number; carbs: number; fat: number };
  /** False when the source is energy-only (the search catalog). */
  macros: boolean;
  /** Review rename: the name is the only editable field. */
  nameOnly?: boolean;
  /** A logged row: its numbers are what was eaten, so they read as values —
   *  changed by picking a serving — until "Edit values manually" opens the fields. */
  lockValues?: boolean;
  /** The row's meal. Given → a meal switch, whose value goes to onDone. */
  meal?: MealSlot;
  onDone: (draft: FoodValues, meal?: MealSlot) => void;
  /** The primary pill's words. The design names what the pill does — "Save
   *  changes" for something already logged, "Add to lunch" for a new food. */
  ctaLabel: string;
  onSaveToFoods?: (draft: FoodValues) => void;
  remove?: { label: string; confirm: string; run: () => void };
  onClose: () => void;
};

// The whole sheet body. Field state is seeded from `seed` and re-seeded by the
// caller's `key` when a different subject opens.
function DetailForm({
  title,
  seed,
  subLine,
  servings,
  per100,
  macros,
  nameOnly = false,
  lockValues = false,
  meal,
  onDone,
  ctaLabel,
  onSaveToFoods,
  remove,
  onClose,
}: DetailFormProps) {
  const [manual, setManual] = useState(!lockValues);
  const [slot, setSlot] = useState(meal);
  const [name, setName] = useState(seed.name);
  const [grams, setGrams] = useState(String(seed.quantityG));
  const [calories, setCalories] = useState(String(seed.calories));
  const [protein, setProtein] = useState(String(seed.protein));
  const [carbs, setCarbs] = useState(String(seed.carbs));
  const [fat, setFat] = useState(String(seed.fat));

  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));

  const draft = (): FoodValues => ({
    name: name.trim() || seed.name,
    quantityG: num(grams),
    calories: num(calories),
    protein: num(protein),
    carbs: num(carbs),
    fat: num(fat),
  });

  // Changing the serving rescales from the product/catalog basis — so it also
  // throws away whatever was typed over the top of the last serving.
  const applyGrams = (next: string) => {
    setGrams(next);
    if (!per100) return;
    const factor = num(next) / 100;
    setCalories(String(Math.round(per100.calories * factor)));
    setProtein(String(Math.round(per100.protein * factor)));
    setCarbs(String(Math.round(per100.carbs * factor)));
    setFat(String(Math.round(per100.fat * factor)));
  };

  return (
    <SheetContent variant="leading" title={title} onClose={onClose}>
      {subLine ? (
        <Card>
          <View style={{ gap: space.xs }}>
            <Text variant="title3" color={color.label}>
              {name}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel}>
              {subLine}
            </Text>
          </View>
        </Card>
      ) : null}

      {servings && servings.length > 0 ? (
        <SegmentedField
          label="Serving size"
          value={grams}
          onChange={applyGrams}
          options={servings.map((g) => ({ label: `${g} g`, value: String(g) }))}
          variant="inset"
        />
      ) : null}

      {/* The design's readout: energy as the hero rounded number over the grams
          it belongs to. It mirrors the fields below — never a second source. */}
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
          <Text variant="statLarge" color={color.label}>
            {formatNumber(num(calories))}
          </Text>
          <Text variant="callout" color={color.secondaryLabel}>
            kcal
          </Text>
        </View>
        <Text variant="footnote" color={color.secondaryLabel}>
          for {num(grams)} g
        </Text>
      </View>

      <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

      {nameOnly ? null : !manual ? (
        <>
          {macros ? (
            <View style={{ gap: space.md }}>
              {(
                [
                  ['Protein', protein, categoryAccent.protein],
                  ['Carbs', carbs, categoryAccent.carbs],
                  ['Fat', fat, categoryAccent.fat],
                ] as const
              ).map(([label, value, tint]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
                  <Text variant="body" color={color.label} style={{ flex: 1 }}>
                    {label}
                  </Text>
                  <Text variant="bodyMedium" color={color.label}>
                    {`${num(value)} g`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Pressable
            onPress={() => setManual(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit values manually"
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}
          >
            <Icon name="pencil" size={15} color={color.secondaryLabel} />
            <Text variant="callout" color={color.secondaryLabel}>
              Edit values manually
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Serving (g)"
                value={grams}
                onChangeText={applyGrams}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Calories" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" />
            </View>
          </View>

          {macros ? (
            <>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Protein (g)"
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <TextField label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
                </View>
                <View style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            // No macro fields, and no zeros dressed as measurements: the search
            // database returns energy only.
            <Text variant="footnote" color={color.secondaryLabel}>
              This search result has calories only — the food database carries no protein, carbs or fat for it.
            </Text>
          )}
        </>
      )}

      {/* The design's primary action: a full-width black pill after the fields,
          above the secondary "save" and the destructive remove. */}
      {slot ? (
        <SegmentedField
          label="Meal"
          value={slot}
          onChange={(v) => setSlot(v)}
          options={SLOTS.map((s) => ({ label: s, value: s }))}
          variant="inset"
        />
      ) : null}

      <Button title={ctaLabel} onPress={() => onDone(draft(), slot)} />

      {onSaveToFoods ? (
        <Button
          title="Save to my foods"
          variant="secondary"
          icon="bookmark-outline"
          onPress={() => onSaveToFoods(draft())}
        />
      ) : null}

      {remove ? (
        <Button
          title={remove.label}
          variant="destructive"
          icon="trash"
          // Confirm before deleting — the global destructive rule, same pattern
          // as SwipeableRow.
          onPress={() => {
            haptics.warning();
            Alert.alert(remove.confirm, undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  haptics.impactHeavy();
                  remove.run();
                },
              },
            ]);
          }}
        />
      ) : null}
    </SheetContent>
  );
}
