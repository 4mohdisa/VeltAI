// Quick Add — a native formSheet: just calories (+ meal slot), no macro
// breakdown. Posts to /api/food/quick-add, then reflects the row in the local
// food log so it shows immediately.
//
// V1 design pass: the design's Quick add is a hero kcal figure flanked by ±50
// discs, four +kcal preset pills, the meal chips and a black confirm pill.
// Tapping the figure opens NumberEntryBar over the keyboard and hides the
// discs, presets and pill until Done — the design's one number-entry model, so
// there is no boxed field and no stepper here.
//
// Offline (audit 2026-08-06): a transient failure QUEUES the equivalent
// /api/food/logs create (idempotency-keyed replay) — pre-audit the failure was
// swallowed, the row lived only in this session's store, and the success toast
// lied: the entry vanished at next launch. A permanent 4xx keeps the sheet
// open with an error instead of pretending.
//
// ponytail: the local reflection uses the store's logMeal (local-only) rather than
// the mutations wrapper — quickAdd already creates the server food_logs row, so
// the mutations wrapper's extra POST would double-write. Store insert avoids that
// and is replaced by the real row on the next hydration.
import { useState } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SheetContent } from '@/components/navigation/SheetContent';
import { NumberEntryBar } from '@/components/common/NumberEntryBar';
import { Button, SegmentedField } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, layout, radius, space, surface } from '@/lib/design/tokens';
import { formatCalories, formatNumber } from '@/lib/formatting';
import { slotForNow } from '@/lib/data';
import { selectedFoodDate, useFoodStore } from '@/lib/data/foodStore';
import { api, isTransient } from '@/lib/api';
import { runOrQueue } from '@/lib/offline/queue';
import type { MealSlot } from '@/lib/mock/data';

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const SLOT_KEYS: Record<MealSlot, string> = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snacks: 'snack',
};
/** The design's figure: 250 kcal to start, ±50 on the discs, four add-on presets. */
const DEFAULT_KCAL = 250;
const STEP = 50;
const PRESETS = [100, 250, 500, 750];
/** The design's glyph size inside the discs — no token covers it. */
const DISC_GLYPH = 20;

export default function QuickAddScreen() {
  const { t } = useTranslation();
  // Slot targeting from the food log's per-meal "+" (via the add menu).
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const initialSlot = SLOTS.includes(slot as MealSlot) ? (slot as MealSlot) : slotForNow();
  const [kcal, setKcal] = useState(DEFAULT_KCAL);
  // Raw entry string while the bar is open; empty greys the figure out, as the
  // design does, to show the typed number will replace it.
  const [entry, setEntry] = useState('');
  const [editing, setEditing] = useState(false);
  const [mealType, setMealType] = useState<MealSlot>(initialSlot);
  const [submitting, setSubmitting] = useState(false);

  const invalid = kcal <= 0;

  const add = async () => {
    if (invalid) return;
    setSubmitting(true);
    const name = 'Quick add';
    const item = { name, quantityG: 0, calories: kcal, protein: 0, carbs: 0, fat: 0 };
    let toast = t('foodLog.addedToMeal', {
      energy: formatCalories(kcal),
      slot: t(`addMenu.${SLOT_KEYS[mealType]}`).toLowerCase(),
    });
    try {
      await api.foodLogs.quickAdd({ calories: kcal, meal_type: mealType, date: selectedFoodDate() });
    } catch (e) {
      if (!isTransient(e)) {
        showToast({ message: t('food.quickAddFailed'), tone: 'error' });
        setSubmitting(false);
        return;
      }
      // Offline / server down: queue the equivalent create so the entry
      // survives a restart and replays exactly once.
      await runOrQueue('/api/food/logs', {
        date: selectedFoodDate(),
        meal_type: mealType,
        food_name: name,
        calories: kcal,
        source: 'quick_add',
      });
      toast = t('food.quickAddOffline', { calories: formatCalories(kcal) });
    }
    // Reflect locally so the food log updates immediately.
    useFoodStore.getState().logMeal(mealType, item, 'manual');
    showToast({ message: toast, tone: 'success' });
    // Clear the busy state when we can't navigate away (deep-linked as the entry
    // route), otherwise the button spins forever (AUDIT_REPORT.md M4).
    if (router.canGoBack()) router.back();
    else setSubmitting(false);
  };

  const disc = (name: 'remove' | 'add', a11y: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityLabel={a11y}
      style={({ pressed }) => ({
        width: layout.buttonHeight,
        height: layout.buttonHeight,
        borderRadius: radius.full,
        backgroundColor: pressed ? surface.tilePressed : surface.tile,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon name={name} size={DISC_GLYPH} color={color.label} />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <SheetContent variant="leading" title={t('addMenu.quickAdd')} onClose={() => router.canGoBack() && router.back()}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
          {editing ? null : disc('remove', t('food.quickAddDecrease', { step: STEP }), () => setKcal((n) => Math.max(0, n - STEP)))}
          <Pressable
            onPress={() => {
              setEntry('');
              setEditing((open) => !open);
            }}
            minTapTarget={false}
            accessibilityLabel={t('food.tileEditLabel', { label: t('gymLog.celebration.calories') })}
            style={{ flex: 1, alignItems: 'center', borderRadius: radius.md }}
          >
            {/* The design's hero figure: tight tracking, greyed while it waits
                for the first keystroke. */}
            <Text variant="statHero" color={editing && !entry ? color.tertiaryLabel : color.label} style={{ letterSpacing: -1.4 }}>
              {formatNumber(kcal)}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel}>
              {editing ? t('dashboard.kcal') : t('food.quickAddKcalHint')}
            </Text>
          </Pressable>
          {editing ? null : disc('add', t('food.quickAddIncrease', { step: STEP }), () => setKcal((n) => n + STEP))}
        </View>

        {editing ? null : (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setKcal((n) => n + preset)}
                minTapTarget={false}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: layout.tapTarget,
                  borderRadius: radius.pill,
                  backgroundColor: pressed ? surface.tilePressed : surface.tile,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                {/* 15/20 semibold — the design's preset pill, no token covers it. */}
                <Text color={color.label} style={{ fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
                  {`+${preset}`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ gap: space.sm }}>
          <Text variant="label" color={color.secondaryLabel} style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>
            {t('food.quickAddMeal')}
          </Text>
          <SegmentedField<MealSlot>
            value={mealType}
            onChange={setMealType}
            options={SLOTS.map((s) => ({ label: t(`addMenu.${SLOT_KEYS[s]}`), value: s }))}
            variant="inset"
            compact
          />
        </View>

        {editing ? null : (
          // Less padding lets the Button's 52pt minHeight set the pill's height, as in the design.
          <Button
            title={t('food.quickAddAction', { calories: formatCalories(kcal) })}
            onPress={() => void add()}
            disabled={invalid}
            loading={submitting}
            style={{ paddingVertical: space.md }}
          />
        )}
      </SheetContent>

      {editing ? (
        <NumberEntryBar
          label={t('food.padCalories')}
          value={entry}
          mode="numeric"
          maxLength={5}
          onChange={(text, value) => {
            setEntry(text);
            setKcal(Math.round(value));
          }}
          onDone={() => setEditing(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
