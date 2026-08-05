// Data mappers (src/lib/data/mappers.ts) — pure API-row → app-shape transforms.
import {
  isServerId,
  todayISO,
  mealsFromLogs,
  streakFromApi,
  sessionsFromApi,
  savedFoodFromApi,
  subscriptionFromApi,
  barcodeProductFromApi,
} from '@/lib/data/mappers';
import type { FoodLog, GymStreak, GymSession, SavedFood, SubscriptionStatus, FoodSearchResult } from '@/lib/api';
import type { Streak } from '@/lib/data/gymStore';

function foodLog(o: Partial<FoodLog>): FoodLog {
  return {
    id: 'srv-1',
    user_id: 'u',
    date: '2026-07-14',
    meal_type: 'Lunch',
    food_name: 'Rice',
    brand: null,
    barcode: null,
    quantity: 100,
    unit: 'g',
    calories: 200,
    protein: 5,
    carbs: 40,
    fat: 1,
    fibre: 2,
    source: 'manual',
    created_at: '2026-07-14T12:30:00Z',
    ...o,
  };
}

test('todayISO is YYYY-MM-DD', () => {
  expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('isServerId distinguishes UUIDs from local ids', () => {
  expect(isServerId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  expect(isServerId('it_1')).toBe(false);
  expect(isServerId('s1')).toBe(false);
});

test('mealsFromLogs groups rows by slot and sums macros', () => {
  const meals = mealsFromLogs([
    foodLog({ id: 'a', calories: 200, protein: 5 }),
    foodLog({ id: 'b', calories: 300, protein: 10 }),
    foodLog({ id: 'c', meal_type: 'Breakfast', calories: 150 }),
  ]);
  const lunch = meals.find((m) => m.slot === 'Lunch');
  expect(lunch?.items).toHaveLength(2);
  expect(lunch?.calories).toBe(500);
  expect(lunch?.protein).toBe(15);
  expect(meals.find((m) => m.slot === 'Breakfast')?.calories).toBe(150);
});

test('mealsFromLogs sends an unknown meal_type to Snacks', () => {
  const meals = mealsFromLogs([foodLog({ meal_type: 'brunch' })]);
  expect(meals[0].slot).toBe('Snacks');
});

// The client half of the double-count fix. mealsFromLogs used to DROP `status`,
// so every hydrated row looked confirmed and foodStore.recompute's
// under-review exclusion could never fire on fetched data — a scan still
// awaiting review counted toward the day the moment the log refreshed.
test('mealsFromLogs carries status through so under-review rows stay out of totals', () => {
  const meals = mealsFromLogs([
    foodLog({ id: 'a', calories: 200, status: 'confirmed' }),
    foodLog({ id: 'b', calories: 500, status: 'ready' }),
  ]);
  const lunch = meals.find((m) => m.slot === 'Lunch');
  expect(lunch?.items.map((i) => i.status)).toEqual(['confirmed', 'ready']);
});

test('mealsFromLogs leaves status undefined for a non-scan row', () => {
  // A manual entry has no status lifecycle; undefined must count normally.
  const meals = mealsFromLogs([foodLog({ id: 'a', calories: 120 })]);
  expect(meals[0].items[0].status).toBeUndefined();
});

test('streakFromApi maps streak + derives gymLoggedToday/freezes', () => {
  const prev: Streak = { current: 0, longest: 0, totalGymDays: 42, freezesAvailable: 1, gymLoggedToday: false };
  const row: GymStreak = { current_streak: 5, longest_streak: 10, last_gym_date: todayISO(), freeze_used: false };
  const s = streakFromApi(row, prev);
  expect(s.current).toBe(5);
  expect(s.longest).toBe(10);
  expect(s.totalGymDays).toBe(42); // carried from prev (not server-tracked)
  expect(s.freezesAvailable).toBe(1);
  expect(s.gymLoggedToday).toBe(true);
});

test('streakFromApi: a used freeze leaves 0 available', () => {
  const prev: Streak = { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 1, gymLoggedToday: false };
  const s = streakFromApi({ current_streak: 1, longest_streak: 1, last_gym_date: '2000-01-01', freeze_used: true }, prev);
  expect(s.freezesAvailable).toBe(0);
  expect(s.gymLoggedToday).toBe(false);
});

test('sessionsFromApi maps rows and defaults duration to 0', () => {
  const rows: GymSession[] = [
    { id: 'g1', user_id: 'u', date: todayISO(), name: 'Push', notes: null, duration_minutes: null, created_at: '2026-07-14T00:00:00Z' },
  ];
  const out = sessionsFromApi(rows);
  expect(out[0].id).toBe('g1');
  expect(out[0].date).toBe('Today');
  expect(out[0].durationMin).toBe(0);
});

test('savedFoodFromApi maps snake→camel', () => {
  const r: SavedFood = {
    id: 's1', user_id: 'u', food_name: 'Oats', brand: 'Quaker', barcode: null,
    calories: 380, protein: 13, carbs: 67, fat: 7, fibre: 10, serving_size: 40, serving_unit: 'g', created_at: '2026-07-14',
  };
  const f = savedFoodFromApi(r);
  expect(f).toMatchObject({ id: 's1', name: 'Oats', brand: 'Quaker', servingG: 40, calories: 380 });
});

test('subscriptionFromApi returns null for status none, maps otherwise', () => {
  const mock = { plan: 'Pro', price: 9.99, status: 'trial' as const, trialStart: new Date(), trialEnd: new Date(), renewsOn: new Date() };
  const none: SubscriptionStatus = { status: 'none', is_active: false, platform: null, plan_interval: null, expires_at: null };
  expect(subscriptionFromApi(none, mock)).toBeNull();
  const active: SubscriptionStatus = { status: 'active', is_active: true, platform: 'ios', plan_interval: 'month', expires_at: '2026-08-01T00:00:00Z' };
  expect(subscriptionFromApi(active, mock)?.status).toBe('active');
});

test('barcodeProductFromApi builds serving options', () => {
  const r: FoodSearchResult = {
    food_name: 'Cola', brand: 'Brand', barcode: '123', calories: 42, protein: 0, carbs: 11, fat: 0, fibre: 0,
    serving_size: 330, serving_unit: 'ml', source: 'off',
  };
  const p = barcodeProductFromApi(r);
  expect(p.name).toBe('Cola');
  expect(p.kcalPer100).toBe(42);
  expect(p.servingOptions).toContain(330);
});
