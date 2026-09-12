// Fibre, end to end — and honest about where it does not exist.
//
// WHAT EACH SOURCE ACTUALLY PROVIDES:
//   Open Food Facts  fiber_100g, present for SOME products only. Absent → null
//                    (backend/internal/food/search.go), never 0.
//   USDA FDC         nutrient 1079, present when measured. Absent → null.
//   Gemini scan      asks for "fibre" but instructs "use 0 for unknown", so its
//                    0 is ambiguous; the scan path stores what it returns and is
//                    not treated as authoritative here.
//   Typed by hand    label-scan and custom-food already collect a real number.
//
// So an item carries `fibre` only when its source had one, and the day's total
// counts exactly those items. Nothing invents a 0.
import { fibreTotal } from '@/lib/data/summaryCards';
import { logInputFromItem, logPatchFromItem, mealsFromLogs, savedInputFromApp } from '@/lib/data/mappers';
import { basisOf } from '@/lib/food/detailSubject';
import type { FoodLog } from '@/lib/api';
import type { StoredMeal } from '@/lib/data/foodStore';

const log = (over: Partial<FoodLog> & { id: string }): FoodLog => ({
  user_id: 'u1',
  date: '2026-09-12',
  meal_type: 'Breakfast',
  food_name: 'Porridge',
  brand: null,
  barcode: null,
  quantity: 200,
  unit: 'g',
  calories: 340,
  protein: 12,
  carbs: 58,
  fat: 6,
  fibre: 0,
  source: 'manual',
  created_at: '2026-09-12T07:30:00Z',
  ...over,
});

const meal = (items: StoredMeal['items']): StoredMeal => ({
  id: 'm1', slot: 'Breakfast', time: '07:30', method: 'manual', calories: 0, protein: 0, carbs: 0, fat: 0, items,
});
const item = (over: Partial<StoredMeal['items'][number]> = {}) => ({
  id: 'i1', name: 'Porridge', quantityG: 200, calories: 340, protein: 12, carbs: 58, fat: 6, ...over,
});

describe('the write path sends fibre only when it is known', () => {
  test('a known figure is sent', () => {
    const input = logInputFromItem('Breakfast', { name: 'Porridge', quantityG: 200, calories: 340, protein: 12, carbs: 58, fat: 6, fibre: 7 }, 'manual', '2026-09-12');
    expect(input.fibre).toBe(7);
  });

  test('an unknown one is omitted, not sent as 0', () => {
    const input = logInputFromItem('Breakfast', { name: 'Chicken', quantityG: 150, calories: 250, protein: 46, carbs: 0, fat: 6 }, 'manual', '2026-09-12');
    expect(input.fibre).toBeUndefined();
    expect('fibre' in input && input.fibre !== undefined).toBe(false);
  });

  test('an edit carries fibre through the patch', () => {
    expect(logPatchFromItem({ fibre: 9 }).fibre).toBe(9);
    expect(logPatchFromItem({ calories: 100 }).fibre).toBeUndefined();
  });

  test('saving a food no longer claims a fabricated 0 g', () => {
    const withOut = savedInputFromApp({ name: 'Chicken', servingG: 150, calories: 250, protein: 46, carbs: 0, fat: 6 });
    expect(withOut.fibre).toBeUndefined();
    const withIt = savedInputFromApp({ name: 'Oats', servingG: 100, calories: 380, protein: 13, carbs: 67, fat: 7, fibre: 10 });
    expect(withIt.fibre).toBe(10);
  });
});

describe('the read path keeps unknown unknown', () => {
  test('a positive stored fibre comes back on the item', () => {
    const [m] = mealsFromLogs([log({ id: 'a', fibre: 7 })]);
    expect(m.items[0].fibre).toBe(7);
  });

  // food_logs.fibre is a plain number, so a stored 0 cannot be told apart from
  // "never recorded". Treating it as unknown is the conservative direction.
  test('a stored 0 is treated as "no figure", not as a measured zero', () => {
    const [m] = mealsFromLogs([log({ id: 'b', fibre: 0 })]);
    expect(m.items[0].fibre).toBeUndefined();
  });
});

describe("the day's total counts only what is known", () => {
  test('no item has fibre → nothing to report', () => {
    expect(fibreTotal([meal([item(), item({ id: 'i2' })])])).toMatchObject({ consumed: 0, known: false, withFibre: 0 });
  });

  test('some items have it → the total is those items, and it says how many', () => {
    const t = fibreTotal([meal([item({ fibre: 7 }), item({ id: 'i2' }), item({ id: 'i3', fibre: 4 })])]);
    expect(t).toMatchObject({ consumed: 11, known: true, items: 3, withFibre: 2 });
  });
});

describe('a serving change rescales fibre, and never conjures it', () => {
  test('a row with fibre scales per 100 g', () => {
    expect(basisOf({ id: 'x', name: 'Oats', quantityG: 200, calories: 340, protein: 12, carbs: 58, fat: 6, fibre: 8 })?.fibre).toBe(4);
  });

  test('a row without fibre has none in its basis', () => {
    expect(basisOf({ id: 'x', name: 'Chicken', quantityG: 150, calories: 250, protein: 46, carbs: 0, fat: 6 })).not.toHaveProperty('fibre');
  });
});
