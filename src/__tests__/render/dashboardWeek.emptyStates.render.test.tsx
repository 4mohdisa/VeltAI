// PHASE3_ROWS.md row 15, This week detail (src/app/dashboard/week.tsx) states.
// @/lib/api is mocked at the boundary, so the real useEnergyRange runs. A failed
// energy read shows the LoadFailedNotice, not 'No days yet', and its Retry re-runs
// the read; a successful empty read still shows the empty state.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WeekDetailScreen from '@/app/dashboard/week';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) },
  },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonCard: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderWeek() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <WeekDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderWeek>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

beforeEach(() => {
  mockGetWeek.mockReset();
});

test('a failed energy read shows the load failure and Retry runs the read again', async () => {
  mockGetWeek.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderWeek();

  expect(hasText(tree, en.dashboard.energyLoadFailed)).toBe(true);
  expect(hasText(tree, en.dashboard.weekNoDaysTitle)).toBe(false);
  expect(mockGetWeek).toHaveBeenCalledTimes(2);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(mockGetWeek).toHaveBeenCalledTimes(4);
});

test('a successful read with no days shows the empty state', async () => {
  mockGetWeek.mockResolvedValue({ days: [] });
  const tree = await renderWeek();

  expect(hasText(tree, en.dashboard.weekNoDaysTitle)).toBe(true);
  expect(hasText(tree, en.dashboard.weekNoDaysMessage)).toBe(true);
  expect(hasText(tree, en.dashboard.energyLoadFailed)).toBe(false);
});
