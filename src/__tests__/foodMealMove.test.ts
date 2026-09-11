// V6 — the detail sheet's meal switch is a real server write. Moving a logged
// row sends ONE PATCH carrying meal_type alongside the edit, and the store
// regroups the row under its new meal; an edit that stays put sends no
// meal_type at all. Also pins the presets' honest basis: the row's own values.
//
// fetch is mocked (as in gymLogToCalendar.test.ts).
import { __resetForTests } from '@/lib/offline/queue';
import { editFoodItem } from '@/lib/data/mutations';
import { useFoodStore, type StoredMeal } from '@/lib/data/foodStore';
import { basisOf, presetsFor } from '@/lib/food/detailSubject';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const ID = '0a1b2c3d-0000-4000-8000-000000000001';
const rice = { id: ID, name: 'Rice', quantityG: 200, calories: 400, protein: 8, carbs: 88, fat: 2 };
const steak = { id: '0a1b2c3d-0000-4000-8000-000000000002', name: 'Steak', quantityG: 250, calories: 600, protein: 60, carbs: 0, fat: 40 };
const meal = (slot: StoredMeal['slot'], items: StoredMeal['items']): StoredMeal => ({
  id: `m-${slot}`, slot, time: '12:30', method: 'manual', calories: 0, protein: 0, carbs: 0, fat: 0, items,
});

type Call = [string, RequestInit?];
let fetchMock: jest.Mock;
const patches = () =>
  (fetchMock.mock.calls as Call[])
    .filter(([, init]) => init?.method === 'PATCH')
    .map(([url, init]) => ({ path: url.replace('http://localhost:8080', ''), body: JSON.parse(String(init?.body ?? '{}')) }));
const flush = () => new Promise((r) => setImmediate(r));
const day = (meals: StoredMeal[]) => {
  const s = useFoodStore.getState();
  s.setDayMeals(s.selectedDate, meals);
};

beforeEach(async () => {
  await __resetForTests();
  useFoodStore.getState().reset();
  fetchMock = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {}, error: null }) }));
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

test('moving a row PATCHes meal_type with the edit, and the store regroups it', async () => {
  day([meal('Lunch', [rice])]);
  editFoodItem(ID, { quantityG: 400, calories: 800 }, 'Dinner');
  await flush();

  expect(patches()).toEqual([{ path: `/api/food/logs/${ID}`, body: { meal_type: 'Dinner', quantity: 400, calories: 800 } }]);
  const meals = useFoodStore.getState().meals;
  // Lunch emptied, so it is gone; Dinner holds the edited row and its total.
  expect(meals.map((m) => m.slot)).toEqual(['Dinner']);
  expect(meals[0]).toMatchObject({ calories: 800, items: [expect.objectContaining({ id: ID, quantityG: 400 })] });
});

test('moving into a meal that exists joins it and re-totals both', async () => {
  day([meal('Lunch', [rice, steak]), meal('Dinner', [])]);
  day([meal('Lunch', [rice]), meal('Dinner', [steak])]);
  editFoodItem(ID, {}, 'Dinner');
  await flush();

  expect(patches()[0].body).toEqual({ meal_type: 'Dinner' });
  const meals = useFoodStore.getState().meals;
  expect(meals.map((m) => m.slot)).toEqual(['Dinner']);
  expect(meals[0].items.map((it) => it.name)).toEqual(['Steak', 'Rice']);
  expect(meals[0].calories).toBe(1000);
});

test('an edit that stays in its meal sends no meal_type and moves nothing', async () => {
  day([meal('Lunch', [rice])]);
  editFoodItem(ID, { calories: 420 });
  await flush();

  expect(patches()[0].body).toEqual({ calories: 420 });
  expect(useFoodStore.getState().meals.map((m) => m.slot)).toEqual(['Lunch']);
});

describe('presets scale from the row itself', () => {
  test('the basis is the row per 100 g — and carries no fibre, which the log never stored', () => {
    expect(basisOf(rice)).toEqual({ calories: 200, protein: 4, carbs: 44, fat: 1 });
    expect(Object.keys(basisOf(rice) ?? {})).not.toContain('fibre');
  });

  test('a row with no weight has no basis, so it gets no presets rather than invented ones', () => {
    expect(basisOf({ ...rice, quantityG: 0 })).toBeNull();
    expect(presetsFor(0)).toEqual([]);
  });

  test('presets are half, as logged, one and a half and double — deduped when tiny', () => {
    expect(presetsFor(200)).toEqual([100, 200, 300, 400]);
    expect(presetsFor(1)).toEqual([1, 2]);
  });
});
