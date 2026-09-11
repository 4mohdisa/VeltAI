// Zustand store actions, driven via getState() — no rendering. Each suite
// resets its store in beforeEach so tests are order-independent.
import { addDays } from '@/lib/data/foodDays';
import { todayISO } from '@/lib/data/mappers';
import { useFoodStore, type StoredFoodItem } from '@/lib/data/foodStore';
import { useGymStore } from '@/lib/data/gymStore';
import { useUserStore } from '@/lib/data/userStore';
import { aiGoals, useSettingsStore } from '@/lib/settings/store';
import { deriveGoals } from '@/lib/goals/derive';
import { mockGymSessions, mockMeals, mockSavedFoods, mockStreak, mockUser } from '@/lib/mock/data';
import { IMPERIAL_PREFERENCES, METRIC_PREFERENCES } from '@/lib/units';

const item = (over: Partial<StoredFoodItem> = {}) => ({
  name: 'Test food',
  quantityG: 100,
  calories: 200,
  protein: 10,
  carbs: 20,
  fat: 5,
  ...over,
});

const mealTotals = (m: { items: StoredFoodItem[] }) =>
  m.items.reduce(
    (a, it) =>
      it.status === 'ready' || it.status === 'failed'
        ? a
        : { calories: a.calories + it.calories, protein: a.protein + it.protein, carbs: a.carbs + it.carbs, fat: a.fat + it.fat },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const food = () => useFoodStore.getState();
const findItem = (id: string) => {
  for (const m of food().meals) {
    const it = m.items.find((i) => i.id === id);
    if (it) return { meal: m, it };
  }
  return undefined;
};

describe('foodStore', () => {
  beforeEach(() => food().reset());

  test('seed recomputes meal totals from items', () => {
    for (const m of food().meals) {
      expect({ calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }).toEqual(mealTotals(m));
    }
  });

  test('logMeal appends to an existing slot and recomputes totals', () => {
    const before = food().meals.find((m) => m.slot === 'Breakfast')!;
    const id = food().logMeal('Breakfast', item(), 'manual');
    const after = food().meals.find((m) => m.slot === 'Breakfast')!;
    expect(after.items).toHaveLength(before.items.length + 1);
    expect(after.items.at(-1)!.id).toBe(id);
    expect(after.calories).toBe(before.calories + 200);
    expect(after.protein).toBe(before.protein + 10);
  });

  test('logMeal creates the meal when the slot has none (Dinner not seeded)', () => {
    expect(food().meals.some((m) => m.slot === 'Dinner')).toBe(false);
    const id = food().logMeal('Dinner', item({ calories: 640, protein: 42, carbs: 55, fat: 22 }), 'voice');
    const dinner = food().meals.find((m) => m.slot === 'Dinner')!;
    expect(dinner.method).toBe('voice');
    expect(dinner.items.map((i) => i.id)).toEqual([id]);
    expect({ calories: dinner.calories, protein: dinner.protein, carbs: dinner.carbs, fat: dinner.fat }).toEqual({
      calories: 640,
      protein: 42,
      carbs: 55,
      fat: 22,
    });
  });

  test.each([
    ['pending true', true],
    ['pending false', false],
  ])('logMeal stores the pending flag (%s)', (_label, pending) => {
    const id = food().logMeal('Dinner', item(), 'photo', pending);
    expect(findItem(id)!.it.pending).toBe(pending);
  });

  test('deleteFoodItem removes the row and recomputes totals', () => {
    const breakfast = food().meals.find((m) => m.slot === 'Breakfast')!;
    const victim = breakfast.items[0];
    food().deleteFoodItem(victim.id);
    const after = food().meals.find((m) => m.slot === 'Breakfast')!;
    expect(after.items.some((i) => i.id === victim.id)).toBe(false);
    expect(after.calories).toBe(breakfast.calories - victim.calories);
  });

  test('deleteFoodItem drops the meal when its last item is removed', () => {
    const id = food().logMeal('Dinner', item(), 'manual');
    food().deleteFoodItem(id);
    expect(food().meals.some((m) => m.slot === 'Dinner')).toBe(false);
  });

  test('editFoodItem patches fields and recomputes totals', () => {
    const id = food().logMeal('Dinner', item(), 'manual');
    food().editFoodItem(id, { calories: 999, name: 'Edited' });
    const { meal, it } = findItem(id)!;
    expect(it.name).toBe('Edited');
    expect(meal.calories).toBe(999);
  });

  test('resolvePending swaps in the real item and clears pending', () => {
    const id = food().logMeal('Dinner', item({ name: 'Analyzing…', calories: 0, protein: 0, carbs: 0, fat: 0 }), 'photo', true);
    food().resolvePending(id, item({ name: 'Grilled chicken', calories: 330, protein: 45, carbs: 0, fat: 12 }));
    const { meal, it } = findItem(id)!;
    expect(it.pending).toBe(false);
    expect(it.name).toBe('Grilled chicken');
    expect(meal.calories).toBe(330);
  });

  test.each([
    ['ready excluded from totals', 'ready' as const, 0],
    ['failed excluded from totals', 'failed' as const, 0],
    ['confirmed counted in totals', 'confirmed' as const, 500],
    ['analyzing counted in totals', 'analyzing' as const, 500],
  ])('setItemStatus: %s', (_label, status, expectedCalories) => {
    const id = food().logMeal('Dinner', item({ calories: 500 }), 'photo');
    food().setItemStatus(id, status);
    const { meal, it } = findItem(id)!;
    expect(it.status).toBe(status);
    expect(meal.calories).toBe(expectedCalories);
  });

  test('updateScannedItem patches scan fields and recomputes on status flip', () => {
    const id = food().logMeal('Dinner', item({ calories: 500 }), 'photo');
    food().setItemStatus(id, 'ready');
    expect(findItem(id)!.meal.calories).toBe(0);
    food().updateScannedItem(id, {
      status: 'confirmed',
      quantityG: 150,
      calories: 750,
      confidence: 0.9,
      scanSessionId: 'scan_1',
      estimatedWeightG: 140,
    });
    const { meal, it } = findItem(id)!;
    expect(it.quantityG).toBe(150);
    expect(it.confidence).toBe(0.9);
    expect(it.scanSessionId).toBe('scan_1');
    expect(it.estimatedWeightG).toBe(140);
    expect(meal.calories).toBe(750);
  });

  test('saveFood prepends and returns the new id', () => {
    const id = food().saveFood({ name: 'Halloumi wrap', servingG: 220, calories: 480, protein: 24, carbs: 40, fat: 24 });
    expect(food().savedFoods[0]).toMatchObject({ id, name: 'Halloumi wrap' });
    expect(food().savedFoods).toHaveLength(mockSavedFoods.length + 1);
  });

  test('editSavedFood patches only the target', () => {
    food().editSavedFood('s1', { name: 'Oats v2', calories: 300 });
    const edited = food().savedFoods.find((f) => f.id === 's1')!;
    expect(edited).toMatchObject({ name: 'Oats v2', calories: 300, protein: mockSavedFoods[0].protein });
    expect(food().savedFoods.find((f) => f.id === 's2')!.name).toBe(mockSavedFoods[1].name);
  });

  test('unsaveFood removes the row', () => {
    food().unsaveFood('s1');
    expect(food().savedFoods.some((f) => f.id === 's1')).toBe(false);
    expect(food().savedFoods).toHaveLength(mockSavedFoods.length - 1);
  });

  test('reset restores the seed', () => {
    food().logMeal('Dinner', item(), 'manual');
    food().unsaveFood('s1');
    food().reset();
    expect(food().meals.map((m) => m.slot)).toEqual(mockMeals.map((m) => m.slot));
    expect(food().savedFoods).toEqual(mockSavedFoods);
  });
});

describe('gymStore', () => {
  const gym = () => useGymStore.getState();
  // V7: days are recorded by ISO date, not by a slot in a 30-cell grid.
  const today = () => todayISO();
  const inDays = (n: number) => addDays(today(), n);
  beforeEach(() => gym().reset());

  test('logGymSession records today by date, extends streak, prepends session', () => {
    gym().logGymSession({ durationMin: 45, effort: 9 });
    const s = gym();
    expect(s.streak.gymLoggedToday).toBe(true);
    expect(s.streak.current).toBe(mockStreak.current + 1);
    expect(s.streak.totalGymDays).toBe(mockStreak.totalGymDays + 1);
    expect(s.streak.longest).toBe(Math.max(mockStreak.longest, mockStreak.current + 1));
    expect(s.loggedDays).toEqual([{ date: today(), minutes: 45 }]);
    expect(s.sessions[0]).toMatchObject({ date: 'Today', durationMin: 45, effort: 9 });
    // mock already had a 'Today' session — it gets replaced, not duplicated.
    expect(s.sessions.filter((x) => x.date === 'Today')).toHaveLength(1);
  });

  test('a quick log with no duration records null minutes, never an invented length', () => {
    gym().logGymSession();
    expect(gym().loggedDays).toEqual([{ date: today(), minutes: null }]);
  });

  test('logGymSession is idempotent same-day', () => {
    gym().logGymSession();
    const after = gym();
    gym().logGymSession();
    expect(gym().streak).toEqual(after.streak);
    expect(gym().sessions).toEqual(after.sessions);
    expect(gym().loggedDays).toEqual(after.loggedDays);
  });

  test('logGymSession retains the energy level (Phase 14: was silently discarded)', () => {
    gym().logGymSession({ durationMin: 30, energy: 4 });
    expect(gym().sessions[0]).toMatchObject({ durationMin: 30, energy: 4 });
  });

  test('applyFreeze records the chosen day by date, not always today (Phase 14)', () => {
    const before = gym().streak.freezesAvailable;
    gym().applyFreeze(0);
    expect(gym().frozenDates).toEqual([today()]);
    expect(gym().streak.freezesAvailable).toBe(before - 1);
    gym().applyFreeze(3);
    expect(gym().frozenDates).toEqual([today(), inDays(3)]);
    expect(gym().streak.freezesAvailable).toBe(before - 2);
  });

  test('logGymSession updates longest when the streak passes it', () => {
    useGymStore.setState((s) => ({ streak: { ...s.streak, current: 21, longest: 21 } }));
    gym().logGymSession();
    expect(gym().streak.longest).toBe(22);
  });

  test('applyFreeze spends a token and freezes today', () => {
    gym().applyFreeze();
    expect(gym().streak.freezesAvailable).toBe(mockStreak.freezesAvailable - 1);
    expect(gym().frozenDates).toEqual([today()]);
  });

  test('applyFreeze is a no-op with zero tokens', () => {
    useGymStore.setState((s) => ({ streak: { ...s.streak, freezesAvailable: 0 } }));
    const before = gym();
    gym().applyFreeze();
    expect(gym().streak.freezesAvailable).toBe(0);
    expect(gym().frozenDates).toEqual(before.frozenDates);
  });

  test('reset restores the seed', () => {
    gym().logGymSession();
    gym().applyFreeze();
    gym().reset();
    expect(gym().streak).toEqual(mockStreak);
    expect(gym().sessions).toEqual(mockGymSessions);
    expect(gym().loggedDays).toEqual([]);
    expect(gym().frozenDates).toEqual([]);
  });
});

describe('userStore', () => {
  const user = () => useUserStore.getState();
  beforeEach(() => user().resetProfile());

  test('setProfile patches only the given fields', () => {
    user().setProfile({ name: 'Aisha', weightKg: 70 });
    expect(user().profile).toMatchObject({ name: 'Aisha', weightKg: 70, email: mockUser.email, heightCm: 178 });
  });

  test('resetProfile restores defaults', () => {
    user().setProfile({ name: 'Aisha', weightKg: 70, restrictions: ['halal'] });
    user().resetProfile();
    expect(user().profile).toMatchObject({ name: mockUser.name, weightKg: 82, restrictions: [] });
  });
});

describe('settings store', () => {
  const settings = () => useSettingsStore.getState();
  beforeEach(() => {
    useUserStore.getState().resetProfile();
    settings().reset();
  });

  test('seeds metric units and ai goal mode', () => {
    expect(settings().units).toEqual(METRIC_PREFERENCES);
    expect(settings().goalMode).toBe('ai');
    expect(settings().customGoals).toEqual(deriveGoals(useUserStore.getState().profile));
  });

  test.each([
    ['imperial', IMPERIAL_PREFERENCES],
    ['metric', METRIC_PREFERENCES],
  ] as const)('setSystem(%s) swaps the whole preference set', (system, expected) => {
    settings().setSystem(system);
    expect(settings().units).toEqual(expected);
  });

  test('setUnit patches a single dimension', () => {
    settings().setUnit('weight', 'lb');
    expect(settings().units).toEqual({ ...METRIC_PREFERENCES, weight: 'lb' });
  });

  test.each([['custom'], ['ai']] as const)('setGoalMode(%s)', (mode) => {
    settings().setGoalMode(mode);
    expect(settings().goalMode).toBe(mode);
  });

  test('setCustomGoals patches only given macros', () => {
    const before = settings().customGoals;
    settings().setCustomGoals({ calories: 1800, protein: 150 });
    expect(settings().customGoals).toEqual({ ...before, calories: 1800, protein: 150 });
  });

  test('resetGoalsToAi rederives from the current profile', () => {
    settings().setCustomGoals({ calories: 9999 });
    useUserStore.getState().setProfile({ weightKg: 60, goal: 'muscle' });
    settings().resetGoalsToAi();
    expect(settings().customGoals).toEqual(deriveGoals(useUserStore.getState().profile));
    expect(settings().customGoals.calories).not.toBe(9999);
  });

  // useEffectiveGoals is a React hook (subscribes via selectors) so we assert its
  // branch logic on the same state it reads, via getState.
  const effective = () => {
    const s = settings();
    return s.goalMode === 'custom' ? s.customGoals : deriveGoals(useUserStore.getState().profile);
  };

  test('effective goals: ai mode follows the profile', () => {
    const before = effective();
    useUserStore.getState().setProfile({ weightKg: 95 });
    const after = effective();
    expect(after).toEqual(aiGoals());
    expect(after.calories).toBeGreaterThan(before.calories);
  });

  test('effective goals: custom mode returns customGoals and ignores profile changes', () => {
    settings().setGoalMode('custom');
    settings().setCustomGoals({ calories: 1750 });
    useUserStore.getState().setProfile({ weightKg: 95 });
    expect(effective()).toEqual(settings().customGoals);
    expect(effective().calories).toBe(1750);
  });

  test('reset restores seed and rederives ai goals', () => {
    settings().setSystem('imperial');
    settings().setLanguage('ar');
    settings().setGoalMode('custom');
    settings().setMacroSplitBy('percent');
    settings().reset();
    const s = settings();
    expect(s.units).toEqual(METRIC_PREFERENCES);
    expect(s.languageOverride).toBeNull();
    expect(s.goalMode).toBe('ai');
    expect(s.macroSplitBy).toBe('grams');
    expect(s.customGoals).toEqual(aiGoals());
  });

  test('custom calorie targets are clamped to the safety band (1.4.1)', () => {
    // The floor is sex-aware and read from the profile, whose default sex is
    // 'other'. REWRITTEN twice: 2026-08-06 the flat 1200 sat BELOW the
    // server's male floor (client accepted what the server 400'd); 2026-08-08
    // 'other' moved 1350 -> 1500, because declining to state a sex must not
    // buy a more permissive safety limit under 1.4.1 (see DECISIONS.md).
    settings().setCustomGoals({ calories: 0 });
    expect(settings().customGoals.calories).toBe(1500);
    settings().setCustomGoals({ calories: 50000 });
    expect(settings().customGoals.calories).toBe(10000);
    settings().setCustomGoals({ calories: 2200 });
    expect(settings().customGoals.calories).toBe(2200);
    // Non-calorie fields pass through untouched.
    settings().setCustomGoals({ protein: 5 });
    expect(settings().customGoals.protein).toBe(5);
  });
});
