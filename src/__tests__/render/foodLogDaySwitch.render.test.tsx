// Switching day on the Food tab is a new read.
//
// useFoodLog hands useHydration a new hydrate per day, but useHydration only
// raised isLoading on mount and refetch. So after a day switch the hook said
// "not loading" with no rows yet, and the Food tab rendered "No meals yet" for a
// day it had not fetched (EMPTY_STATES_AUDIT.md, Food tab, no data for day).
import { useFoodLog } from '@/lib/data';
import { useFoodStore } from '@/lib/data/foodStore';
import { act, renderScreen } from './helpers';

type State = { isLoading: boolean; meals: number };

// Each GET /api/food-logs waits until the test releases it.
const pending: (() => void)[] = [];
const ROW = {
  id: '00000000-0000-4000-8000-000000000001',
  date: '2026-11-20',
  meal_type: 'Lunch',
  food_name: 'Tuna sandwich',
  calories: 480,
  protein: 32,
  carbs: 46,
  fat: 16,
  fibre: 5,
  quantity: 1,
  unit: 'serving',
  source: 'manual',
  status: 'confirmed',
};

beforeEach(() => {
  pending.length = 0;
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    const rows = url.includes('2026-11-20') ? [ROW] : [];
    return new Promise((resolve) => {
      pending.push(() => resolve({ ok: true, status: 200, json: async () => ({ data: rows, error: null }) }));
    });
  });
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

const release = async () => {
  while (pending.length > 0) pending.shift()!();
  await flush();
};

function mount(): State[] {
  const seen: State[] = [];
  function Probe() {
    const { data, isLoading } = useFoodLog();
    seen.push({ isLoading, meals: data.length });
    return null;
  }
  renderScreen(<Probe />);
  return seen;
}

const last = (seen: State[]) => seen[seen.length - 1];

test('a day switch reports loading until that day has been read', async () => {
  act(() => useFoodStore.getState().setSelectedDate('2026-11-21'));
  const seen = mount();
  await release();
  expect(last(seen)).toEqual({ isLoading: false, meals: 0 });

  act(() => useFoodStore.getState().setSelectedDate('2026-11-20'));
  await flush();
  // Was { isLoading: false, meals: 0 }: the Food tab's "No meals yet" for a day
  // whose read had not come back.
  expect(last(seen).isLoading).toBe(true);

  await release();
  expect(last(seen)).toEqual({ isLoading: false, meals: 1 });
});

test('a day with nothing logged settles as not loading and empty', async () => {
  act(() => useFoodStore.getState().setSelectedDate('2026-11-21'));
  const seen = mount();
  expect(last(seen).isLoading).toBe(true);
  await release();
  expect(last(seen)).toEqual({ isLoading: false, meals: 0 });
});
