// PHASE3_ROWS.md row 13, Meal history screen (src/app/food/history.tsx) strings.
// The screen reads the api directly (no data hook), so the two calls it makes
// are mocked: a failed day summary must show ErrorState with history.loadFailed
// from en.json, not a hardcoded English line.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealHistoryScreen from '@/app/food/history';
import { api } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      gym: { listSessions: jest.fn() },
      foodLogs: { summary: jest.fn() },
    },
  };
});

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('a failed history read shows the history.loadFailed copy from en.json', async () => {
  (api.gym.listSessions as jest.Mock).mockResolvedValue([]);
  (api.foodLogs.summary as jest.Mock).mockRejectedValue(new Error('Network request failed'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealHistoryScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  expect(findAll(tree, (p) => p.children === en.history.loadFailed).length).toBeGreaterThan(0);
  expect(findAll(tree, (p) => p.children === en.history.emptyTitle)).toHaveLength(0);
});
