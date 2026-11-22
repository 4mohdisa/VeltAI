import type { TFunction } from 'i18next';

import type { MealSlot } from '@/lib/mock/data';

/** The addMenu key for each slot. Explicit because 'Snacks' is keyed `snack`. */
const SLOT_KEYS: Record<MealSlot, string> = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snacks: 'snack',
};

/** A meal slot's name in the active language, from the addMenu slot keys. */
export function mealSlotName(t: TFunction, slot: MealSlot): string {
  return t(`addMenu.${SLOT_KEYS[slot]}`);
}
