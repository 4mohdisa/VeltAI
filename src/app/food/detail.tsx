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
// Everything on screen traces to a real value: a search result carries its own
// per-100 g macros, so the search subject shows the same macro fields as the rest.
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SheetContent } from '@/components/navigation/SheetContent';
import { NumberEntryBar, type NumberEntryMode } from '@/components/common/NumberEntryBar';
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
import { categoryAccent, color, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
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

/** The design's six pads, with its own captions and keyboards: grams and energy
 *  are whole numbers, the macros take a decimal point. Every one caps at six
 *  digits, which is NumberEntryBar's default, so none passes `maxLength`. */
type PadKey = 'grams' | 'calories' | 'protein' | 'carbs' | 'fat' | 'fibre';
const PADS: Record<PadKey, { label: string; mode: NumberEntryMode }> = {
  grams: { label: 'Serving size · grams', mode: 'numeric' },
  calories: { label: 'Calories · kcal', mode: 'numeric' },
  protein: { label: 'Protein · grams', mode: 'decimal' },
  carbs: { label: 'Carbs · grams', mode: 'decimal' },
  fat: { label: 'Fat · grams', mode: 'decimal' },
  fibre: { label: 'Fibre · grams', mode: 'decimal' },
};

/** The design keeps protein, carbs and fat to 1 decimal place: ×10, round, ÷10. */
const MACRO_PRECISION = 10;

/** The design's grams chip: a 34pt pill with a 15/20 rounded figure and a 13pt
 *  pencil. No type or spacing token covers either figure. */
const CHIP_HEIGHT = 34;
const CHIP_GLYPH = 13;

/** What the sheet's fields hold. NO id: `logMeal` assigns the row's own, and a
 *  subject id spread into the write would overwrite it. */
type FoodValues = Omit<DetailItem, 'id'>;

export default function FoodDetailScreen() {
  const { t } = useTranslation();
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
          protein: subject.proteinPer100 ?? 0,
          carbs: subject.carbsPer100 ?? 0,
          fat: subject.fatPer100 ?? 0,
          // Only when the source actually had one (OFF omits it for most products).
          ...(subject.fibrePer100 != null ? { fibre: subject.fibrePer100 } : {}),
        }}
        subLine={`${formatCalories(subject.kcalPer100)} / 100g`}
        servings={SEARCH_SERVINGS}
        // A catalog result may carry macros; one that doesn't falls back to 0
        // (the local dev catalog carries calories only).
        per100={{
          calories: subject.kcalPer100,
          protein: subject.proteinPer100 ?? 0,
          carbs: subject.carbsPer100 ?? 0,
          fat: subject.fatPer100 ?? 0,
          ...(subject.fibrePer100 != null ? { fibre: subject.fibrePer100 } : {}),
        }}
        macros
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
    const scale = (per100: number) => (per100 * first) / 100;
    return (
      <DetailForm
        key={`barcode:${subject.code}`}
        title="Confirm product"
        ctaLabel={`Add to ${slotForNow().toLowerCase()}`}
        seed={{
          name: p.name,
          quantityG: first,
          calories: Math.round(scale(p.kcalPer100)),
          protein: scale(p.proteinPer100),
          carbs: scale(p.carbsPer100),
          fat: scale(p.fatPer100),
          ...(p.fibrePer100 != null ? { fibre: scale(p.fibrePer100) } : {}),
        }}
        subLine={`${p.brand ? `${p.brand} · ` : ''}${formatCalories(p.kcalPer100)} / 100g`}
        servings={p.servingOptions}
        per100={{
          calories: p.kcalPer100,
          protein: p.proteinPer100,
          carbs: p.carbsPer100,
          fat: p.fatPer100,
          ...(p.fibrePer100 != null ? { fibre: p.fibrePer100 } : {}),
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
            ...(draft.fibre != null ? { fibre: draft.fibre } : {}),
          });
          close();
        }}
        remove={{
          label: t('food.savedRemoveAction'),
          confirm: t('food.unsaveTitle', { name: item.name }),
          run: () => {
            unsaveFood(item.id);
            clearDetail();
            showToast({ message: t('food.savedRemoved'), tone: 'info' });
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
                ...(draft.fibre != null ? { fibre: draft.fibre } : {}),
              });
              showToast({ message: `Saved ${draft.name} to your foods.`, tone: 'success' });
            }
      }
      remove={
        review
          ? undefined
          : {
              label: t('food.deleteItem'),
              confirm: t('food.deleteConfirm', { name: item.name }),
              run: () => {
                deleteFoodItem(item.id);
                clearDetail();
                showToast({ message: t('food.deleteToast', { name: item.name }), tone: 'info' });
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
  per100?: { calories: number; protein: number; carbs: number; fat: number; fibre?: number };
  /** False when the source carries no macros at all. */
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
  const { t } = useTranslation();
  const [manual, setManual] = useState(!lockValues);
  const [slot, setSlot] = useState(meal);
  const [name, setName] = useState(seed.name);
  const [grams, setGrams] = useState(String(seed.quantityG));
  const [calories, setCalories] = useState(String(seed.calories));
  const [protein, setProtein] = useState(String(seed.protein));
  const [carbs, setCarbs] = useState(String(seed.carbs));
  const [fat, setFat] = useState(String(seed.fat));
  // Undefined stays undefined: a food whose source had no fibre figure must not
  // acquire one by being opened.
  const [fibre, setFibre] = useState<number | undefined>(seed.fibre);
  // Which pad is open, and its raw entry string. One pad at a time, as in the
  // design (`hEdit` / `hEditStr` there).
  const [editing, setEditing] = useState<PadKey | null>(null);
  const [entry, setEntry] = useState('');

  const num = (v: string, precision = 1) => Math.max(0, Math.round((Number(v) || 0) * precision) / precision);

  const draft = (): FoodValues => ({
    name: name.trim() || seed.name,
    quantityG: num(grams),
    calories: num(calories),
    protein: num(protein, MACRO_PRECISION),
    carbs: num(carbs, MACRO_PRECISION),
    fat: num(fat, MACRO_PRECISION),
    ...(fibre != null ? { fibre: num(String(fibre), MACRO_PRECISION) } : {}),
  });

  // Changing the serving rescales from the product/catalog basis — so it also
  // throws away whatever was typed over the top of the last serving.
  const applyGrams = (next: string) => {
    setGrams(next);
    if (!per100) return;
    const factor = num(next) / 100;
    setCalories(String(Math.round(per100.calories * factor)));
    setProtein(String(per100.protein * factor));
    setCarbs(String(per100.carbs * factor));
    setFat(String(per100.fat * factor));
    if (per100.fibre != null) setFibre(per100.fibre * factor);
  };

  // The pad writes straight into the field it was opened on. Grams goes through
  // applyGrams, which re-derives the rest — the design's "editing grams clears
  // every other override", and the same path a serving chip takes.
  const setPadValue: Record<PadKey, (value: number) => void> = {
    grams: (v) => applyGrams(String(Math.round(v))),
    calories: (v) => setCalories(String(v)),
    protein: (v) => setProtein(String(v)),
    carbs: (v) => setCarbs(String(v)),
    fat: (v) => setFat(String(v)),
    // The one number held as a number; display and save round it to 1 decimal place.
    fibre: (v) => setFibre(v),
  };

  // Tapping the open field closes the pad, any other field switches it, and the
  // entry string always starts empty.
  const startEdit = (key: PadKey) => () => {
    setEntry('');
    setEditing((open) => (open === key ? null : key));
  };

  // The figure greys while the pad waits for its first keystroke, to show the
  // typed number will replace it.
  const figureColor = (key: PadKey) => (editing === key && !entry ? color.tertiaryLabel : color.label);

  const kcalRow = (tint: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
      <Text variant="statLarge" color={tint} style={{ letterSpacing: -1 }}>
        {formatNumber(num(calories))}
      </Text>
      <Text variant="callout" color={color.secondaryLabel}>
        kcal
      </Text>
    </View>
  );

  // Numbers are tap-to-edit once the sheet is in its editing mode. A review
  // (rename) sheet never is: only the name goes to `onDone` there.
  const editable = !nameOnly && manual;
  const showServings = !!servings && servings.length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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

        {/* Serving size: the design shares one row between the caption and the
            tappable grams chip, over the food's own presets. With no chip there is
            nothing to share the row with, so the presets carry their own label. */}
        {showServings || editable ? (
          <View style={{ gap: space.sm }}>
            {editable ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text
                  variant="label"
                  color={color.secondaryLabel}
                  style={{ flex: 1, letterSpacing: 1.1, textTransform: 'uppercase' }}
                >
                  Serving size
                </Text>
                <Pressable
                  onPress={startEdit('grams')}
                  minTapTarget={false}
                  accessibilityLabel="Serving size, tap to type"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.xs,
                    minHeight: CHIP_HEIGHT,
                    paddingHorizontal: space.md,
                    borderRadius: radius.pill,
                    backgroundColor: editing === 'grams' ? surface.tilePressed : surface.tile,
                  }}
                >
                  <Text
                    color={figureColor('grams')}
                    style={{ fontSize: 15, lineHeight: 20, fontFamily: ROUNDED_FACE_BY_WEIGHT['600'] }}
                  >
                    {`${num(grams)} g`}
                  </Text>
                  {editing === 'grams' ? null : <Icon name="pencil" size={CHIP_GLYPH} color={color.tertiaryLabel} />}
                </Pressable>
              </View>
            ) : null}
            {servings && servings.length > 0 ? (
              <SegmentedField
                label={editable ? undefined : 'Serving size'}
                value={grams}
                onChange={applyGrams}
                options={servings.map((g) => ({ label: `${g} g`, value: String(g) }))}
                variant="inset"
              />
            ) : null}
          </View>
        ) : null}

        {/* The design's readout: energy as the hero rounded number over the grams
            it belongs to. It mirrors the fields below — never a second source. */}
        <View style={{ alignItems: 'center', gap: space.xs }}>
          {editable ? (
            <Pressable
              onPress={startEdit('calories')}
              minTapTarget={false}
              accessibilityLabel="Calories, tap to type"
              style={{
                paddingHorizontal: space.sm,
                paddingVertical: space.xs,
                borderRadius: radius.sm,
                backgroundColor: editing === 'calories' ? surface.tile : 'transparent',
              }}
            >
              {kcalRow(figureColor('calories'))}
            </Pressable>
          ) : (
            kcalRow(color.label)
          )}
          <Text variant="footnote" color={color.secondaryLabel}>
            for {num(grams)} g
          </Text>
        </View>

        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

        {nameOnly ? null : !manual ? (
          <>
            {macros ? (
              <View style={{ gap: space.md }}>
                {[
                  { label: 'Protein', value: num(protein, MACRO_PRECISION), tint: categoryAccent.protein },
                  { label: 'Carbs', value: num(carbs, MACRO_PRECISION), tint: categoryAccent.carbs },
                  { label: 'Fat', value: num(fat, MACRO_PRECISION), tint: categoryAccent.fat },
                  // Fibre only when this food's source carried one — the row is
                  // absent rather than showing a 0 nobody measured.
                  ...(fibre != null ? [{ label: 'Fibre', value: num(String(fibre), MACRO_PRECISION), tint: categoryAccent.fibre }] : []),
                ].map(({ label, value, tint }) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
                    <Text variant="body" color={color.label} style={{ flex: 1 }}>
                      {label}
                    </Text>
                    <Text variant="bodyMedium" color={color.label}>
                      {`${value} g`}
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
        ) : macros ? (
          /* The design's macro grid: two columns of tappable tiles, each a dot, its
             name and the value in grams. Tapping one opens its pad; grams and energy
             are edited on the chip and the readout above. */
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.sm }}>
            {[
              { key: 'protein' as const, label: 'Protein', value: num(protein, MACRO_PRECISION), tint: categoryAccent.protein },
              { key: 'carbs' as const, label: 'Carbs', value: num(carbs, MACRO_PRECISION), tint: categoryAccent.carbs },
              { key: 'fat' as const, label: 'Fat', value: num(fat, MACRO_PRECISION), tint: categoryAccent.fat },
              // Fibre only when this food's source carried one — the tile is
              // absent rather than showing a 0 nobody measured.
              ...(fibre != null
                ? [{ key: 'fibre' as const, label: 'Fibre', value: num(String(fibre), MACRO_PRECISION), tint: categoryAccent.fibre }]
                : []),
            ].map(({ key, label, value, tint }) => (
              <Pressable
                key={key}
                onPress={startEdit(key)}
                minTapTarget={false}
                accessibilityLabel={`${label}, tap to type`}
                // Two columns, leaving the design's gap between them.
                style={{
                  width: '48%',
                  gap: space.xs,
                  padding: space.md,
                  borderRadius: radius.md,
                  backgroundColor: editing === key ? surface.tile : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <View style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: tint }} />
                  <Text variant="caption" color={color.secondaryLabel}>
                    {label}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
                  <Text variant="statSmall" color={figureColor(key)}>
                    {value}
                  </Text>
                  <Text variant="caption" color={color.tertiaryLabel}>
                    g
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

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
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
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

      {editing ? (
        <NumberEntryBar
          label={PADS[editing].label}
          value={entry}
          mode={PADS[editing].mode}
          onChange={(text, value) => {
            setEntry(text);
            setPadValue[editing](value);
          }}
          onDone={() => setEditing(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
