// PHASE3_ROWS.md row 15, Training detail (src/app/dashboard/training.tsx) states.
// @/lib/api is mocked at the boundary, so the real useGymRange and useEnergyRange
// run. A failed sessions read shows the LoadFailedNotice, not 'No sessions', and
// its Retry re-runs the read; a successful empty read shows the empty state; a
// failed energy read shows its own notice in the energy card, not 'No energy data'.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TrainingDetailScreen from '@/app/dashboard/training';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { todayISO } from '@/lib/data/mappers';
import { act, findAll, renderScreen } from './helpers';

const mockListSessions = jest.fn();
const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: { listSessions: (...args: unknown[]) => mockListSessions(...args) },
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

async function renderTraining() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TrainingDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderTraining>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const retryButton = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];

beforeEach(() => {
  mockListSessions.mockReset();
  mockGetWeek.mockReset();
  mockGetWeek.mockResolvedValue({ days: [] });
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a failed sessions read shows the load failure and Retry runs the read again', async () => {
  mockListSessions.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderTraining();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.dashboard.trainingNoSessionsTitle)).toBe(false);
  expect(mockListSessions).toHaveBeenCalledTimes(1);

  const retry = retryButton(tree);
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(mockListSessions).toHaveBeenCalledTimes(2);
});

test('a successful read with no sessions shows the empty state', async () => {
  mockListSessions.mockResolvedValue([]);
  const tree = await renderTraining();

  expect(hasText(tree, en.dashboard.trainingNoSessionsTitle)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('a failed energy read shows its own notice in the energy card, in English and Spanish', async () => {
  const today = todayISO();
  mockListSessions.mockResolvedValue([
    { id: 's1', user_id: 'u1', date: today, name: 'Push day', notes: null, duration_minutes: 40, created_at: `${today}T09:00:00Z` },
  ]);
  mockGetWeek.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderTraining();

  expect(hasText(tree, en.dashboard.energyLoadFailed)).toBe(true);
  expect(hasText(tree, en.dashboard.trainingNoEnergyTitle)).toBe(false);
  expect(mockGetWeek).toHaveBeenCalledTimes(2);

  await act(async () => {
    (retryButton(tree).props.onPress as () => void)();
  });
  await settle();
  expect(mockGetWeek).toHaveBeenCalledTimes(4);

  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const spanish = await renderTraining();
  expect(hasText(spanish, es.dashboard.energyLoadFailed)).toBe(true);
});
