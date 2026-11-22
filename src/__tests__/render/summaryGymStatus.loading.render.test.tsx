// PHASE3_ROWS.md row 15, Summary tab GymStatusCard (src/app/(tabs)/index.tsx).
// The screen's read hooks are mocked by module path, so nothing reaches the
// network. While the first dashboard read runs, the gym store still holds its
// seed, so the card and its 'Log gym session' action are not shown; a
// successful read with no session today shows that action; a failed read shows
// the existing streak load-failed notice.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestRenderer } from 'react-test-renderer';

import DashboardScreen from '@/app/(tabs)/index';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const MACROS = {
  calories: { consumed: 0, target: 2100 },
  protein: { consumed: 0, target: 150 },
  carbs: { consumed: 0, target: 240 },
  fat: { consumed: 0, target: 70 },
  fibre: { consumed: 0, target: 30 },
};

const mockDashboard = { isLoading: false, error: null as Error | null };

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useDashboard: () => ({
    data: {
      profile: null,
      streak: { current: 0, longest: 0, gymLoggedToday: false },
      macros: MACROS,
      plan: [],
      planReason: null,
    },
    ...mockDashboard,
    refetch: jest.fn(),
  }),
  useFibreConsumed: () => null,
}));
jest.mock('@/lib/data/energy', () => ({
  ...jest.requireActual('@/lib/data/energy'),
  useEnergyWeek: () => ({ week: null, loading: true, refetch: jest.fn() }),
}));
jest.mock('@/lib/data/gymRange', () => ({
  ...jest.requireActual('@/lib/data/gymRange'),
  useGymRange: () => ({ sessions: [], dates: [], loading: true, error: false, refetch: jest.fn() }),
}));
jest.mock('@/components/ai', () => ({ MorningBriefCard: () => null }));
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonCard: () => null }));
jest.mock('@/components/display/StreakFlame', () => ({ StreakFlame: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function renderSummary() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DashboardScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

// The ScrollView's refreshControl element is circular, so search the host
// tree by props rather than stringifying it.
const hasLabel = (tree: ReactTestRenderer, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;
const hasText = (tree: ReactTestRenderer, text: string) => findAll(tree, (p) => p.children === text).length > 0;

beforeEach(() => {
  mockDashboard.isLoading = false;
  mockDashboard.error = null;
});

test('while the first read is loading, the Log gym session action is not rendered', async () => {
  mockDashboard.isLoading = true;
  const tree = await renderSummary();

  expect(hasLabel(tree, 'Log gym session')).toBe(false);
  expect(hasText(tree, 'Logged today')).toBe(false);
});

test('after a successful read with no session today, the Log gym session action appears', async () => {
  const tree = await renderSummary();

  expect(hasLabel(tree, 'Log gym session')).toBe(true);
  expect(hasText(tree, en.dashboard.streakLoadError)).toBe(false);
});

test('after a failed read, the existing load-failed notice appears', async () => {
  mockDashboard.error = new Error('Network request failed');
  const tree = await renderSummary();

  expect(hasText(tree, en.dashboard.streakLoadError)).toBe(true);
});
