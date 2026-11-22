// PHASE3_ROWS.md row 15: the shared meal slot name helper returns each slot's
// addMenu name in the asked language, and an unknown slot falls back the same
// way the old local map did (the missing addMenu.undefined key).
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { mealSlotName } from '@/lib/mealSlotName';
import type { MealSlot } from '@/lib/mock/data';

const SLOTS: [MealSlot, keyof typeof en.addMenu][] = [
  ['Breakfast', 'breakfast'],
  ['Lunch', 'lunch'],
  ['Dinner', 'dinner'],
  ['Snacks', 'snack'],
];

test.each([
  ['en', en],
  ['es', es],
])('every slot reads its %s addMenu name', (lng, locale) => {
  const t = i18n.getFixedT(lng);
  for (const [slot, key] of SLOTS) {
    expect(mealSlotName(t, slot)).toBe(locale.addMenu[key]);
  }
});

test('an unknown slot falls back to the missing addMenu.undefined key, as the old map did', () => {
  const t = i18n.getFixedT('en');
  expect(mealSlotName(t, 'Brunch' as MealSlot)).toBe(t('addMenu.undefined'));
});
