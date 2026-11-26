// Fix 22, This week detail (src/app/dashboard/week.tsx): Net switches the hero
// chart to fourteen days of net, and a tapped Daily net bar names that day's net
// under the chart. Same boundary mocks as week.rangeSeparator.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WeekDetailScreen from '@/app/dashboard/week';
import { formatRelativeDate } from '@/lib/formatting';
import en from '@/lib/i18n/locales/en.json';
import type { EnergyBalance } from '@/lib/types';
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

// Sunday 13 September 2026: the two reads are 7-13 Sept and 31 Aug-6 Sept.
jest.useFakeTimers({ now: new Date(2026, 8, 13, 9, 0, 0), doNotFake: ['setImmediate'] });

const day = (date: string, net: number | null): EnergyBalance => ({
  date,
  calories_in: 2000,
  calories_out_bmr: net == null ? null : 1500,
  calories_out_exercise: net == null ? null : 300,
  calories_out_total: net == null ? null : 2000 - net,
  net_balance: net,
  target: 2100,
  variance: -100,
  status: net == null ? null : net < 0 ? 'deficit' : 'surplus',
} as EnergyBalance);

const range = (first: string, nets: (number | null)[]) =>
  nets.map((n, i) => {
    const d = new Date(`${first}T00:00:00`);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return day(iso, n);
  });

const RECENT = range('2026-09-07', [200, -150, null, 85, -300, 120, -40]);
const EARLIER = range('2026-08-31', [100, -50, 60, -70, 80, -90, 110]);

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
const texts = (tree: Tree) => findAll(tree, (p) => typeof p.children === 'string').map((n) => n.props.children as string);
const press = async (tree: Tree, label: string, index = 0) => {
  const target = findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[index];
  expect(target).toBeDefined();
  await act(async () => {
    (target.props.onPress as () => void)();
  });
};
const summaryOf = (tree: Tree, text: string) => findAll(tree, (p) => p.accessibilityLabel === text).length > 0;

beforeEach(() => {
  mockGetWeek.mockReset();
  mockGetWeek.mockImplementation((end: string) => Promise.resolve({ days: end === '2026-09-13' ? RECENT : EARLIER }));
});

test('Net switches the hero chart from intake to fourteen days of net', async () => {
  const tree = await renderWeek();
  expect(texts(tree)).toContain(en.dashboard.caloriesEaten);
  const dailyNetTitles = () => texts(tree).filter((l) => l === en.dashboard.dailyNet).length;
  const before = dailyNetTitles();

  await press(tree, en.dashboard.net);

  expect(texts(tree)).not.toContain(en.dashboard.caloriesEaten);
  // The hero's own chart: 13 of 14 days carry a net (9 Sept has none), largest 300 kcal × 1.16 headroom.
  expect(summaryOf(tree, 'Daily net for 13 of the last 14 days, largest 348 kcal.')).toBe(true);
  // Daily net is now the hero title as well as the secondary card's.
  expect(dailyNetTitles()).toBe(before * 2);
});

test("a tapped bar shows that day's net, and a day without one says so", async () => {
  const tree = await renderWeek();
  const tue = formatRelativeDate(new Date('2026-09-08T00:00:00'));
  const wed = formatRelativeDate(new Date('2026-09-09T00:00:00'));
  // Nothing is named before a tap.
  expect(texts(tree).some((l) => l.startsWith(`${tue}:`))).toBe(false);

  await press(tree, 'Tue');
  expect(texts(tree)).toContain(`${tue}: -150 kcal net`);

  await press(tree, 'Wed');
  expect(texts(tree)).toContain(`${wed}: no net computed`);
  expect(texts(tree)).not.toContain(`${tue}: -150 kcal net`);
});

test('an empty week shows the empty state and no chart', async () => {
  mockGetWeek.mockReset();
  mockGetWeek.mockResolvedValue({ days: [] });
  const tree = await renderWeek();

  expect(texts(tree)).toContain(en.dashboard.weekNoDaysTitle);
  expect(texts(tree)).not.toContain(en.dashboard.dailyNet);
  expect(findAll(tree, (p) => p.accessibilityLabel === en.dashboard.net)).toHaveLength(0);
});
