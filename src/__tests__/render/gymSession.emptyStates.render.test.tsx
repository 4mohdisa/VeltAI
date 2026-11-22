// PHASE3_ROWS.md row 14, Gym log session screen (src/app/gym/session.tsx) states
// with no exercises. Mounts the real screen with fetch stubbed and checks each
// no-data state shows its own copy from en.json: nothing scheduled, a rest day,
// and a failed read of today, which must not read as "Nothing scheduled". The
// header copy is checked in English and again in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymSessionScreen from '@/app/gym/session';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/gym/session',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
// A 4xx is not retried (src/lib/api.ts retries only network errors and 5xx), so the failure lands at once.
const failed = () => Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'Bad request' }) });

const today = (isRestDay: boolean) => ({
  day_of_week: 4,
  day_name: 'Thursday',
  is_rest_day: isRestDay,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
});

/** Mounts the screen with /api/gym/today answering `todayResponse`. */
async function renderSession(todayResponse: () => Promise<unknown>) {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/gym/today') ? todayResponse() : json([]),
  );
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymSessionScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderSession>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasButton = (tree: Tree, title: string) => findAll(tree, (p) => p.title === title).length > 0;

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a day with nothing scheduled shows the empty state with one Add an exercise action', async () => {
  const tree = await renderSession(() => json(today(false)));
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(true);
  expect(hasText(tree, en.gymSession.emptyMessage)).toBe(true);
  expect(hasButton(tree, en.gymSession.addExercise)).toBe(true);
  expect(hasText(tree, en.gymSession.eyebrow)).toBe(true);
  expect(hasText(tree, en.gymSession.defaultTitle)).toBe(true);
});

test('Spanish: the header and empty state switch to es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = await renderSession(() => json(today(false)));
  expect(hasText(tree, es.gymSession.defaultTitle)).toBe(true);
  expect(hasText(tree, es.gymSession.nothingScheduled)).toBe(true);
});

test('a rest day reuses the gymLog rest-day title', async () => {
  const tree = await renderSession(() => json(today(true)));
  expect(hasText(tree, en.gymLog.restDayTitle)).toBe(true);
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(false);
});

test('a failed read of today shows the load failure, not "Nothing scheduled"', async () => {
  const tree = await renderSession(failed);
  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymSession.nothingScheduled)).toBe(false);
});
