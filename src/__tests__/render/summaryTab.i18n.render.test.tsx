// PHASE3_ROWS.md row 15, Summary tab (src/app/(tabs)/index.tsx) copy in Spanish.
// The screen's read hooks are mocked by module path, so nothing reaches the
// network. The Macros card title, scope and label, the plan card label and the
// gym logged toast are all read from es.json.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestInstance } from 'react-test-renderer';

import DashboardScreen from '@/app/(tabs)/index';
import i18n from '@/lib/i18n';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const MACROS = {
  calories: { consumed: 0, target: 2100 },
  protein: { consumed: 0, target: 150 },
  carbs: { consumed: 0, target: 240 },
  fat: { consumed: 0, target: 70 },
  fibre: { consumed: 0, target: 30 },
};

const mockShowToast = jest.fn();

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useDashboard: () => ({
    data: {
      profile: null,
      streak: { current: 0, longest: 0, gymLoggedToday: false },
      macros: MACROS,
      plan: [{ time: '12:30', title: 'Lunch', kind: 'meal', targetKcal: 600 }],
      planReason: null,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useFibreConsumed: () => null,
  logGymSession: jest.fn(),
}));
jest.mock('@/lib/data/energy', () => ({
  ...jest.requireActual('@/lib/data/energy'),
  useEnergyWeek: () => ({ week: null, loading: true, refetch: jest.fn() }),
}));
jest.mock('@/lib/data/gymRange', () => ({
  ...jest.requireActual('@/lib/data/gymRange'),
  useGymRange: () => ({ sessions: [], dates: [], loading: true, error: false, refetch: jest.fn() }),
}));
jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: (...args: unknown[]) => mockShowToast(...args),
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

type Tree = Awaited<ReturnType<typeof renderSummary>>;
const byLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label);
const textsIn = (node: ReactTestInstance) =>
  node.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);

beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('the Macros card title, scope and label and the plan card label read from es.json', async () => {
  const tree = await renderSummary();

  const macrosCard = byLabel(tree, es.dashboard.macrosCardLabel)[0];
  expect(macrosCard).toBeDefined();
  const macrosText = textsIn(macrosCard);
  expect(macrosText).toContain(es.nutrition.macrosTitle);
  expect(macrosText).toContain(es.foodLog.today);

  expect(byLabel(tree, es.dashboard.planCardLabel).length).toBeGreaterThan(0);
});

test('logging a gym session shows the toast from es.json', async () => {
  const tree = await renderSummary();

  const logButton = byLabel(tree, es.addMenu.logGymSession).find((n) => typeof n.props.onPress === 'function');
  expect(logButton).toBeDefined();
  await act(async () => {
    (logButton!.props.onPress as () => void)();
  });
  expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ message: es.dashboard.gymLoggedToast }));
});
