// PHASE3_ROWS.md row 14, Food tab anomaly banner. A failed insights read used to
// leave the banner slot silently empty; the Food tab now reads useInsights'
// isError and shows the shared ErrorState there instead. Mounts the real screen
// (the foodLogRowMotion.render.test.tsx pattern) with useInsights mocked.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodLogScreen from '@/app/(tabs)/food';
import { useInsights } from '@/lib/data/aiBrain';
import { useFoodStore } from '@/lib/data/foodStore';
import type { AIAnomaly } from '@/lib/api';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/data/aiBrain', () => ({ useInsights: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const ANOMALY: AIAnomaly = {
  id: 'anomaly-1',
  title: 'Unusual spike in sodium',
  body: 'Sodium intake was well above your recent average yesterday.',
  dismissed: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

const insights = (isError: boolean, anomalies: AIAnomaly[]) => ({
  insights: [],
  anomalies,
  loading: false,
  isError,
  dismiss: jest.fn(),
});

beforeEach(() => {
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

async function renderFoodLog() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderFoodLog>>;
const errorStates = (tree: Tree) => findAll(tree, (p) => p.testID === 'food-insights-error');
// allText's JSON.stringify trips on a circular prop in the full Food screen tree,
// so match the rendered string children directly.
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

test('a failed insights read shows ErrorState in place of the anomaly banner', async () => {
  (useInsights as jest.Mock).mockReturnValue(insights(true, [ANOMALY]));
  const tree = await renderFoodLog();
  expect(errorStates(tree).length).toBeGreaterThan(0);
  expect(hasText(tree, 'Something went wrong')).toBe(true);
  expect(hasText(tree, 'Unusual spike in sodium')).toBe(false);
});

test('a successful insights read keeps the anomaly banner and no ErrorState', async () => {
  (useInsights as jest.Mock).mockReturnValue(insights(false, [ANOMALY]));
  const tree = await renderFoodLog();
  expect(errorStates(tree)).toHaveLength(0);
  expect(hasText(tree, 'Unusual spike in sodium')).toBe(true);
  expect(hasText(tree, 'Something went wrong')).toBe(false);
});
