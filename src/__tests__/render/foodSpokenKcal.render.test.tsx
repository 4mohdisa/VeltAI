// PHASE3_ROWS.md row 15, food screen spoken energy (src/app/(tabs)/food.tsx).
// VoiceOver reads the food row and the meal header energy as "1,250 calories"
// (goals.caloriesSpoken, as on the goals screen), not "1,250 kcal"; a kJ figure
// keeps its abbreviation. Mocks GET /api/food/logs the foodLogRowMotion way.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodLogScreen from '@/app/(tabs)/food';
import { useFoodStore } from '@/lib/data/foodStore';
import { todayISO } from '@/lib/data/mappers';
import { useSettingsStore } from '@/lib/settings/store';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (see foodLogRowMotion.render.test.tsx).
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const today = todayISO();
const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
const LOGGED_ROW = {
  id: 'log1',
  user_id: 'u1',
  date: today,
  meal_type: 'lunch',
  food_name: 'Rice',
  brand: null,
  barcode: null,
  quantity: 200,
  unit: 'g',
  calories: 1250,
  protein: 8,
  carbs: 88,
  fat: 2,
  fibre: 0,
  source: null,
  created_at: `${today}T12:30:00Z`,
  status: 'confirmed',
};

beforeEach(() => {
  useFoodStore.getState().reset();
  useSettingsStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/food/logs') ? json([LOGGED_ROW]) : json([]),
  );
});

async function spokenLabels(): Promise<{ row: string; header: string }> {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const label = (prefix: string) =>
    findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(prefix))[0]
      ?.props.accessibilityLabel as string;
  return { row: label('Rice, '), header: label(`${en.addMenu.lunch}, `) };
}

test('kcal: the food row and meal header speak "calories", not "kcal"', async () => {
  const { row, header } = await spokenLabels();
  for (const label of [row, header]) {
    expect(label).toContain(`1,250 ${en.goals.caloriesSpoken}`);
    expect(label).not.toContain('kcal');
  }
});

test('kJ: the food row and meal header keep the kJ abbreviation', async () => {
  useSettingsStore.getState().setUnit('energy', 'kJ');
  const { row, header } = await spokenLabels();
  for (const label of [row, header]) {
    expect(label).toMatch(/, 5,230 kJ$/);
    expect(label).not.toContain(en.goals.caloriesSpoken);
  }
});
